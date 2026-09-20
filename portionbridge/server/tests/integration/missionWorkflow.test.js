const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload, setTeamLocation } = require('./setup');

describe('missionWorkflow: team mission assignment and status transitions', () => {
  let dbReady = false;
  let teamService;
  let donationService;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    teamService = require('../../services/team.service');
    donationService = require('../../services/donation.service');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  test('the actual assigned member (not the leader) can schedule pickup', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Pickup Team' });
    await setTeamLocation(team.id);
    const invitationId = await require('../../models/teamInvitation.model').create({
      teamId: team.id,
      invitedBy: leader.id,
      invitedUserId: member.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitationId, member.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    const accepted = await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);
    const assigned = await donationService.assignTeamMemberToDonation(donation.id, team.id, member.id, leader.id);
    
    // Fetch the donation object to pass to schedulePickup
    const donationModel = require('../../models/donation.model');
    const assignedDonation = await donationModel.findById(assigned.id);

    const scheduled = await donationService.schedulePickup(assignedDonation, member.id, new Date(Date.now() + 3600000).toISOString());
    assert.equal(scheduled.status, 'scheduled');
  });

  test('the leader (not assigned) cannot schedule pickup', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Pickup Team' });
    await setTeamLocation(team.id);
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
    const assigned = await donationService.assignTeamMemberToDonation(donation.id, team.id, member.id, leader.id);

    const donationModel = require('../../models/donation.model');
    const assignedDonation = await donationModel.findById(assigned.id);

    await assert.rejects(
      () => donationService.schedulePickup(assignedDonation, leader.id, new Date(Date.now() + 3600000).toISOString()),
      (err) => {
        assert.ok(err.message.includes('assigned team member'));
        return true;
      }
    );
  });

  test('assigning a member from another team is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader1 } = await createVerifiedUser({ role: 'volunteer' });
    const { user: leader2 } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member2 } = await createVerifiedUser({ role: 'volunteer' });

    const team1 = await teamService.createTeam(leader1.id, { name: 'Team 1' });
    const team2 = await teamService.createTeam(leader2.id, { name: 'Team 2' });
    await setTeamLocation(team1.id);
    await setTeamLocation(team2.id);

    const invitationId = await require('../../models/teamInvitation.model').create({
      teamId: team2.id,
      invitedBy: leader2.id,
      invitedUserId: member2.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitationId, member2.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonationForTeam(donation.id, team1.id, leader1.id);

    await assert.rejects(
      () => donationService.assignTeamMemberToDonation(donation.id, team1.id, member2.id, leader1.id),
      (err) => {
        assert.ok(err.message.includes('not a member'));
        return true;
      }
    );
  });

  test('a non-leader member cannot assign', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member1 } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member2 } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Pickup Team' });
    await setTeamLocation(team.id);
    
    const invitationId1 = await require('../../models/teamInvitation.model').create({
      teamId: team.id,
      invitedBy: leader.id,
      invitedUserId: member1.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitationId1, member1.id);

    const invitationId2 = await require('../../models/teamInvitation.model').create({
      teamId: team.id,
      invitedBy: leader.id,
      invitedUserId: member2.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitationId2, member2.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);

    await assert.rejects(
      () => donationService.assignTeamMemberToDonation(donation.id, team.id, member2.id, member1.id),
      (err) => {
        assert.ok(err.message.includes('leader'));
        return true;
      }
    );
  });

  test('an unassigned team mission blocks scheduling with a clear message', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Pickup Team' });
    await setTeamLocation(team.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    const accepted = await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);

    const donationModel = require('../../models/donation.model');
    const acceptedDonation = await donationModel.findById(accepted.id);

    await assert.rejects(
      () => donationService.schedulePickup(acceptedDonation, leader.id, new Date(Date.now() + 3600000).toISOString()),
      (err) => {
        assert.ok(err.message.includes('no pickup member assigned'));
        return true;
      }
    );
  });

  test('a team member\'s own history/summary now includes team-assigned work', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Pickup Team' });
    await setTeamLocation(team.id);
    const invitationId = await require('../../models/teamInvitation.model').create({
      teamId: team.id,
      invitedBy: leader.id,
      invitedUserId: member.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitationId, member.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    const accepted = await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);
    const assigned = await donationService.assignTeamMemberToDonation(donation.id, team.id, member.id, leader.id);

    const donationModel = require('../../models/donation.model');
    const assignedDonation = await donationModel.findById(assigned.id);
    const scheduled = await donationService.schedulePickup(assignedDonation, member.id, new Date(Date.now() + 3600000).toISOString());
    const scheduledDonation = await donationModel.findById(scheduled.id);
    const onTheWay = await donationService.markOnTheWay(scheduledDonation, member.id);
    const onTheWayDonation = await donationModel.findById(onTheWay.id);
    const pickedUp = await donationService.markPickedUp(onTheWayDonation, member.id);
    await donationService.completeDonation(pickedUp.id, donor.id);

    const history = await donationService.getVolunteerHistory(member.id, { status: 'completed' });
    const historyArray = Array.isArray(history) ? history : history.donations || [];
    assert.ok(historyArray.some(d => d.id === donation.id));
  });

  test('getMemberAssignments works', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Pickup Team' });
    await setTeamLocation(team.id);
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

    const assignments = await donationService.getMemberAssignments(member.id, 'accepted');
    assert.ok(assignments.some(d => d.id === donation.id));
  });

  test('reassignment after picked_up is blocked', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member1 } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member2 } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Pickup Team' });
    await setTeamLocation(team.id);

    const invitationId1 = await require('../../models/teamInvitation.model').create({
      teamId: team.id,
      invitedBy: leader.id,
      invitedUserId: member1.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitationId1, member1.id);

    const invitationId2 = await require('../../models/teamInvitation.model').create({
      teamId: team.id,
      invitedBy: leader.id,
      invitedUserId: member2.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitationId2, member2.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    const accepted = await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);
    const assigned = await donationService.assignTeamMemberToDonation(donation.id, team.id, member1.id, leader.id);

    const donationModel = require('../../models/donation.model');
    const assignedDonation = await donationModel.findById(assigned.id);
    const scheduled = await donationService.schedulePickup(assignedDonation, member1.id, new Date(Date.now() + 3600000).toISOString());
    const scheduledDonation = await donationModel.findById(scheduled.id);
    const onTheWay = await donationService.markOnTheWay(scheduledDonation, member1.id);
    const onTheWayDonation = await donationModel.findById(onTheWay.id);
    const pickedUp = await donationService.markPickedUp(onTheWayDonation, member1.id);

    await assert.rejects(
      () => donationService.assignTeamMemberToDonation(pickedUp.id, team.id, member2.id, leader.id),
      (err) => {
        assert.ok(err.message.includes('status') || err.message.includes('picked_up'));
        return true;
      }
    );
  });

  test('deleting a team with an active mission is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Pickup Team' });
    await setTeamLocation(team.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);

    await assert.rejects(
      () => teamService.deleteTeam(team.id, leader.id),
      (err) => {
        assert.ok(err.message.includes('active donation'));
        return true;
      }
    );
  });

  test('an unrelated volunteer cannot update another\'s donation status', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer1 } = await createVerifiedUser({ role: 'volunteer' });
    const { user: volunteer2 } = await createVerifiedUser({ role: 'volunteer' });

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(donation.id, volunteer1.id);

    await assert.rejects(
      () => donationService.schedulePickup(donation.id, volunteer2.id, new Date(Date.now() + 3600000).toISOString()),
      (err) => {
        assert.ok(err.message.includes('assigned') || err.message.includes('permission'));
        return true;
      }
    );
  });

  test('an invalid status jump (accepted → picked_up) is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    const accepted = await donationService.acceptDonation(donation.id, volunteer.id);

    const donationModel = require('../../models/donation.model');
    const acceptedDonation = await donationModel.findById(accepted.id);

    await assert.rejects(
      () => donationService.markPickedUp(acceptedDonation, volunteer.id),
      (err) => {
        assert.ok(err.message.includes('status') || err.message.includes('scheduled'));
        return true;
      }
    );
  });
});
