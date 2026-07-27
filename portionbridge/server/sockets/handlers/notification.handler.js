const notificationService = require('../../services/notification.service');
const { socketSuccess, socketError } = require('../utils/socketResponse');

/**
 * Registers notification-related event handlers for one authenticated
 * socket. Called from sockets/index.js's connection callback.
 *
 * This handler does NOT push notifications itself — real-time delivery
 * happens from services/notification.service.js#deliver/deliverById,
 * called from wherever a notification is actually created. This only
 * covers the client-initiated "sync me up" case (reconnect synchronization).
 * @param {Object} _io - Shared Socket.io server instance. Unused in this
 *   handler — kept as a parameter purely so every handler-registration
 *   function shares the same (io, socket) signature, since
 *   sockets/index.js calls them uniformly.
 * @param {Object} socket - The authenticated socket (has socket.user)
 */
function registerNotificationHandlers(_io, socket) {
  /**
   * get_unread_count — on-demand unread total for the authenticated user.
   */
  socket.on('get_unread_count', async (_payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const unreadCount = await notificationService.getUnreadCount(socket.user.id);
      ack(socketSuccess('Unread count retrieved.', { unreadCount }));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });
}

module.exports = { registerNotificationHandlers };
