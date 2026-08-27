const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload } = require('./setup');

describe('notification: ownership and correctness', () => {
  let dbReady = false;
  let donationService;
  let notificationService;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    donationService = require('../../services/donation.service');
    notificationService = require('../../services/notification.service');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  test('accepting a donation creates a real notification for the donor (via the actual donation flow, not a manual insert)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());

    await donationService.acceptDonation(donation.id, volunteer.id);

    const { notifications } = await notificationService.listNotifications(donor.id, {});
    const acceptedNotification = notifications.find((n) => String(n.related_id) === String(donation.id));

    assert.ok(acceptedNotification, 'donor should have received a notification about their donation being accepted');
    assert.equal(acceptedNotification.user_id, donor.id);
  });

  test('User A cannot mark User B\'s notification as read', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const { user: outsider } = await createVerifiedUser({ role: 'donor' });

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(donation.id, volunteer.id);

    const { notifications } = await notificationService.listNotifications(donor.id, {});
    const targetNotification = notifications[0];

    await assert.rejects(
      () => notificationService.markOneAsRead(outsider.id, targetNotification.id),
      (err) => {
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  test('User A\'s notification list never contains User B\'s notifications', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donorA } = await createVerifiedUser({ role: 'donor' });
    const { user: donorB } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });

    const donationA = await donationService.createDonation(donorA.id, validFoodDonationPayload());
    const donationB = await donationService.createDonation(donorB.id, validFoodDonationPayload());
    await donationService.acceptDonation(donationA.id, volunteer.id);
    await donationService.acceptDonation(donationB.id, volunteer.id);

    const { notifications: aNotifications } = await notificationService.listNotifications(donorA.id, {});

    assert.ok(aNotifications.length > 0);
    assert.ok(aNotifications.every((n) => n.user_id === donorA.id));
  });

  test('marking a notification as read decrements the unread count exactly once', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(donation.id, volunteer.id);

    const before = await notificationService.getUnreadCount(donor.id);
    assert.ok(before >= 1);

    const { notifications } = await notificationService.listNotifications(donor.id, {});
    await notificationService.markOneAsRead(donor.id, notifications[0].id);

    const after = await notificationService.getUnreadCount(donor.id);
    assert.equal(after, before - 1);
  });

  test('markAllAsRead only affects the calling user\'s own notifications', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donorA } = await createVerifiedUser({ role: 'donor' });
    const { user: donorB } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });

    const donationA = await donationService.createDonation(donorA.id, validFoodDonationPayload());
    const donationB = await donationService.createDonation(donorB.id, validFoodDonationPayload());
    await donationService.acceptDonation(donationA.id, volunteer.id);
    await donationService.acceptDonation(donationB.id, volunteer.id);

    const donorBUnreadBefore = await notificationService.getUnreadCount(donorB.id);
    await notificationService.markAllAsRead(donorA.id);

    const donorAUnreadAfter = await notificationService.getUnreadCount(donorA.id);
    const donorBUnreadAfter = await notificationService.getUnreadCount(donorB.id);

    assert.equal(donorAUnreadAfter, 0);
    assert.equal(donorBUnreadAfter, donorBUnreadBefore, "donor B's unread count must be untouched by donor A's markAllAsRead");
  });

  test('marking a non-existent notification as read returns 404', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });

    await assert.rejects(
      () => notificationService.markOneAsRead(donor.id, 999999999),
      (err) => {
        assert.equal(err.statusCode, 404);
        return true;
      }
    );
  });
});
