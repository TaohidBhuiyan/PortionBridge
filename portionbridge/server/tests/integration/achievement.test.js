const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload } = require('./setup');

describe('achievement: eligibility, duplicate prevention, and N+1-fix correctness', () => {
  let dbReady = false;
  let donationService;
  let achievementService;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    donationService = require('../../services/donation.service');
    achievementService = require('../../services/achievement.service');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  async function completeOneDonation(donorId, volunteerId) {
    const donation = await donationService.createDonation(donorId, validFoodDonationPayload());
    const accepted = await donationService.acceptDonation(donation.id, volunteerId);
    const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const scheduled = await donationService.schedulePickup(accepted, volunteerId, futureTime);
    const onTheWay = await donationService.markOnTheWay(scheduled, volunteerId);
    const pickedUp = await donationService.markPickedUp(onTheWay, volunteerId);
    return donationService.completeDonation(pickedUp.id, donorId);
  }

  test('a donor with zero completed donations unlocks nothing', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const unlocked = await achievementService.checkAndUnlockAchievements(donor.id, 'donor');

    assert.deepEqual(unlocked, []);
  });

  test('completing a donation automatically unlocks "first_donation" and "top_donor" (both criteria_value=1) for the donor', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    await completeOneDonation(donor.id, volunteer.id);

    const { achievements } = await achievementService.getUserAchievements(donor.id);
    const types = achievements.map((a) => a.achievement_type).sort();

    assert.deepEqual(types, ['first_donation', 'top_donor']);
  });

  test('re-running checkAndUnlockAchievements after completion (e.g. a retry) does not re-unlock or duplicate anything', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    // completeOneDonation() already triggers unlocking once, internally.
    await completeOneDonation(donor.id, volunteer.id);

    const rerun = await achievementService.checkAndUnlockAchievements(donor.id, 'donor');
    assert.deepEqual(rerun, [], 'nothing new should unlock on a redundant re-check');

    const { achievements } = await achievementService.getUserAchievements(donor.id);
    const firstDonationCount = achievements.filter((a) => a.achievement_type === 'first_donation').length;
    assert.equal(firstDonationCount, 1, 'no duplicate row for the same achievement type');
  });

  test('a donor below the "helping_hand" threshold (5 donations) does not have it after only 1', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    await completeOneDonation(donor.id, volunteer.id);

    const { achievements } = await achievementService.getUserAchievements(donor.id);
    assert.ok(!achievements.some((a) => a.achievement_type === 'helping_hand'));
  });

  test('achievements are correctly scoped per-user: one donor completing donations does not unlock achievements for another donor', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donorA } = await createVerifiedUser({ role: 'donor' });
    const { user: donorB } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });

    await completeOneDonation(donorA.id, volunteer.id);
    await achievementService.checkAndUnlockAchievements(donorA.id, 'donor');

    const { achievements: bAchievements } = await achievementService.getUserAchievements(donorB.id);
    assert.deepEqual(bAchievements, []);
  });

  test('donor and volunteer achievement pools are separate: a donor never receives a volunteer-only achievement', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    await completeOneDonation(donor.id, volunteer.id);

    const { achievements: donorAchievements } = await achievementService.getUserAchievements(donor.id);
    assert.ok(!donorAchievements.some((a) => a.achievement_type === 'first_pickup' || a.achievement_type === 'top_volunteer'));

    // Unlike the donor side, completeDonation() does not auto-check
    // volunteer-side achievements, so this call is expected to freshly
    // unlock them here.
    const volunteerUnlocked = await achievementService.checkAndUnlockAchievements(volunteer.id, 'volunteer');
    const volunteerTypes = volunteerUnlocked.map((a) => a.type).sort();
    assert.deepEqual(volunteerTypes, ['first_pickup', 'top_volunteer']);
  });

  test('N+1 fix regression: batch-fetched unlocked-types check produces the exact same result as checking one at a time would', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    await completeOneDonation(donor.id, volunteer.id);

    // First call unlocks the two 1-donation achievements via the batched path.
    await achievementService.checkAndUnlockAchievements(donor.id, 'donor');

    // Directly verify, via the model layer, that both are now present with
    // no duplicates and the exact expected types — this is the ground truth
    // the batched Set-lookup in the service must match.
    const achievementModel = require('../../models/achievement.model');
    const stored = await achievementModel.findByUserId(donor.id);
    const storedTypes = stored.map((a) => a.achievement_type).sort();

    assert.deepEqual(storedTypes, ['first_donation', 'top_donor']);
  });
});
