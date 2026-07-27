/**
 * Centralized Socket.io room-naming convention for donation-scoped events.
 * @param {number|string} donationId - Donation ID
 * @returns {string} Room name, e.g. "donation_88"
 */
function getDonationRoomName(donationId) {
  return `donation_${donationId}`;
}

module.exports = { getDonationRoomName };
