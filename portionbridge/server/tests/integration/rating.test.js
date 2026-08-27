const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload } = require('./setup');

describe('rating: creation rules, boundaries, and authorization', () => {
  let dbReady = false;
  let donationService;
  let ratingService;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    donationService = require('../../services/donation.service');
    ratingService = require('../../services/rating.service');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  /**
   * Drives a fresh donation through its full real lifecycle to COMPLETED,
   * exercising the actual state machine rather than writing a shortcut
   * status directly — a rating should only ever be reachable this way in
   * production, so the test setup mirrors that.
   */
  async function createCompletedDonation() {
    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    const accepted = await donationService.acceptDonation(donation.id, volunteer.id);

    const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const scheduled = await donationService.schedulePickup(accepted, volunteer.id, futureTime);
    const onTheWay = await donationService.markOnTheWay(scheduled, volunteer.id);
    const pickedUp = await donationService.markPickedUp(onTheWay, volunteer.id);
    const completed = await donationService.completeDonation(pickedUp.id, donor.id);

    return { donor, volunteer, donation: completed };
  }

  test('the donor can rate a completed donation, and the rating links donor + volunteer correctly', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { donor, volunteer, donation } = await createCompletedDonation();

    const rating = await ratingService.createRating(donor.id, {
      donationId: donation.id,
      stars: 5,
      comment: 'Great service',
    });

    assert.equal(rating.rated_by, donor.id);
    assert.equal(rating.rated_user, volunteer.id);
    assert.equal(rating.stars, 5);
    assert.equal(rating.donation_request_id, donation.id);
  });

  test('rating a donation that is not yet completed is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(donation.id, volunteer.id); // still just 'accepted'

    await assert.rejects(
      () => ratingService.createRating(donor.id, { donationId: donation.id, stars: 5 }),
      (err) => {
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  test('a user who is neither the donor nor the volunteer cannot rate the donation', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donation } = await createCompletedDonation();
    const { user: outsider } = await createVerifiedUser({ role: 'donor' });

    await assert.rejects(
      () => ratingService.createRating(outsider.id, { donationId: donation.id, stars: 5 }),
      (err) => {
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  test('duplicate rating of the same donation is rejected (application check)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, donation } = await createCompletedDonation();
    await ratingService.createRating(donor.id, { donationId: donation.id, stars: 4 });

    await assert.rejects(
      () => ratingService.createRating(donor.id, { donationId: donation.id, stars: 2 }),
      (err) => {
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  test('two near-simultaneous rating attempts on the same donation: exactly one succeeds (DB UNIQUE constraint, not just app logic)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, donation } = await createCompletedDonation();

    const results = await Promise.allSettled([
      ratingService.createRating(donor.id, { donationId: donation.id, stars: 5 }),
      ratingService.createRating(donor.id, { donationId: donation.id, stars: 1 }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.equal(fulfilled.length, 1, 'exactly one concurrent rating attempt should succeed');
    assert.equal(rejected.length, 1, 'exactly one concurrent rating attempt should be rejected');
    assert.equal(rejected[0].reason.statusCode, 409);
  });

  test('rating an already-rated donation cannot be viewed by an unrelated user', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, donation } = await createCompletedDonation();
    await ratingService.createRating(donor.id, { donationId: donation.id, stars: 5 });

    const { user: outsider } = await createVerifiedUser({ role: 'donor' });

    await assert.rejects(
      () => ratingService.getRatingByDonation(donation.id, outsider.id),
      (err) => {
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  test('the rated volunteer (not just the donor) can view the rating', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, volunteer, donation } = await createCompletedDonation();
    await ratingService.createRating(donor.id, { donationId: donation.id, stars: 5, comment: 'Nice' });

    const rating = await ratingService.getRatingByDonation(donation.id, volunteer.id);
    assert.equal(rating.stars, 5);
  });

  test('rating a non-existent donation returns 404, not a raw DB error', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });

    await assert.rejects(
      () => ratingService.createRating(donor.id, { donationId: 999999999, stars: 5 }),
      (err) => {
        assert.equal(err.statusCode, 404);
        return true;
      }
    );
  });
});
