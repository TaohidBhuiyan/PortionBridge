const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `email_verifications` table.
 * Stores only a SHA-256 hash of the verification token.
 */

/**
 * Creates a new email verification record.
 * @param {number} userId
 * @param {string} tokenHash - SHA-256 hash of the raw token
 * @param {Date} expiresAt
 */
async function createVerificationToken({ userId, tokenHash, expiresAt }) {
  await pool.query(
    `INSERT INTO email_verifications (user_id, token_hash, expires_at)
     VALUES (:userId, :tokenHash, :expiresAt)`,
    { userId, tokenHash, expiresAt }
  );
}

/**
 * Finds a still-valid (unused, not expired) verification record by its hashed token.
 */
async function findValidToken(tokenHash) {
  const [rows] = await pool.query(
    `SELECT id, user_id, token_hash, expires_at, is_used
     FROM email_verifications
     WHERE token_hash = :tokenHash AND is_used = 0 AND expires_at > NOW()
     LIMIT 1`,
    { tokenHash }
  );
  return rows[0] || null;
}

/**
 * Marks a specific verification record as used, so it cannot be replayed.
 */
async function markTokenUsed(id) {
  await pool.query(
    `UPDATE email_verifications SET is_used = 1 WHERE id = :id`,
    { id }
  );
}

/**
 * Invalidates all outstanding (unused) verification tokens for a user —
 * called before issuing a fresh one (e.g. resend-verification), so only the
 * most recently issued token is valid.
 */
async function invalidateAllForUser(userId) {
  await pool.query(
    `UPDATE email_verifications SET is_used = 1 WHERE user_id = :userId AND is_used = 0`,
    { userId }
  );
}

module.exports = {
  createVerificationToken,
  findValidToken,
  markTokenUsed,
  invalidateAllForUser,
};
