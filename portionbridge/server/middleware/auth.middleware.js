const { verifyAccessToken } = require('../utils/token');
const { error } = require('../utils/apiResponse');
const { HTTP_STATUS, AUTH } = require('../constants');
const userModel = require('../models/user.model');

/**
 * Protects a route: requires a valid `Authorization: Bearer <accessToken>` header.
 * On success, attaches a minimal `req.user = { id, role, email, name }` object
 * for downstream handlers and the `authorize` middleware to use.
 *
 * In development mode, also accepts a special dev bypass token for quick testing.
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Development mode bypass
    if (AUTH.DEV_MODE && token === AUTH.DEV_BYPASS_TOKEN) {
      const devRole = req.headers['x-dev-role'];
      const validRoles = ['donor', 'volunteer', 'admin'];
      
      if (!devRole || !validRoles.includes(devRole)) {
        return error(res, {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: 'Development mode: Set x-dev-role header to donor, volunteer, or admin',
        });
      }

      req.user = {
        id: `dev-${devRole}`,
        role: devRole,
        email: `dev-${devRole}@portionbridge.dev`,
        name: `Dev ${devRole.charAt(0).toUpperCase() + devRole.slice(1)}`,
      };
      return next();
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Access token has expired. Please refresh your session.'
          : 'Invalid access token.';
      return error(res, { statusCode: HTTP_STATUS.UNAUTHORIZED, message });
    }

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return error(res, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.is_banned) {
      return error(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: 'Your account has been banned. Contact support for assistance.',
      });
    }

    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restricts a route to one or more roles. Must be used AFTER `protect`,
 * since it depends on `req.user` being set.
 *
 * Usage:
 *   router.get('/admin-only', protect, authorize('admin'), handler);
 *   router.get('/staff-only', protect, authorize('admin', 'volunteer'), handler);
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = { protect, authorize };
