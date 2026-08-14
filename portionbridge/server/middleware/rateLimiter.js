const rateLimit = require('express-rate-limit');
const { RATE_LIMIT, AUTH, HTTP_STATUS } = require('../constants');
const { error } = require('../utils/apiResponse');

/**
 * General-purpose API rate limiter — applies to all /api routes to prevent
 * abuse/DoS from a single client.
 */
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return error(res, {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: 'Too many requests. Please try again later.',
    });
  },
});

/**
 * Strict rate limiter for the login endpoint specifically, on top of the
 * per-account lockout in auth.service.js. This protects against distributed
 * brute-force attempts across many different accounts from the same IP,
 * which per-account lockout alone would not catch.
 *
 * PRODUCTION AUDIT: this was previously disabled (replaced with a no-op
 * passthrough) behind a "disabled for local testing / developer
 * convenience" comment, leaving the /login endpoint with zero brute-force
 * protection of any kind — combined with the account-lockout logic in
 * auth.service.js also being commented out (see that file), an attacker
 * could attempt unlimited password guesses against any account. The
 * limiter itself was already fully implemented and correctly configured;
 * re-enabled as-is, no logic changes.
 */
const loginLimiter = rateLimit({
  windowMs: AUTH.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: AUTH.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts against the limit
  handler: (req, res) => {
    return error(res, {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: 'Too many login attempts from this IP address. Please try again later.',
    });
  },
});

/**
 * Rate limiter for registration, to slow down mass account creation / abuse.
 */
const registerLimiter = rateLimit({
  windowMs: AUTH.REGISTER_RATE_LIMIT_WINDOW_MS,
  max: AUTH.REGISTER_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return error(res, {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: 'Too many accounts created from this IP address. Please try again later.',
    });
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: AUTH.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
  max: AUTH.FORGOT_PASSWORD_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return error(res, {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: 'Too many password reset requests. Please try again later.',
    });
  },
});

module.exports = { apiLimiter, loginLimiter, registerLimiter, forgotPasswordLimiter };
