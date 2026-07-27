const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `password_resets` table.
 * Stores only a SHA-256 hash of the reset token — never the raw token itself.
 */

/**
 * Creates a new password reset record.
 * @param {number} userId
 * @param {string} token - SHA-256 hash of the raw token (never store raw tokens)
 * @param {Date} expiresAt
 */
async function createResetToken({ userId, token, expiresAt }) {
  await pool.query(
    `INSERT INTO password_resets (user_id, token, expires_at)
     VALUES (:userId, :token, :expiresAt)`,
    { userId, token, expiresAt }
  );
}

/**
 * Finds a still-valid (unused, not expired) reset record by its hashed token.
 */
async function findValidToken(hashedToken) {
  const [rows] = await pool.query(
    `SELECT id, user_id, token, expires_at, is_used
     FROM password_resets
     WHERE token = :hashedToken AND is_used = 0 AND expires_at > NOW()
     LIMIT 1`,
    { hashedToken }
  );
  return rows[0] || null;
}

/**
 * Marks a specific reset record as used, so it cannot be replayed.
 */
async function markTokenUsed(id) {
  await pool.query(
    `UPDATE password_resets SET is_used = 1 WHERE id = :id`,
    { id }
  );
}

/**
 * Invalidates all outstanding (unused) reset tokens for a user — called both
 * before issuing a new token (so only the latest one is valid) and after a
 * successful reset (so no stale tokens remain usable).
 */
async function invalidateAllForUser(userId) {
  await pool.query(
    `UPDATE password_resets SET is_used = 1 WHERE user_id = :userId AND is_used = 0`,
    { userId }
  );
}

module.exports = {
  createResetToken,
  findValidToken,
  markTokenUsed,
  invalidateAllForUser,
};
