const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generates a short-lived access token used to authenticate individual API
 * requests. Sent to the client in the JSON response body (never as a
 * cookie) and attached by the frontend as `Authorization: Bearer <token>`.
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });
}

/**
 * Verifies an access token. Throws (TokenExpiredError / JsonWebTokenError) on failure.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

/**
 * Generates a cryptographically random opaque refresh token (NOT a JWT).
 * Refresh tokens are intentionally opaque: they carry no embedded claims and
 * derive all meaning from their corresponding row in the `refresh_tokens`
 * table (owner, expiry, revocation state), which is what makes per-session
 * revocation and rotation possible.
 */
function generateOpaqueToken(byteLength = 48) {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Hashes any opaque token (refresh token, password reset token, email
 * verification token) with SHA-256 before it is stored in the database.
 * Only the hash is ever persisted — the raw token exists only in the
 * response body / cookie / email sent to the client.
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a random CSRF token for the double-submit cookie pattern.
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Constant-time comparison of two equal-length hex strings, to avoid
 * timing side-channel attacks when comparing CSRF tokens.
 */
function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateOpaqueToken,
  hashToken,
  generateCsrfToken,
  timingSafeEqualHex,
};
