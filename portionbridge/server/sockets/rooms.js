/**
 * Centralized Socket.io room-naming convention for donation-scoped events.
 * @param {number|string} donationId - Donation ID
 * @returns {string} Room name, e.g. "donation_88"
 */
function getDonationRoomName(donationId) {
  return `donation_${donationId}`;
}

/**
 * Fixed room admins join to receive every active mission's live location
 * and status updates in one place (Phase 6: Admin Live Operations Map).
 * Membership is admin-only, enforced in tracking.handler.js — this is
 * just the room name, not an access-control boundary by itself.
 * @returns {string} The constant admin live-operations room name
 */
function getAdminLiveOpsRoomName() {
  return 'admin_live_ops';
}

module.exports = { getDonationRoomName, getAdminLiveOpsRoomName };