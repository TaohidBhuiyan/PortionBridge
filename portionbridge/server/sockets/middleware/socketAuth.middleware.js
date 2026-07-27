const { verifyAccessToken } = require('../../utils/token');
const userModel = require('../../models/user.model');

/**
 * Authenticates a Socket.io connection at the handshake stage — the socket
 * equivalent of middleware/auth.middleware.js#protect for REST routes.
 * Reuses the exact same token verification and user lookup, so there is
 * only one implementation of "what makes a token/user valid" in the app.
 *
 * Reads the token from `socket.handshake.auth.token` (the standard
 * Socket.io client pattern: `io(url, { auth: { token } })`), falling back
 * to an `Authorization: Bearer <token>` header in the handshake for
 * flexibility with non-standard clients.
 *
 * On success, attaches `socket.user = { id, role, email, name }` — the same
 * shape as `req.user` on the REST side, so event handlers in later modules
 * can read it identically to how controllers read `req.user`.
 *
 * On failure, calls `next(new Error(message))`, which is Socket.io's
 * documented way to reject a connection before `'connection'` fires. The
 * client receives this as a `connect_error` event with `err.message` set
 * to the same string — never a raw stack trace or internal detail.
 *
 * @param {Object} socket - The connecting Socket.io socket
 * @param {Function} next - Socket.io middleware callback
 */
async function socketAuthMiddleware(socket, next) {
  try {
    const bearerHeader = socket.handshake.headers?.authorization;
    const token =
      socket.handshake.auth?.token ||
      (bearerHeader && bearerHeader.startsWith('Bearer ') ? bearerHeader.split(' ')[1] : null);

    if (!token) {
      return next(new Error('Authentication required. No token provided.'));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Access token has expired. Please refresh your session.'
          : 'Invalid or expired token.';
      return next(new Error(message));
    }

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return next(new Error('The user belonging to this token no longer exists.'));
    }

    if (user.is_banned) {
      return next(new Error('Your account has been banned. Contact support for assistance.'));
    }

    socket.user = { id: user.id, role: user.role, email: user.email, name: user.name };

    // MODULE 6: recorded so sockets/index.js can schedule a forced
    // disconnect for the exact moment THIS token expires, rather than
    // letting the connection stay authenticated indefinitely past it.
    socket.tokenExpiresAt = decoded.exp * 1000;

    next();
  } catch (err) {
    // Unexpected failure (DB down, etc.) — never let a raw error/stack leak
    // to the client; log server-side and give a generic rejection instead.
    console.error('[Socket Auth] Unexpected error during handshake authentication:', err.message);
    next(new Error('Authentication failed. Please try again.'));
  }
}

module.exports = socketAuthMiddleware;
