const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `password_history` table.
 * Used to prevent password reuse across a user's last N passwords.
 */

/**
 * Returns the most recent `limit` password hashes for a user, most recent first.
 */
async function getRecentPasswordHashes(userId, limit) {
  const [rows] = await pool.query(
    `SELECT id, password_hash
     FROM password_history
     WHERE user_id = :userId
     ORDER BY created_at DESC
     LIMIT ${Number(limit)}`,
    { userId }
  );
  return rows;
}

/**
 * Inserts a new password hash into the history table.
 */
async function addPasswordToHistory(userId, passwordHash) {
  await pool.query(
    `INSERT INTO password_history (user_id, password_hash)
     VALUES (:userId, :passwordHash)`,
    { userId, passwordHash }
  );
}

/**
 * Prunes password history rows beyond the configured retention limit,
 * keeping only the most recent `limit` rows per user.
 */
async function pruneOldHistory(userId, limit) {
  await pool.query(
    `DELETE FROM password_history
     WHERE user_id = :userId
       AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM password_history
           WHERE user_id = :userId
           ORDER BY created_at DESC
           LIMIT ${Number(limit)}
         ) AS keep_ids
       )`,
    { userId }
  );
}

module.exports = {
  getRecentPasswordHashes,
  addPasswordToHistory,
  pruneOldHistory,
};
