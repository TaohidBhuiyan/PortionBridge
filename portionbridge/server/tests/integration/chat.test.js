const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload } = require('./setup');

describe('chat: authorization', () => {
  let dbReady = false;
  let chatService;
  let donationService;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    chatService = require('../../services/chat.service');
    donationService = require('../../services/donation.service');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  test('donor and accepting volunteer can both access the chat for an accepted donation', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(donation.id, volunteer.id);

    const donorAccess = await chatService.authorizeRoomAccess(donation.id, donor.id);
    const volunteerAccess = await chatService.authorizeRoomAccess(donation.id, volunteer.id);

    assert.equal(donorAccess.id, donation.id);
    assert.equal(volunteerAccess.id, donation.id);
  });

  test('an unrelated user cannot access the chat for someone else\'s accepted donation', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const { user: outsider } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(donation.id, volunteer.id);

    await assert.rejects(() => chatService.authorizeRoomAccess(donation.id, outsider.id));
  });

  test('chat is not available before a donation has been accepted', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    // Still pending — nobody has accepted it yet.

    await assert.rejects(() => chatService.authorizeRoomAccess(donation.id, donor.id));
  });

  test('a rejected/unauthorized user cannot send a message either', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const { user: outsider } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(donation.id, volunteer.id);

    await assert.rejects(() => chatService.sendMessage({ donationId: donation.id, senderId: outsider.id, message: 'Hi there' }));
  });
});
