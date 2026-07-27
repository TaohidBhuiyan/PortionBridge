const socketAuthMiddleware = require('./middleware/socketAuth.middleware');
const socketRegistry = require('./socketRegistry');
const { setIO } = require('./ioInstance');
const { registerChatHandlers } = require('./handlers/chat.handler');
const { registerNotificationHandlers } = require('./handlers/notification.handler');
const { registerTeamHandlers } = require('./handlers/team.handler');
const { registerPublicHandlers } = require('./handlers/public.handler');

/**
 * Socket.io bootstrap. Called once from server.js with the shared `io` 
 * instance — that wiring is unchanged from Module 1.
 * @param {Object} io - The shared Socket.io server instance
 */
function initializeSocket(io) {
  // Makes this io instance reachable from plain service code that needs
  // to push events but isn't itself a socket handler — see
  // sockets/ioInstance.js and services/notification.service.js#emitToUser.
  setIO(io);

  // Authenticated namespace (default)
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const { id: userId, name } = socket.user;

    socketRegistry.addSocket(userId, socket.id);
    console.log(`[Socket] Connected: ${name} (user ${userId}), socket ${socket.id}`);

    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);
    registerTeamHandlers(io, socket);

    // MODULE 6 — continuous token-expiry enforcement. socketAuthMiddleware
    // only validates the token once, at the initial handshake; without
    // this, a socket authenticated with a short-lived access token (see
    // JWT_ACCESS_EXPIRES_IN) would otherwise stay connected indefinitely —
    // inconsistent with every REST endpoint, which re-checks expiry on
    // every single request. Schedules a forced disconnect for the exact
    // moment this socket's token expires; the client is expected to
    // refresh its access token (POST /api/v1/auth/refresh-token) and
    // reconnect, exactly as it already must do for REST calls.
    const msUntilExpiry = socket.tokenExpiresAt - Date.now();
    const expiryTimer = setTimeout(() => {
      socket.emit('token_expired', {
        message: 'Your session has expired. Please refresh your token and reconnect.',
      });
      socket.disconnect(true);
    }, Math.max(msUntilExpiry, 0));

    socket.on('disconnect', () => {
      clearTimeout(expiryTimer);
      socketRegistry.removeSocket(userId, socket.id);
      console.log(`[Socket] Disconnected: ${name} (user ${userId}), socket ${socket.id}`);
    });
  });

  // Public namespace for landing page (no authentication required)
  const publicNamespace = io.of('/public');
  publicNamespace.on('connection', (socket) => {
    console.log(`[Public Socket] Connected: ${socket.id}`);
    
    registerPublicHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`[Public Socket] Disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initializeSocket };
