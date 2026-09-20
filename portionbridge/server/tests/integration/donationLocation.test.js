const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload, setVolunteerLocation, setTeamLocation } = require('./setup');

describe('donation: location-based discovery and acceptance', () => {
  let dbReady = false;
  let donationService;
  let teamService;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    donationService = require('../../services/donation.service');
    teamService = require('../../services/team.service');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  test('browsing donations without a volunteer location is blocked (ADDRESS_REQUIRED)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer', withLocation: false });
    
    await assert.rejects(
      () => donationService.browseDonations({}, volunteer),
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, 'ADDRESS_REQUIRED');
        return true;
      }
    );
  });

  test('nearby-radius filtering shows in-range donations, excludes out-of-range', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });

    // Volunteer at (23.8103, 90.4125) with 5km radius
    await setVolunteerLocation(volunteer.id, { latitude: 23.8103, longitude: 90.4125, coverageRadius: 5 });

    // In-range donation (same coordinates)
    const inRangeDonation = await donationService.createDonation(donor.id, validFoodDonationPayload({
      pickupAddress: { ...validFoodDonationPayload().pickupAddress, latitude: 23.8103, longitude: 90.4125 }
    }));

    // Out-of-range donation (10km away)
    const outOfRangeDonation = await donationService.createDonation(donor.id, validFoodDonationPayload({
      pickupAddress: { ...validFoodDonationPayload().pickupAddress, latitude: 23.8103 + 0.09, longitude: 90.4125 }
    }));

    const result = await donationService.browseDonations({ nearby: true, radius: 5 }, volunteer);
    
    assert.ok(result.donations.some((d) => d.id === inRangeDonation.id), 'in-range donation should be shown');
    assert.ok(!result.donations.some((d) => d.id === outOfRangeDonation.id), 'out-of-range donation should be excluded');
  });

  test('accepting a donation outside coverage radius is rejected (OUT_OF_RANGE)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });

    // Volunteer at (23.8103, 90.4125) with 5km radius
    await setVolunteerLocation(volunteer.id, { latitude: 23.8103, longitude: 90.4125, coverageRadius: 5 });

    // Donation 10km away
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload({
      pickupAddress: { ...validFoodDonationPayload().pickupAddress, latitude: 23.8103 + 0.09, longitude: 90.4125 }
    }));

    await assert.rejects(
      () => donationService.acceptDonation(donation.id, volunteer.id),
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, 'OUT_OF_RANGE');
        return true;
      }
    );
  });

  test('accept-for-team rejected when caller is not the team leader', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: outsider } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Test Team' });
    await setTeamLocation(team.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    await assert.rejects(
      () => donationService.acceptDonationForTeam(donation.id, team.id, outsider.id),
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.ok(err.message.includes('Only the team leader'));
        return true;
      }
    );
  });

  test('accept-for-team uses team location even when leader personal location differs', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });

    // Leader personal location far away
    await setVolunteerLocation(leader.id, { latitude: 22.0, longitude: 90.0, coverageRadius: 5 });

    const team = await teamService.createTeam(leader.id, { name: 'Location Test Team' });
    // Team location near donation
    await setTeamLocation(team.id, { latitude: 23.8103, longitude: 90.4125, coverageRadius: 10 });

    // Donation at team location
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload({
      pickupAddress: { ...validFoodDonationPayload().pickupAddress, latitude: 23.8103, longitude: 90.4125 }
    }));

    const accepted = await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);
    assert.equal(accepted.status, 'accepted');
    assert.equal(accepted.team_id, team.id);
  });

  test('accept-for-team rejected when team has no location (TEAM_ADDRESS_REQUIRED)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'No Location Team' });
    // Intentionally do NOT call setTeamLocation

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    await assert.rejects(
      () => donationService.acceptDonationForTeam(donation.id, team.id, leader.id),
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, 'TEAM_ADDRESS_REQUIRED');
        return true;
      }
    );
  });

  test('departed member cannot accept-for-team using old team ID', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member } = await createVerifiedUser({ role: 'volunteer' });

    const team = await teamService.createTeam(leader.id, { name: 'Departure Test Team' });
    await setTeamLocation(team.id);

    const invitationId = await require('../../models/teamInvitation.model').create({
      teamId: team.id,
      invitedBy: leader.id,
      invitedUserId: member.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitationId, member.id);

    // Member leaves the team
    await teamService.removeMember(team.id, member.id, leader.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    await assert.rejects(
      () => donationService.acceptDonationForTeam(donation.id, team.id, member.id),
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.ok(err.message.includes('Only the team leader'));
        return true;
      }
    );
  });

  test('donation with no pickup coordinates excluded from nearby and rejected at accept (DONATION_LOCATION_MISSING)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });

    await setVolunteerLocation(volunteer.id, { latitude: 23.8103, longitude: 90.4125, coverageRadius: 10 });

    // Donation with null coordinates (simulating old data or one-time address without coordinates)
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload({
      pickupAddress: { ...validFoodDonationPayload().pickupAddress, latitude: null, longitude: null }
    }));

    // Should be excluded from nearby results
    const result = await donationService.browseDonations({ nearby: true, radius: 10 }, volunteer);
    assert.ok(!result.donations.some((d) => d.id === donation.id), 'donation without coordinates should be excluded from nearby');

    // Should be rejected at accept
    await assert.rejects(
      () => donationService.acceptDonation(donation.id, volunteer.id),
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, 'DONATION_LOCATION_MISSING');
        return true;
      }
    );
  });
});
