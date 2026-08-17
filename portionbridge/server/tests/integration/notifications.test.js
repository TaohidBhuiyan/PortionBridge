const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload } = require('./setup');

/**
 * Regression tests for the two notification bugs this audit fixed:
 *  1. Team donation acceptance previously created a duplicate donor
 *     notification on top of the one the DB trigger already creates.
 *  2. Team donation completion previously only notified whoever was in
 *     volunteer_id (the team leader) and never the actual assigned_member_id,
 *     when they're different people.
 */
describe('notifications: no duplicates, right recipients', () => {
  let dbReady = false;
  let donationService;
  let teamService;
  let notificationModel;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    donationService = require('../../services/donation.service');
    teamService = require('../../services/team.service');
    notificationModel = require('../../models/notification.model');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  test('individual donation acceptance sends the donor exactly one notification', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    await donationService.acceptDonation(donation.id, volunteer.id);

    const notifications = await notificationModel.findByUserId({ userId: donor.id, limit: 50, offset: 0 });
    const acceptedNotifications = notifications.filter((n) => n.related_id === donation.id);
    assert.equal(acceptedNotifications.length, 1, 'donor should get exactly one notification for this donation');
  });

  test('team donation acceptance sends the donor exactly one notification (not two)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const team = await teamService.createTeam(leader.id, { name: 'Notif Test Team' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);

    const notifications = await notificationModel.findByUserId({ userId: donor.id, limit: 50, offset: 0 });
    const acceptedNotifications = notifications.filter((n) => n.related_id === donation.id);
    assert.equal(
      acceptedNotifications.length,
      1,
      'donor should get exactly one notification for the team acceptance, not a duplicate'
    );
  });

  test('team donation completion notifies BOTH the leader and the different assigned member, exactly once each', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Completion Notif Team' });
    const invitationId = await require('../../models/teamInvitation.model').create({
      teamId: team.id,
      invitedBy: leader.id,
      invitedUserId: member.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitationId, member.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);
    await donationService.assignTeamMemberToDonation(donation.id, team.id, member.id, leader.id);

    const donationModel = require('../../models/donation.model');
    const acceptedDonation = await donationModel.findById(donation.id);
    await donationService.schedulePickup(acceptedDonation, member.id, new Date(Date.now() + 3600000).toISOString());
    const scheduledDonation = await donationModel.findById(donation.id);
    await donationService.markOnTheWay(scheduledDonation, member.id, {});
    const onTheWayDonation = await donationModel.findById(donation.id);
    await donationService.markPickedUp(onTheWayDonation, member.id, {});

    await donationService.completeDonation(donation.id, donor.id, {});

    const leaderNotifs = await notificationModel.findByUserId({ userId: leader.id, limit: 50, offset: 0 });
    const memberNotifs = await notificationModel.findByUserId({ userId: member.id, limit: 50, offset: 0 });

    const leaderCompletionNotifs = leaderNotifs.filter((n) => n.related_id === donation.id && n.type === 'status_updated');
    const memberCompletionNotifs = memberNotifs.filter((n) => n.related_id === donation.id && n.type === 'status_updated');

    assert.equal(leaderCompletionNotifs.length, 1, 'team leader should get exactly one completion notification');
    assert.equal(memberCompletionNotifs.length, 1, 'assigned member should get exactly one completion notification');
  });
});
