const { socketSuccess, socketError } = require('../utils/socketResponse');
const { getDonationRoomName, getAdminLiveOpsRoomName } = require('../rooms');
const donationModel = require('../../models/donation.model');
const { DONATION_STATUS, USER_ROLES } = require('../../constants');

// Statuses during which a mission is "active" for tracking purposes —
// same 4-status definition used throughout the admin dashboard (Phase 2's
// getActiveVolunteersCount, Phase 4's volunteer activity). Location
// sharing is only ever accepted for a donation in one of these states;
// pending (not yet accepted), completed, and cancelled donations are
// rejected server-side even if a stale client tries to keep emitting —
// this is the "do not continuously track inactive volunteers" /
// "active mission location only" requirement enforced at the source of
// truth, not just trusted to the frontend stopping on its own.
const TRACKABLE_STATUSES = new Set([
  DONATION_STATUS.ACCEPTED,
  DONATION_STATUS.SCHEDULED,
  DONATION_STATUS.ON_THE_WAY,
  DONATION_STATUS.PICKED_UP,
]);

// Minimum milliseconds between accepted location updates, per
// (socket user, donation) pair. This is a server-side backstop on top of
// whatever throttling the client does — a buggy or modified client
// spamming this event still can't flood the room. In-memory only
// (matches socketRegistry's existing "presence is ephemeral, process
// memory is enough" reasoning) — losing this map on a server restart just
// means the next update after restart isn't throttled, which is harmless.
const MIN_UPDATE_INTERVAL_MS = 4000;
const lastUpdateAt = new Map();

/**
 * Whether `userId` is allowed to see/emit tracking data for `donation` —
 * the donor, the assigned volunteer, the assigned team member, or an admin.
 * Shared by join/leave AND by the location-sharing check below, so the two
 * can never drift into inconsistent rules about who's allowed in the room
 * versus who's allowed to know where the volunteer is.
 * @param {Object} donation - Donation row (needs donor_id/volunteer_id/assigned_member_id)
 * @param {Object} user - socket.user (needs id/role)
 * @returns {boolean}
 */
function canAccessDonationTracking(donation, user) {
  if (user.role === USER_ROLES.ADMIN) return true;
  if (donation.donor_id === user.id) return true;
  if (donation.volunteer_id === user.id) return true;
  if (donation.assigned_member_id === user.id) return true;
  return false;
}

/**
 * Registers donation tracking-related event handlers for one authenticated socket.
 * Handles room joining/leaving for real-time donation tracking, plus
 * (Phase 5) the volunteer's live-location broadcast during an active mission.
 * @param {Object} _io - Shared Socket.io server instance
 * @param {Object} socket - The authenticated socket (has socket.user)
 */
