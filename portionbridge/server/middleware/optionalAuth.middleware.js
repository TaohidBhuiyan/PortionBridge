const { verifyAccessToken } = require('../utils/token');
const { error } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants');
const userModel = require('../models/user.model');

/**
 * For routes that are public but return more to a signed-in user (e.g. an admin
 * or the reporter of an incident). No Authorization header -> continue
 * anonymously. A header that is present but invalid/expired, or belongs to a
 * missing/banned account, is rejected exactly like `protect` would — a bad
 * token is never silently downgraded to anonymous.
 * Does not replace or change `protect`.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    if (!authHeader.startsWith('Bearer ')) {
      return error(res, { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid authorization header.' });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(authHeader.split(' ')[1]);
    } catch (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Access token has expired. Please refresh your session.'
        : 'Invalid access token.';
      return error(res, { statusCode: HTTP_STATUS.UNAUTHORIZED, message });
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return error(res, { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'The user belonging to this token no longer exists.' });
    }
    if (user.is_banned) {
      return error(res, { statusCode: HTTP_STATUS.FORBIDDEN, message: 'Your account has been banned. Contact support for assistance.', code: 'ACCOUNT_BANNED' });
    }

    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { optionalAuth };
