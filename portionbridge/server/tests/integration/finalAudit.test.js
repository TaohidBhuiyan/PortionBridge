const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const {
  isDbAvailable,
  createVerifiedUser,
  cleanupTestData,
  validFoodDonationPayload,
  setVolunteerLocation,
  setTeamLocation,
} = require('./setup');

// Final-phase full scenario audit: A (new volunteer, no team) -> B (leader)
// -> C (member) -> D (unrelated volunteer), exercising location, team
// lifecycle, discovery, acceptance, assignment, pickup status, chat,
// reports, notifications, and post-removal restriction in one continuous
// story, the way a real user session would.
describe('FINAL AUDIT: full A/B/C/D volunteer+team scenario', () => {
  let dbReady = false;
  let donationService, teamService, chatService, reportService;
  let teamMemberModel, notificationModel, donationModel;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    donationService = require('../../services/donation.service');
    teamService = require('../../services/team.service');
    chatService = require('../../services/chat.service');
    reportService = require('../../services/report.service');
    teamMemberModel = require('../../models/teamMember.model');
    notificationModel = require('../../models/notification.model');
    donationModel = require('../../models/donation.model');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  test('full scenario', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    // --- A: new volunteer, no team ---
    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: A } = await createVerifiedUser({ role: 'volunteer', withLocation: false });
    const { user: D } = await createVerifiedUser({ role: 'volunteer' }); // unrelated, has a location by default

    // A has no location yet -> browsing is blocked
    await assert.rejects(
      () => donationService.browseDonations({}, { id: A.id, role: 'volunteer' }),
      (err) => err.code === 'ADDRESS_REQUIRED'
    );

    // A sets location
    await setVolunteerLocation(A.id, { latitude: 23.8103, longitude: 90.4125, coverageRadius: 20 });

    // A is not in a team -> cannot access any team-management endpoint
    await assert.rejects(() => teamService.inviteMember(999999, A.id, { invitedUserId: D.id }));

    // --- A creates team, becomes leader (B) ---
    const team = await teamService.createTeam(A.id, { name: 'Final Audit Team' });
    assert.equal(team.leader_id, A.id);

    // --- A invites C, C joins ---
    const { user: C } = await createVerifiedUser({ role: 'volunteer' });
    const invitation = await teamService.inviteMember(team.id, A.id, { invitedUserId: C.id });
    const invitationId = invitation.id;
    // C receives the invitation notification
    const cInviteNotifs = await notificationModel.findByUserId({ userId: C.id, limit: 20, offset: 0 });
    assert.ok(cInviteNotifs.some((n) => n.type === 'team_invitation_received'));

    await teamService.acceptInvitation(invitationId, C.id);
    const cMembership = await teamMemberModel.findByUserId(C.id);
    assert.equal(cMembership.team_id, team.id);
    assert.equal(cMembership.role, 'member');

    // --- A sets team location ---
    await setTeamLocation(team.id, { latitude: 23.8103, longitude: 90.4125, coverageRadius: 15 });

    // --- D remains unrelated: cannot manage this team ---
    await assert.rejects(() => teamService.removeMember(team.id, C.id, D.id));

    // --- Donations: one within radius, one far away ---
    const nearbyDonation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    const farPayload = validFoodDonationPayload();
    farPayload.pickupAddress.latitude = 22.3569; // ~380km away (Chittagong)
    farPayload.pickupAddress.longitude = 91.7832;
    const farDonation = await donationService.createDonation(donor.id, farPayload);

    const { donations: aNearby } = await donationService.browseDonations(
      { nearby: true, radius: 20 },
      { id: A.id, role: 'volunteer' }
    );
    assert.ok(aNearby.some((d) => d.id === nearbyDonation.id), 'nearby donation should appear for A');
    assert.ok(!aNearby.some((d) => d.id === farDonation.id), 'far donation should NOT appear for A');

    // Far donation cannot be accepted for the team either (radius re-checked at accept)
    await assert.rejects(() => donationService.acceptDonationForTeam(farDonation.id, team.id, A.id));

    // --- A (leader) accepts the nearby donation for the team ---
    const accepted = await donationService.acceptDonationForTeam(nearbyDonation.id, team.id, A.id);
    assert.equal(accepted.status, 'accepted');
    assert.equal(accepted.team_id, team.id);
    assert.equal(accepted.assigned_member_id, null);

    // --- A assigns C as the actual pickup member ---
    await donationService.assignTeamMemberToDonation(nearbyDonation.id, team.id, C.id, A.id);
    let donationRow = await donationModel.findById(nearbyDonation.id);
    assert.equal(donationRow.assigned_member_id, C.id);

    // C receives the assignment notification
    const cAssignNotifs = await notificationModel.findByUserId({ userId: C.id, limit: 20, offset: 0 });
    assert.ok(cAssignNotifs.some((n) => n.type === 'team_donation_assigned'));

    // --- C sees the mission via getDonationDetails; D cannot ---
    const cView = await donationService.getDonationDetails(nearbyDonation.id, C.id, 'volunteer');
    assert.equal(cView.id, nearbyDonation.id);
    assert.equal(cView.assigned_member_name, (await require('../../models/user.model').findById(C.id)).name);
    await assert.rejects(() => donationService.getDonationDetails(nearbyDonation.id, D.id, 'volunteer'));

    // --- C performs pickup actions; D cannot ---
    await assert.rejects(() => donationService.schedulePickup(donationRow, D.id, new Date(Date.now() + 3600000)));
    await donationService.schedulePickup(donationRow, C.id, new Date(Date.now() + 3600000));
    donationRow = await donationModel.findById(nearbyDonation.id);
    assert.equal(donationRow.status, 'scheduled');

    await assert.rejects(() => donationService.markOnTheWay(donationRow, D.id));
    await donationService.markOnTheWay(donationRow, C.id);
    donationRow = await donationModel.findById(nearbyDonation.id);

    await donationService.markPickedUp(donationRow, C.id);
    donationRow = await donationModel.findById(nearbyDonation.id);
    assert.equal(donationRow.status, 'picked_up');

    // Invalid transition: cannot re-schedule a picked-up donation
    await assert.rejects(() => donationService.schedulePickup(donationRow, C.id, new Date(Date.now() + 3600000)));

    // --- Chat: C (assigned member) and A (leader) can access; D cannot ---
    await chatService.authorizeRoomAccess(nearbyDonation.id, C.id);
    await chatService.authorizeRoomAccess(nearbyDonation.id, A.id);
    await assert.rejects(() => chatService.authorizeRoomAccess(nearbyDonation.id, D.id));

    const message = await chatService.sendMessage({ donationId: nearbyDonation.id, senderId: C.id, message: 'On the way!' });
    assert.equal(message.sender_id, C.id);
    await assert.rejects(() => chatService.sendMessage({ donationId: nearbyDonation.id, senderId: D.id, message: 'hi' }));

    // --- Reports: C (assigned member) can report; D cannot ---
    const report = await reportService.createReport(C.id, { donationId: nearbyDonation.id, reportedUserId: donor.id, reason: 'other' });
    assert.equal(report.reporter_id, C.id);
    await assert.rejects(() => reportService.createReport(D.id, { donationId: nearbyDonation.id, reason: 'other' }));

    // --- Complete the donation ---
    await donationService.completeDonation(nearbyDonation.id, donor.id);
    donationRow = await donationModel.findById(nearbyDonation.id);
    assert.equal(donationRow.status, 'completed');

    // C's own history/summary include this team-assigned mission
    const { donations: cHistory } = await donationService.getVolunteerHistory(C.id, {});
    assert.ok(cHistory.some((d) => d.id === nearbyDonation.id));

    // --- Second mission to test removal/leave restrictions ---
    const secondDonation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonationForTeam(secondDonation.id, team.id, A.id);
    await donationService.assignTeamMemberToDonation(secondDonation.id, team.id, C.id, A.id);

    // C has an active assignment now -> cannot leave, cannot be removed
    await assert.rejects(() => teamService.leaveTeam(C.id));
    await assert.rejects(() => teamService.removeMember(team.id, C.id, A.id));

    // Resolve the active mission, then removal/leave should work
    let secondRow = await donationModel.findById(secondDonation.id);
    await donationService.schedulePickup(secondRow, C.id, new Date(Date.now() + 3600000));
    secondRow = await donationModel.findById(secondDonation.id);
    await donationService.markOnTheWay(secondRow, C.id);
    secondRow = await donationModel.findById(secondDonation.id);
    await donationService.markPickedUp(secondRow, C.id);
    await donationService.completeDonation(secondDonation.id, donor.id);

    // --- A removes C ---
    await teamService.removeMember(team.id, C.id, A.id);
    const cMembershipAfter = await teamMemberModel.findByUserId(C.id);
    assert.equal(cMembershipAfter, null);

    // C receives the removal notification
    const cRemovedNotifs = await notificationModel.findByUserId({ userId: C.id, limit: 20, offset: 0 });
    assert.ok(cRemovedNotifs.some((n) => n.type === 'team_member_removed'));

    // C no longer has any team-management authority
    await assert.rejects(() => donationService.assignTeamMemberToDonation(secondDonation.id, team.id, C.id, C.id));

    // Historical mission records remain intact and correctly attributed
    const secondRowFinal = await donationModel.findById(secondDonation.id);
    assert.equal(secondRowFinal.assigned_member_id, C.id, 'historical assignment on a completed mission is preserved');
    assert.equal(secondRowFinal.status, 'completed');
  });
});
