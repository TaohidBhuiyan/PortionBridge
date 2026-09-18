const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `team_join_requests` table.
 * Provides CRUD operations for volunteer team join requests.
 */

const BASE_COLUMNS = `
  id, team_id, user_id, status, message, responded_at, created_at, updated_at
`;

/**
 * Creates a new team join request.
 * @param {Object} data - Request data
 * @param {number} data.teamId - Team ID
 * @param {number} data.userId - User ID of requesting volunteer
 * @param {string|null} data.message - Optional request note
 * @returns {Promise<number>} Insert ID
 */
async function create({ teamId, userId, message }) {
  const [result] = await pool.query(
    `INSERT INTO team_join_requests (team_id, user_id, message)
     VALUES (:teamId, :userId, :message)`,
    {
      teamId,
      userId,
      message: message || null,
    }
  );
  return result.insertId;
}

/**
 * Finds a join request by ID.
 * @param {number} id - Request ID
 * @returns {Promise<Object|null>} Request object or null
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM team_join_requests WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Finds pending join requests for a team (for team leaders).
 * @param {number} teamId - Team ID
 * @returns {Promise<Array>} Pending requests with requester details
 */
async function findPendingByTeamId(teamId) {
  const [rows] = await pool.query(
    `SELECT tjr.id, tjr.team_id, tjr.user_id, tjr.status, tjr.message, tjr.created_at,
            u.name AS volunteer_name, u.email AS volunteer_email, u.profile_photo AS volunteer_photo
     FROM team_join_requests tjr
     JOIN users u ON tjr.user_id = u.id
     WHERE tjr.team_id = :teamId AND tjr.status = 'pending'
     ORDER BY tjr.created_at DESC`,
    { teamId }
  );
  return rows;
}

/**
 * Finds pending join request for a specific team and user.
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Request object or null
 */
async function findPendingByTeamAndUser(teamId, userId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM team_join_requests 
     WHERE team_id = :teamId AND user_id = :userId AND status = 'pending'
     LIMIT 1`,
    { teamId, userId }
  );
  return rows[0] || null;
}

/**
 * Finds latest request for a specific team and user regardless of status.
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Request object or null
 */
async function findLatestByTeamAndUser(teamId, userId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM team_join_requests 
     WHERE team_id = :teamId AND user_id = :userId
     ORDER BY created_at DESC LIMIT 1`,
    { teamId, userId }
  );
  return rows[0] || null;
}

/**
 * Finds all join requests sent by a volunteer.
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Requests with team details
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT tjr.id, tjr.team_id, tjr.user_id, tjr.status, tjr.message, tjr.responded_at, tjr.created_at,
            t.name AS team_name, t.description AS team_description, t.base_address,
            u.name AS leader_name
     FROM team_join_requests tjr
     JOIN teams t ON tjr.team_id = t.id
     JOIN users u ON t.leader_id = u.id
     WHERE tjr.user_id = :userId
     ORDER BY tjr.created_at DESC`,
    { userId }
  );
  return rows;
}

/**
 * Updates status of a join request.
 * @param {number} id - Request ID
 * @param {string} status - New status ('accepted', 'rejected', 'cancelled')
 * @param {Date|null} respondedAt - Timestamp
 * @param {Object} executor - Database executor (defaults to pool)
 * @returns {Promise<void>}
 */
async function updateStatus(id, status, respondedAt = new Date(), executor = pool) {
  await executor.query(
    `UPDATE team_join_requests
     SET status = :status, responded_at = :respondedAt
     WHERE id = :id`,
    { status, respondedAt, id }
  );
}

/**
 * Deletes a request by ID.
 * @param {number} id - Request ID
 * @returns {Promise<void>}
 */
async function deleteById(id) {
  await pool.query(`DELETE FROM team_join_requests WHERE id = :id`, { id });
}

module.exports = {
  create,
  findById,
  findPendingByTeamId,
  findPendingByTeamAndUser,
  findLatestByTeamAndUser,
  findByUserId,
  updateStatus,
  deleteById,
};
