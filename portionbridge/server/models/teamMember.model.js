const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `team_members` table.
 * Provides CRUD operations for team membership management.
 */

const BASE_COLUMNS = `
  id, team_id, user_id, role, joined_at
`;

/**
 * Adds a member to a team.
 * @param {Object} data - Member data
 * @param {number} data.teamId - Team ID
 * @param {number} data.userId - User ID
 * @param {string} data.role - Role (leader or member)
 * @returns {Promise<number>} The insert ID
 */
async function create({ teamId, userId, role }) {
  const [result] = await pool.query(
    `INSERT INTO team_members (team_id, user_id, role)
     VALUES (:teamId, :userId, :role)`,
    {
      teamId,
      userId,
      role,
    }
  );
  return result.insertId;
}

/**
 * Finds a team member by user ID.
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Team member object or null if not found
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM team_members WHERE user_id = :userId LIMIT 1`,
    { userId }
  );
  return rows[0] || null;
}

/**
 * Finds a team member by team ID and user ID.
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Team member object or null if not found
 */
async function findByTeamAndUser(teamId, userId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM team_members 
     WHERE team_id = :teamId AND user_id = :userId LIMIT 1`,
    { teamId, userId }
  );
  return rows[0] || null;
}

/**
 * Lists all members of a team with user details.
 * @param {number} teamId - Team ID
 * @returns {Promise<Array>} Array of member objects with user details
 */
async function findByTeamId(teamId) {
  const [rows] = await pool.query(
    `SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.joined_at,
            u.name, u.email, u.profile_photo
     FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     WHERE tm.team_id = :teamId
     ORDER BY tm.role DESC, tm.joined_at ASC`,
    { teamId }
  );
  return rows;
}

/**
 * Updates a member's role.
 * @param {number} id - Team member ID
 * @param {string} role - New role
 * @returns {Promise<void>}
 */
async function updateRole(id, role) {
  await pool.query(
    `UPDATE team_members SET role = :role WHERE id = :id`,
    { role, id }
  );
}

/**
 * Updates a member's role by user ID.
 * @param {number} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<void>}
 */
async function updateRoleByUserId(userId, role) {
  await pool.query(
    `UPDATE team_members SET role = :role WHERE user_id = :userId`,
    { role, userId }
  );
}

/**
 * Removes a member from a team by member ID.
 * @param {number} id - Team member ID
 * @returns {Promise<void>}
 */
async function deleteById(id) {
  await pool.query(`DELETE FROM team_members WHERE id = :id`, { id });
}

/**
 * Removes a member from a team by user ID.
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteByUserId(userId) {
  await pool.query(`DELETE FROM team_members WHERE user_id = :userId`, { userId });
}

/**
 * Removes all members from a team.
 * @param {number} teamId - Team ID
 * @returns {Promise<void>}
 */
async function deleteByTeamId(teamId) {
  await pool.query(`DELETE FROM team_members WHERE team_id = :teamId`, { teamId });
}

/**
 * Counts members in a team.
 * @param {number} teamId - Team ID
 * @returns {Promise<number>} Number of members
 */
async function countByTeamId(teamId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM team_members WHERE team_id = :teamId`,
    { teamId }
  );
  return rows[0].count;
}

/**
 * Checks if a user is a member of any team.
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user is a team member
 */
async function isUserInTeam(userId) {
  const [rows] = await pool.query(
    `SELECT id FROM team_members WHERE user_id = :userId LIMIT 1`,
    { userId }
  );
  return rows.length > 0;
}

/**
 * Gets the leader of a team.
 * @param {number} teamId - Team ID
 * @returns {Promise<Object|null>} Leader object or null if not found
 */
async function getTeamLeader(teamId) {
  const [rows] = await pool.query(
    `SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.joined_at,
            u.name, u.email, u.profile_photo
     FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     WHERE tm.team_id = :teamId AND tm.role = 'leader'
     LIMIT 1`,
    { teamId }
  );
  return rows[0] || null;
}

module.exports = {
  create,
  findByUserId,
  findByTeamAndUser,
  findByTeamId,
  updateRole,
  updateRoleByUserId,
  deleteById,
  deleteByUserId,
  deleteByTeamId,
  countByTeamId,
  isUserInTeam,
  getTeamLeader,
};
