/**
 * In-memory registry mapping userId -> Set of connected socket ids.
 *
 * A single user may have multiple sockets open at once (multiple browser
 * tabs, multiple devices) — this tracks all of them, not just the most
 * recent one. Deliberately in-memory only, no persistence: presence is a
 * live, ephemeral concept, and this process's memory is the only place
 * that's meaningful.
 *
 * This is the reusable helper later modules build on:
 *   - Module 4 (notifications) uses getSocketIds(userId) to know which
 *     socket(s) to emit a given user's notification to.
 *   - Any future presence/online-indicator feature can use isOnline(userId)
 *     without needing its own connection-tracking logic.
 *
 * Infrastructure-only in this module: nothing here emits events, joins
 * rooms, or touches the database — it only tracks which sockets exist.
 */

/** @type {Map<number, Set<string>>} */
const userSockets = new Map();

/**
 * Registers a socket id as belonging to a user. Safe to call multiple
 * times for the same user (multiple tabs/devices) — each socket id is
 * added to that user's set.
 * @param {number} userId - ID of the connected user
 * @param {string} socketId - The socket's id
 */
function addSocket(userId, socketId) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socketId);
}

/**
 * Removes a socket id from a user's set. If that was the user's last
 * remaining socket, the entire map entry is deleted — this is what
 * prevents the registry from growing forever as users disconnect
 * (a Set left empty forever for every user who's ever logged off would
 * be a slow, silent memory leak).
 * @param {number} userId - ID of the user
 * @param {string} socketId - The socket id to remove
 */
function removeSocket(userId, socketId) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userSockets.delete(userId);
  }
}

/**
 * Gets every socket id currently registered for a user.
 * @param {number} userId - ID of the user
 * @returns {Array<string>} Array of socket ids (empty array if none connected)
 */
function getSocketIds(userId) {
  const sockets = userSockets.get(userId);
  return sockets ? Array.from(sockets) : [];
}

/**
 * Whether a user has at least one active socket connection.
 * @param {number} userId - ID of the user
 * @returns {boolean} True if the user has one or more connected sockets
 */
function isOnline(userId) {
  return userSockets.has(userId);
}

/**
 * Count of distinct users currently online (not total socket connections —
 * a user with 3 open tabs still counts once here).
 * @returns {number} Number of distinct online users
 */
function getOnlineUserCount() {
  return userSockets.size;
}

module.exports = {
  addSocket,
  removeSocket,
  getSocketIds,
  isOnline,
  getOnlineUserCount,
};
