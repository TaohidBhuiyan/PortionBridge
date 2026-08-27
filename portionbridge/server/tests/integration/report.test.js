const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload, pool } = require('./setup');

describe('report: target validation, authorization, and DB integrity', () => {
  let dbReady = false;
  let donationService;
  let reportService;
  let reportModel;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    donationService = require('../../services/donation.service');
    reportService = require('../../services/report.service');
    reportModel = require('../../models/report.model');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  async function createPendingDonationWithVolunteer() {
    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    const accepted = await donationService.acceptDonation(donation.id, volunteer.id);
    return { donor, volunteer, donation: accepted };
  }

  test('a participant can report the other participant on a shared donation', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { donor, volunteer, donation } = await createPendingDonationWithVolunteer();

    const report = await reportService.createReport(donor.id, {
      donationId: donation.id,
      reportedUserId: volunteer.id,
      reason: 'Volunteer did not show up on time.',
    });

    assert.equal(report.reporter_id, donor.id);
    assert.equal(report.reported_user_id, volunteer.id);
    assert.equal(report.reported_donation_id, donation.id);
  });

  test('a report against the donation only (no reportedUserId) is allowed', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, donation } = await createPendingDonationWithVolunteer();

    const report = await reportService.createReport(donor.id, {
      donationId: donation.id,
      reason: 'The donation listing was misleading.',
    });

    assert.equal(report.reported_user_id, null);
    assert.equal(report.reported_donation_id, donation.id);
  });

  test('an unrelated user (not a participant) cannot file a report', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donation } = await createPendingDonationWithVolunteer();
    const { user: outsider } = await createVerifiedUser({ role: 'donor' });

    await assert.rejects(
      () => reportService.createReport(outsider.id, { donationId: donation.id, reason: 'test' }),
      (err) => {
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  test('reporting an arbitrary user who is not the other participant is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, donation } = await createPendingDonationWithVolunteer();
    const { user: unrelatedPerson } = await createVerifiedUser({ role: 'volunteer' });

    await assert.rejects(
      () =>
        reportService.createReport(donor.id, {
          donationId: donation.id,
          reportedUserId: unrelatedPerson.id,
          reason: 'test',
        }),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  test('reporting yourself is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, donation } = await createPendingDonationWithVolunteer();

    await assert.rejects(
      () =>
        reportService.createReport(donor.id, {
          donationId: donation.id,
          reportedUserId: donor.id,
          reason: 'test',
        }),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  test('a participant cannot file two reports on the same donation (application check)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, donation } = await createPendingDonationWithVolunteer();
    await reportService.createReport(donor.id, { donationId: donation.id, reason: 'first report' });

    await assert.rejects(
      () => reportService.createReport(donor.id, { donationId: donation.id, reason: 'second report' }),
      (err) => {
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  test('the Phase 3 database CHECK constraint (chk_reports_target_present) actually rejects a report with neither target, independent of application code', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: reporter } = await createVerifiedUser({ role: 'donor' });

    // Bypasses the service layer entirely — this proves the DB constraint
    // itself is the real guarantee, not just the application-level checks
    // exercised by the tests above.
    await assert.rejects(
      () =>
        pool.query(
          `INSERT INTO reports (reporter_id, reported_user_id, reported_donation_id, reason, status)
           VALUES (:reporterId, NULL, NULL, :reason, 'pending')`,
          { reporterId: reporter.id, reason: 'no target at all' }
        ),
      (err) => {
        assert.match(err.message, /chk_reports_target_present|CONSTRAINT/i);
        return true;
      }
    );
  });

  test('listMyReports only returns the requesting user\'s own reports, not other users\'', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor: donorA, donation: donationA } = await createPendingDonationWithVolunteer();
    const { donor: donorB, donation: donationB } = await createPendingDonationWithVolunteer();

    await reportService.createReport(donorA.id, { donationId: donationA.id, reason: 'report from A' });
    await reportService.createReport(donorB.id, { donationId: donationB.id, reason: 'report from B' });

    const { reports } = await reportService.listMyReports(donorA.id, {});

    assert.ok(reports.length >= 1);
    assert.ok(reports.every((r) => r.reporter_id === donorA.id));
  });

  test('reporting a non-existent donation returns 404', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });

    await assert.rejects(
      () => reportService.createReport(donor.id, { donationId: 999999999, reason: 'test' }),
      (err) => {
        assert.equal(err.statusCode, 404);
        return true;
      }
    );
  });
});