function registerTrackingHandlers(_io, socket) {
  /**
   * join_donation_tracking - Join a donation-specific room for live tracking
   * Only the donor, the assigned volunteer/team member, or an admin may join.
   */
  socket.on('join_donation_tracking', async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const { donationId } = payload || {};

      if (!donationId) {
        return ack(socketError('Donation ID is required'));
      }

      const donation = await donationModel.findById(donationId);
      if (!donation) {
        return ack(socketError('Donation request not found.', 404));
      }

      if (!canAccessDonationTracking(donation, socket.user)) {
        return ack(socketError('You are not allowed to track this donation.', 403));
      }

      const roomName = getDonationRoomName(donationId);
      socket.join(roomName);

      ack(socketSuccess('Joined donation tracking room', { donationId }));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });

  /**
   * leave_donation_tracking - Leave a donation-specific tracking room
   */
  socket.on('leave_donation_tracking', async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const { donationId } = payload || {};

      if (!donationId) {
        return ack(socketError('Donation ID is required'));
      }

      const roomName = getDonationRoomName(donationId);
      socket.leave(roomName);
      lastUpdateAt.delete(`${socket.user.id}:${donationId}`);

      ack(socketSuccess('Left donation tracking room', { donationId }));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });

  /**
   * share_volunteer_location — Phase 5. The assigned volunteer (or, for a
   * team-mode donation, the assigned team member) broadcasts their current
   * GPS position to everyone else already in that donation's tracking room
   * (the donor via TrackingPanel.jsx, and the volunteer's own mission map).
   *
   * Emits the SAME 'volunteer_location_updated' event with the SAME
   * { donationId, latitude, longitude, timestamp } shape the donor-facing
   * useDonationTracking.js hook already listens for — this is why nothing
   * on the donor side needed to change for live tracking to start working.
   *
   * No database write: this is a live, ephemeral broadcast only, exactly
   * like presence in socketRegistry.js. A location history table would be
   * a real feature (route replay, analytics) this phase wasn't asked for.
   */
  socket.on('share_volunteer_location', async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const { donationId, latitude, longitude } = payload || {};

      if (!donationId || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return ack(socketError('donationId, latitude, and longitude are required.'));
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return ack(socketError('latitude/longitude out of range.'));
      }

      const donation = await donationModel.findById(donationId);
      if (!donation) {
        return ack(socketError('Donation request not found.', 404));
      }

      const isAssignedVolunteer =
        donation.volunteer_id === socket.user.id || donation.assigned_member_id === socket.user.id;
      if (!isAssignedVolunteer) {
        return ack(socketError('You are not the assigned volunteer for this donation.', 403));
      }

      if (donation.is_deleted || !TRACKABLE_STATUSES.has(donation.status)) {
        return ack(socketError('This donation is not on an active mission right now.', 409));
      }

      const throttleKey = `${socket.user.id}:${donationId}`;
      const now = Date.now();
      const last = lastUpdateAt.get(throttleKey) || 0;
      if (now - last < MIN_UPDATE_INTERVAL_MS) {
        // Not an error — the client is just updating faster than the
        // server-side floor allows. Ack success without rebroadcasting,
        // so the client doesn't treat this as a failure.
        return ack(socketSuccess('Update throttled.', { donationId, throttled: true }));
      }
      lastUpdateAt.set(throttleKey, now);

      const roomName = getDonationRoomName(donationId);
      const timestamp = new Date().toISOString();
      // Chaining .to(a).to(b) broadcasts to the UNION of both rooms in one
      // call — sockets in both (e.g. an admin who is also somehow in the
      // donation room) only get one copy. This is the ONLY change needed
      // to feed the Phase 6 admin live-ops map: no second emit, no new
      // event name, no parallel broadcast path — the exact same payload
      // donor tracking and the volunteer's own mission map already
      // consume now also reaches the admin room.
      _io.to(roomName).to(getAdminLiveOpsRoomName()).emit('volunteer_location_updated', {
        donationId,
        latitude,
        longitude,
        timestamp,
      });

      ack(socketSuccess('Location shared.', { donationId, timestamp }));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });

  /**
   * join_admin_live_ops / leave_admin_live_ops — Phase 6. Admin-only room
   * covering every active mission's location/status updates at once, so
   * the Live Operations Map doesn't have to discover and join N separate
   * per-donation rooms itself. Authorization is checked here, not just
   * left to the frontend routing guard — matches the "admin-only access
   * enforced server-side" requirement.
   */
  socket.on('join_admin_live_ops', (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    if (socket.user.role !== USER_ROLES.ADMIN) {
      return ack(socketError('Admin access required.', 403));
    }

    socket.join(getAdminLiveOpsRoomName());
    ack(socketSuccess('Joined admin live operations room.'));
  });

  socket.on('leave_admin_live_ops', (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    socket.leave(getAdminLiveOpsRoomName());
    ack(socketSuccess('Left admin live operations room.'));
  });
}

/**
 * Milliseconds-since-epoch of the last ACCEPTED share_volunteer_location
 * update for (userId, donationId), or null if none has been received this
 * process's lifetime. Reused by admin.service.js's Phase 7 Attention
 * Center to detect "stale location" (an active on_the_way/picked_up
 * mission whose volunteer hasn't reported a position in a while) — the
 * SAME in-memory map this handler already keeps for throttling, not a
 * second tracking mechanism.
 * @param {number} userId
 * @param {number} donationId
 * @returns {number|null}
 */
function getLastLocationUpdateAt(userId, donationId) {
  return lastUpdateAt.get(`${userId}:${donationId}`) || null;
}

module.exports = { registerTrackingHandlers, getLastLocationUpdateAt };
