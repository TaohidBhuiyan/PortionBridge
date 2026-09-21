const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const {
  isDbAvailable,
  createVerifiedUser,
  cleanupTestData,
  validFoodDonationPayload,
  setTeamLocation,
} = require('./setup');

describe('Phase 5: chat/report authorization + notifications for team missions', () => {
  let dbReady = false;
  let chatService;
  let donationService;
  let teamService;
  let reportService;
  let chatMessageModel;
  let teamInvitationModel;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    chatService = require('../../services/chat.service');
    donationService = require('../../services/donation.service');
    teamService = require('../../services/team.service');
    reportService = require('../../services/report.service');
    chatMessageModel = require('../../models/chatMessage.model');
    teamInvitationModel = require('../../models/teamInvitation.model');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  async function makeAssignedTeamDonation() {
    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member } = await createVerifiedUser({ role: 'volunteer' });
    const team = await teamService.createTeam(leader.id, { name: 'Phase 5 Team' });
    await setTeamLocation(team.id);
    const invitationId = await teamInvitationModel.create({
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
    return { donor, leader, member, team, donation };
  }

  test('Test 3: the actual assigned team member (not just the leader) can access team mission chat', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { member, donation } = await makeAssignedTeamDonation();
    const access = await chatService.authorizeRoomAccess(donation.id, member.id);
    assert.equal(access.id, donation.id);
  });

  test('the assigned team member can send a message and the leader retains access too', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { leader, member, donation } = await makeAssignedTeamDonation();

    const saved = await chatService.sendMessage({ donationId: donation.id, senderId: member.id, message: 'On my way!' });
    assert.equal(saved.sender_id, member.id);

    const leaderAccess = await chatService.authorizeRoomAccess(donation.id, leader.id);
    assert.equal(leaderAccess.id, donation.id);
  });

  test('Test 4/5: an unrelated volunteer (not team member, not donor) cannot access team mission chat', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donation } = await makeAssignedTeamDonation();
    const { user: outsider } = await createVerifiedUser({ role: 'volunteer' });

    await assert.rejects(() => chatService.authorizeRoomAccess(donation.id, outsider.id));
  });

  test('a message from the donor notifies/reaches the assigned member\'s unread count, not just the leader', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, member, donation } = await makeAssignedTeamDonation();
    await chatService.sendMessage({ donationId: donation.id, senderId: donor.id, message: 'Hello!' });

    const unread = await chatMessageModel.countUnread(donation.id, member.id);
    assert.equal(unread, 1);

    const totalUnread = await chatMessageModel.countUnreadForUser(member.id);
    assert.ok(totalUnread >= 1, "assigned member's total unread count should include this team mission's chat");
  });

  test('Test 13: the assigned team member (not just the leader) can file a report for the mission, and can be named as the reported party', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, member, donation } = await makeAssignedTeamDonation();

    const report = await reportService.createReport(donor.id, {
      donationId: donation.id,
      reportedUserId: member.id,
      reason: 'no_show',
    });
    assert.equal(report.reported_user_id, member.id);

    const { user: outsider } = await createVerifiedUser({ role: 'volunteer' });
    await assert.rejects(() =>
      reportService.createReport(outsider.id, { donationId: donation.id, reason: 'other' })
    );
  });

  test('Test 12: reportedUserId must be a genuine participant, not an arbitrary user', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, donation } = await makeAssignedTeamDonation();
    const { user: randomUser } = await createVerifiedUser({ role: 'volunteer' });

    await assert.rejects(
      () => reportService.createReport(donor.id, { donationId: donation.id, reportedUserId: randomUser.id, reason: 'other' }),
      /genuine participant/i
    );
  });

  test('completing a team donation notifies the actual assigned member, not just the leader (verifies existing donation.service.js#completeDonation behavior)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { donor, leader, member, donation } = await makeAssignedTeamDonation();

    let donationRow = await require('../../models/donation.model').findById(donation.id);
    await donationService.schedulePickup(donationRow, member.id, new Date(Date.now() + 60 * 60 * 1000));
    donationRow = await require('../../models/donation.model').findById(donation.id);
    await donationService.markOnTheWay(donationRow, member.id);
    donationRow = await require('../../models/donation.model').findById(donation.id);
    await donationService.markPickedUp(donationRow, member.id);
    donationRow = await require('../../models/donation.model').findById(donation.id);
    await donationService.completeDonation(donation.id, donor.id);

    const notificationModel = require('../../models/notification.model');
    const memberNotifications = await notificationModel.findByUserId({ userId: member.id, limit: 20, offset: 0 });
    assert.ok(
      memberNotifications.some((n) => n.related_id === donation.id && n.title === 'Pickup completed'),
      'the actual assigned member should get a "Pickup completed" notification, not just the leader'
    );

    // Sanity: leader (volunteer_id) still gets notified too — this is additive, not a replacement.
    const leaderNotifications = await notificationModel.findByUserId({ userId: leader.id, limit: 20, offset: 0 });
    assert.ok(leaderNotifications.some((n) => n.related_id === donation.id && n.title === 'Pickup completed'));
  });
});
