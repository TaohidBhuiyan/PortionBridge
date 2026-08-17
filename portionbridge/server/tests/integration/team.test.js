const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload } = require('./setup');

describe('team: authorization and team-donation flow', () => {
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

  test('a volunteer can create a team and becomes its leader', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const team = await teamService.createTeam(leader.id, { name: 'Test Team', description: 'A test team' });

    assert.ok(team.id);
    assert.equal(team.leader_id, leader.id);
  });

  test('a volunteer already leading a team cannot create a second team', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    await teamService.createTeam(leader.id, { name: 'First Team' });

    await assert.rejects(() => teamService.createTeam(leader.id, { name: 'Second Team' }));
  });

  test('only the team leader can invite members (authorization check)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: nonMember } = await createVerifiedUser({ role: 'volunteer' });
    const { user: target } = await createVerifiedUser({ role: 'volunteer' });
    const team = await teamService.createTeam(leader.id, { name: 'Auth Test Team' });

    await assert.rejects(() => teamService.inviteMember(team.id, nonMember.id, { invitedUserId: target.id }));
  });

  test('team leader accepts a donation on behalf of the team, then assigns a member to it', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Pickup Team' });
    const invitationId = await require('../../models/teamInvitation.model').create({
      teamId: team.id,
      invitedBy: leader.id,
      invitedUserId: member.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitationId, member.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    const acceptedForTeam = await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);

    assert.equal(acceptedForTeam.status, 'accepted');
    assert.equal(acceptedForTeam.volunteer_id, leader.id);
    assert.equal(acceptedForTeam.team_id, team.id);

    const assigned = await donationService.assignTeamMemberToDonation(donation.id, team.id, member.id, leader.id);
    assert.equal(assigned.assigned_member_id, member.id);
  });

  test('a non-team-member cannot accept a donation "for" a team they are not in', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: outsider } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Exclusive Team' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    await assert.rejects(() => donationService.acceptDonationForTeam(donation.id, team.id, outsider.id));
  });
});
