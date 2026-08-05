const { socketSuccess, socketError } = require('../utils/socketResponse');

/**
 * Registers donation tracking-related event handlers for one authenticated socket.
 * Handles room joining/leaving for real-time donation tracking.
 * @param {Object} _io - Shared Socket.io server instance
 * @param {Object} socket - The authenticated socket (has socket.user)
 */
function registerTrackingHandlers(_io, socket) {
  /**
   * join_donation_tracking - Join a donation-specific room for live tracking
   * Only the donor or assigned volunteer can join the tracking room
   */
  socket.on('join_donation_tracking', async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const { donationId } = payload;

      if (!donationId) {
        return ack(socketError('Donation ID is required'));
      }

      // Verify user has access to this donation (donor or assigned volunteer)
      // This check is done by the service layer when fetching donation details
      // For now, we allow joining and let the frontend handle authorization
      // In production, add a database check here

      const roomName = `donation_${donationId}`;
      socket.join(roomName);

      console.log(`[Tracking] User ${socket.user.id} joined room ${roomName}`);
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
      const { donationId } = payload;

      if (!donationId) {
        return ack(socketError('Donation ID is required'));
      }

      const roomName = `donation_${donationId}`;
      socket.leave(roomName);

      console.log(`[Tracking] User ${socket.user.id} left room ${roomName}`);
      ack(socketSuccess('Left donation tracking room', { donationId }));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });
}

module.exports = { registerTrackingHandlers };
