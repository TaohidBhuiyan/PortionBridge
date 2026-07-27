const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `user_preferences` table.
 * Provides CRUD operations for user preferences, primarily for donors.
 */

const BASE_COLUMNS = `
  id, user_id, preferred_pickup_time_slot, preferred_contact_method, created_at, updated_at
`;

/**
 * Creates or updates user preferences for a user.
 * Uses INSERT ... ON DUPLICATE KEY UPDATE for upsert behavior.
 * @param {Object} data - Preference data
 * @param {number} data.userId - ID of the user
 * @param {string|null} data.preferredPickupTimeSlot - Preferred pickup time slot
 * @param {string} data.preferredContactMethod - Preferred contact method
 * @returns {Promise<number>} The insert ID or existing ID
 */
async function upsert({ userId, preferredPickupTimeSlot, preferredContactMethod }) {
  const [result] = await pool.query(
    `INSERT INTO user_preferences (user_id, preferred_pickup_time_slot, preferred_contact_method)
     VALUES (:userId, :preferredPickupTimeSlot, :preferredContactMethod)
     ON DUPLICATE KEY UPDATE
       preferred_pickup_time_slot = VALUES(preferred_pickup_time_slot),
       preferred_contact_method = VALUES(preferred_contact_method)`,
    {
      userId,
      preferredPickupTimeSlot: preferredPickupTimeSlot || null,
      preferredContactMethod: preferredContactMethod || 'both',
    }
  );
  return result.insertId || result.affectedRows > 0 ? userId : null;
}

/**
 * Finds user preferences by user ID.
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Preferences object or null if not found
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM user_preferences WHERE user_id = :userId LIMIT 1`,
    { userId }
  );
  return rows[0] || null;
}

/**
 * Updates specific fields of user preferences.
 * @param {number} userId - User ID
 * @param {Object} fields - Fields to update
 * @returns {Promise<void>}
 */
async function updateByUserId(userId, fields) {
  const setClauses = [];
  const params = { userId };

  const fieldMap = {
    preferredPickupTimeSlot: 'preferred_pickup_time_slot',
    preferredContactMethod: 'preferred_contact_method',
  };

  Object.keys(fields).forEach((camelKey) => {
    if (fields[camelKey] !== undefined && fieldMap[camelKey]) {
      const snakeKey = fieldMap[camelKey];
      setClauses.push(`${snakeKey} = :${camelKey}`);
      params[camelKey] = fields[camelKey];
    }
  });

  if (setClauses.length === 0) return;

  await pool.query(
    `UPDATE user_preferences SET ${setClauses.join(', ')} WHERE user_id = :userId`,
    params
  );
}

/**
 * Deletes user preferences for a user.
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteByUserId(userId) {
  await pool.query(`DELETE FROM user_preferences WHERE user_id = :userId`, { userId });
}

module.exports = {
  upsert,
  findByUserId,
  updateByUserId,
  deleteByUserId,
};
