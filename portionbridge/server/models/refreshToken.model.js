const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `refresh_tokens` table.
 * Backs revocable, rotatable refresh sessions (see migration_002_documentation.md
 * for the rotation/replay-detection design rationale).
 */

/**
 * Creates a new refresh token session row.
 *
 * Accepts an optional `connection` (defaults to `pool`) so it can run
 * inside a caller-owned transaction — see token.service.js#issueNewSession,
 * used during rotation to insert the replacement token on the same
 * connection that's holding the old token row's lock.
 * @returns {number} the new row's auto-increment ID
 */
async function createRefreshToken({ userId, tokenHash, userAgent, ipAddress, expiresAt }, connection = pool) {
  const [result] = await connection.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES (:userId, :tokenHash, :userAgent, :ipAddress, :expiresAt)`,
    {
      userId,
      tokenHash,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt,
    }
  );
  return result.insertId;
}

/**
 * Finds a refresh token row by its hash, regardless of revoked/expired state
 * (the caller needs to see revoked tokens too, to detect replay attempts).
 */
async function findByTokenHash(tokenHash) {
  const [rows] = await pool.query(
    `SELECT id, user_id, token_hash, is_revoked, replaced_by_token_id, expires_at, created_at
     FROM refresh_tokens
     WHERE token_hash = :tokenHash
     LIMIT 1`,
    { tokenHash }
  );
  return rows[0] || null;
}

/**
 * Marks a specific refresh token row as revoked and links it to the row
 * that replaced it (rotation chain).
 *
 * Accepts an optional `connection` (defaults to `pool`) — same reason as
 * createRefreshToken above, so this write lands on the same transaction
 * that's holding the row's lock.
 */
async function revokeAndReplace(id, replacedByTokenId, connection = pool) {
  await connection.query(
    `UPDATE refresh_tokens
     SET is_revoked = 1, replaced_by_token_id = :replacedByTokenId
     WHERE id = :id`,
    { id, replacedByTokenId }
  );
}

/**
 * Revokes a single refresh token row without linking a replacement
 * (used for plain logout of the current session).
 */
async function revokeById(id) {
  await pool.query(
    `UPDATE refresh_tokens SET is_revoked = 1 WHERE id = :id`,
    { id }
  );
}

/**
 * Revokes every active (non-revoked) refresh token for a user — used for
 * "logout all devices", after a password reset, and when a replay attack
 * is detected (kills the entire session family as a precaution).
 */
async function revokeAllForUser(userId) {
  await pool.query(
    `UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = :userId AND is_revoked = 0`,
    { userId }
  );
}

/**
 * Locks a refresh token row by hash with SELECT ... FOR UPDATE, for use
 * inside an active transaction. This is what makes rotation atomic: a
 * second, concurrent rotation attempt against the same token blocks here
 * until the first transaction commits or rolls back — by which point the
 * row is already revoked, so the second attempt correctly fails instead
 * of also succeeding.
 * @param {Object} connection - Active transaction connection
 * @param {string} tokenHash - Hash of the presented raw refresh token
 * @returns {Promise<Object|null>} Token row or null if no such hash exists
 */
async function lockByTokenHash(connection, tokenHash) {
  const [rows] = await connection.query(
    `SELECT id, user_id, token_hash, is_revoked, replaced_by_token_id, expires_at, created_at
     FROM refresh_tokens
     WHERE token_hash = :tokenHash
     FOR UPDATE`,
    { tokenHash }
  );
  return rows[0] || null;
}

module.exports = {
  createRefreshToken,
  findByTokenHash,
  lockByTokenHash,
  revokeAndReplace,
  revokeById,
  revokeAllForUser,
};
