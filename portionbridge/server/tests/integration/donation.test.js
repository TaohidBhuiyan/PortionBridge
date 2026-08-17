const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload } = require('./setup');

describe('donation: creation, acceptance, status transitions', () => {
  let dbReady = false;
  let donationService;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    donationService = require('../../services/donation.service');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  test('donor can create a donation', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    assert.ok(donation.id);
    assert.equal(donation.status, 'pending');
    assert.equal(donation.donor_id, donor.id);
  });

  test('a volunteer can accept a pending donation', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    const accepted = await donationService.acceptDonation(donation.id, volunteer.id);

    assert.equal(accepted.status, 'accepted');
    assert.equal(accepted.volunteer_id, volunteer.id);
  });

  test('accepting an already-accepted donation is rejected (prevents double-accept)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: firstVolunteer } = await createVerifiedUser({ role: 'volunteer' });
    const { user: secondVolunteer } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    await donationService.acceptDonation(donation.id, firstVolunteer.id);

    await assert.rejects(() => donationService.acceptDonation(donation.id, secondVolunteer.id));
  });

  test('CONCURRENCY: two volunteers racing to accept the same donation — exactly one wins', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volA } = await createVerifiedUser({ role: 'volunteer' });
    const { user: volB } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    // Fire both accept attempts truly concurrently. The row-level lock
    // (SELECT ... FOR UPDATE inside a transaction) inside acceptDonation
    // must serialize these so exactly one succeeds and the other sees
    // the row as no-longer-pending.
    const results = await Promise.allSettled([
      donationService.acceptDonation(donation.id, volA.id),
      donationService.acceptDonation(donation.id, volB.id),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.equal(fulfilled.length, 1, 'exactly one of the two concurrent accepts should succeed');
    assert.equal(rejected.length, 1, 'the other concurrent accept should fail');

    const donationModel = require('../../models/donation.model');
    const final = await donationModel.findById(donation.id);
    assert.equal(final.status, 'accepted');
    assert.ok(
      final.volunteer_id === volA.id || final.volunteer_id === volB.id,
      'the winning volunteer should be recorded as volunteer_id'
    );
  });

  test('a valid status transition (accepted -> scheduled) succeeds', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const donationModel = require('../../models/donation.model');
    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const created = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(created.id, volunteer.id);
    const acceptedDonation = await donationModel.findById(created.id);

    const scheduled = await donationService.schedulePickup(acceptedDonation, volunteer.id, new Date(Date.now() + 60 * 60 * 1000).toISOString());

    assert.equal(scheduled.status, 'scheduled');
  });

  test('an invalid status transition (pending -> on_the_way, skipping accepted/scheduled) is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const donationModel = require('../../models/donation.model');
    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const created = await donationService.createDonation(donor.id, validFoodDonationPayload());
    // Deliberately skip acceptDonation/schedulePickup — donation is still 'pending'.
    const pendingDonation = await donationModel.findById(created.id);

    await assert.rejects(() => donationService.markOnTheWay(pendingDonation, volunteer.id, {}));
  });

  test('an unassigned volunteer cannot advance a donation that isn\'t theirs', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const donationModel = require('../../models/donation.model');
    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: assignedVolunteer } = await createVerifiedUser({ role: 'volunteer' });
    const { user: otherVolunteer } = await createVerifiedUser({ role: 'volunteer' });
    const created = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(created.id, assignedVolunteer.id);
    const acceptedDonation = await donationModel.findById(created.id);

    await assert.rejects(() => donationService.schedulePickup(acceptedDonation, otherVolunteer.id, new Date(Date.now() + 3600000).toISOString()));
  });
});
