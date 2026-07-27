const { PAGINATION_DEFAULTS } = require('../constants');

/**
 * General-purpose helper functions shared across controllers/services.
 */

/**
 * Normalizes pagination query params into safe, bounded values.
 * Prevents callers from requesting e.g. limit=999999 and overloading the DB.
 */
function getPaginationParams(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) {
    page = PAGINATION_DEFAULTS.DEFAULT_PAGE;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    limit = PAGINATION_DEFAULTS.DEFAULT_LIMIT;
  }

  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
    limit = PAGINATION_DEFAULTS.MAX_LIMIT;
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Builds a standard pagination meta object to attach to list responses.
 */
function buildPaginationMeta({ page, limit, totalItems }) {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit) || 1,
  };
}

/**
 * Removes undefined/null keys from an object.
 * Useful before building dynamic SQL UPDATE statements.
 */
function stripEmptyFields(obj) {
  const result = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Removes sensitive fields (password hash, internal lockout counters) from a
 * user object before sending it back in an API response. Never leak
 * `password`, `failed_login_attempts`, or `lock_until` internals to clients.
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password, failed_login_attempts, lock_until, ...safeUser } = user;
  return safeUser;
}

/**
 * Generates a URL-safe random string, e.g. for filename prefixes.
 * Not cryptographically sensitive — just for uniqueness.
 */
function generateRandomString(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Extracts the client's real IP address from the request, accounting for
 * requests proxied through a load balancer/reverse proxy (X-Forwarded-For).
 * Falls back to the direct socket address if no proxy header is present.
 */
function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || null;
}

/**
 * Extracts a safe, length-bounded User-Agent string from the request headers.
 */
function getUserAgent(req) {
  const ua = req.headers['user-agent'];
  if (!ua) return null;
  return ua.length > 255 ? ua.slice(0, 255) : ua;
}

module.exports = {
  getPaginationParams,
  buildPaginationMeta,
  stripEmptyFields,
  sanitizeUser,
  generateRandomString,
  getClientIp,
  getUserAgent,
};
