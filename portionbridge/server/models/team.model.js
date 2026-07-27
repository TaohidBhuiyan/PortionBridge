const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `teams` table.
 * Provides CRUD operations for team management.
 */

const BASE_COLUMNS = `
  id, name, description, leader_id, created_at, updated_at
`;

/**
 * Creates a new team.
 * @param {Object} data - Team data
 * @param {string} data.name - Team name
 * @param {string|null} data.description - Team description
 * @param {number} data.leaderId - User ID of the team leader
 * @returns {Promise<number>} The insert ID
 */
async function create({ name, description, leaderId }) {
  const [result] = await pool.query(
    `INSERT INTO teams (name, description, leader_id)
     VALUES (:name, :description, :leaderId)`,
    {
      name,
      description: description || null,
      leaderId,
    }
  );
  return result.insertId;
}

/**
 * Finds a team by ID.
 * @param {number} id - Team ID
 * @returns {Promise<Object|null>} Team object or null if not found
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM teams WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Finds a team by leader ID.
 * @param {number} leaderId - User ID of the leader
 * @returns {Promise<Object|null>} Team object or null if not found
 */
async function findByLeaderId(leaderId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM teams WHERE leader_id = :leaderId LIMIT 1`,
    { leaderId }
  );
  return rows[0] || null;
}

/**
 * Updates team information.
 * @param {number} id - Team ID
 * @param {Object} fields - Fields to update
 * @returns {Promise<void>}
 */
async function update(id, fields) {
  const setClauses = [];
  const params = { id };

  const fieldMap = {
    name: 'name',
    description: 'description',
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
    `UPDATE teams SET ${setClauses.join(', ')} WHERE id = :id`,
    params
  );
}

/**
 * Updates the team leader.
 * @param {number} id - Team ID
 * @param {number} newLeaderId - New leader's user ID
 * @returns {Promise<void>}
 */
async function updateLeader(id, newLeaderId) {
  await pool.query(
    `UPDATE teams SET leader_id = :newLeaderId WHERE id = :id`,
    { newLeaderId, id }
  );
}

/**
 * Deletes a team.
 * @param {number} id - Team ID
 * @returns {Promise<void>}
 */
async function deleteById(id) {
  await pool.query(`DELETE FROM teams WHERE id = :id`, { id });
}

/**
 * Checks if a user is leading any team.
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user is a leader
 */
async function isUserLeader(userId) {
  const [rows] = await pool.query(
    `SELECT id FROM teams WHERE leader_id = :userId LIMIT 1`,
    { userId }
  );
  return rows.length > 0;
}

module.exports = {
  create,
  findById,
  findByLeaderId,
  update,
  updateLeader,
  deleteById,
  isUserLeader,
};
