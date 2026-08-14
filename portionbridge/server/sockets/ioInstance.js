/**
 * Holds a single reference to the shared Socket.io server instance so
 * plain service code (donation.service.js, rating.service.js,
 * chat.service.js) can push real-time events without needing `io` 
 * threaded through every controller->service call chain.
 *
 * Set once by sockets/index.js#initializeSocket when the app boots;
 * read by services/notification.service.js#emitToUser whenever something
 * needs to push an event to a user.
 */

let ioInstance = null;

/**
 * @param {Object} io - The Socket.io server instance
 */
function setIO(io) {
  ioInstance = io;
}

/**
 * @returns {Object|null} The Socket.io server instance, or null if the
 *   socket server hasn't been initialized yet (e.g. in some test contexts)
 */
function getIO() {
  return ioInstance;
}

/**
 * Broadcasts team activity to all team members in real-time.
 * Called from service layer when team events occur.
 * @param {number} teamId - Team ID
 * @param {string} eventType - Type of event (member_joined, member_left, leader_changed, etc.)
 * @param {Object} data - Event data
 */
function broadcastTeamActivity(teamId, eventType, data) {
  const io = getIO();
  if (io) {
    const roomName = `team_${teamId}`;
    io.to(roomName).emit('team_activity', {
      teamId,
      eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = { setIO, getIO, broadcastTeamActivity };
