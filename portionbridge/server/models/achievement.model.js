const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for achievements
 */

const ACHIEVEMENT_COLUMNS = `
  ua.id, ua.user_id, ua.achievement_type, ua.achievement_name, 
  ua.description, ua.icon, ua.unlocked_at
`;

/**
 * Finds all achievements for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of user achievements
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT ${ACHIEVEMENT_COLUMNS}
     FROM user_achievements ua
     WHERE ua.user_id = :userId
     ORDER BY ua.unlocked_at DESC`,
    { userId }
  );
  return rows;
}

/**
 * Finds a specific achievement for a user
 * @param {number} userId - User ID
 * @param {string} achievementType - Achievement type
 * @returns {Promise<Object|null>} Achievement object or null
 */
async function findByUserAndType(userId, achievementType) {
  const [rows] = await pool.query(
    `SELECT ${ACHIEVEMENT_COLUMNS}
     FROM user_achievements ua
     WHERE ua.user_id = :userId AND ua.achievement_type = :achievementType
     LIMIT 1`,
    { userId, achievementType }
  );
  return rows[0] || null;
}

/**
 * Inserts a new achievement for a user
 * @param {Object} data - Achievement data
 * @param {number} data.userId - User ID
 * @param {string} data.achievementType - Achievement type
 * @param {string} data.achievementName - Achievement name
 * @param {string} data.description - Achievement description
 * @param {string} data.icon - Achievement icon
 * @returns {Promise<number>} Insert ID of the new achievement
 */
async function create({ userId, achievementType, achievementName, description, icon }) {
  const [result] = await pool.query(
    `INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, icon)
     VALUES (:userId, :achievementType, :achievementName, :description, :icon)`,
    { userId, achievementType, achievementName, description, icon }
  );
  return result.insertId;
}

/**
 * Gets all achievement definitions
 * @param {Object} options
 * @param {string} [options.role] - Filter by role (donor, volunteer, both)
 * @param {boolean} [options.activeOnly] - Only active achievements
 * @returns {Promise<Array>} Array of achievement definitions
 */
async function getDefinitions({ role, activeOnly = true } = {}) {
  let query = `SELECT * FROM achievement_definitions WHERE 1=1`;
  const params = {};

  if (role && role !== 'both') {
    query += ` AND role IN (:role, 'both')`;
    params.role = role;
  }

  if (activeOnly) {
    query += ` AND is_active = 1`;
  }

  query += ` ORDER BY points DESC`;

  const [rows] = await pool.query(query, params);
  return rows;
}

/**
 * Gets user's total achievement points
 * @param {number} userId - User ID
 * @returns {Promise<number>} Total points
 */
async function getUserPoints(userId) {
  const [rows] = await pool.query(
    `SELECT SUM(ad.points) AS total_points
     FROM user_achievements ua
     JOIN achievement_definitions ad ON ua.achievement_type = ad.type
     WHERE ua.user_id = :userId`,
    { userId }
  );
  return rows[0].total_points || 0;
}

/**
 * Gets user's achievement count
 * @param {number} userId - User ID
 * @returns {Promise<number>} Total count
 */
async function getUserCount(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM user_achievements WHERE user_id = :userId`,
    { userId }
  );
  return rows[0].total;
}

module.exports = {
  findByUserId,
  findByUserAndType,
  create,
  getDefinitions,
  getUserPoints,
  getUserCount,
};
