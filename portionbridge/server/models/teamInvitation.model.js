const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `team_invitations` table.
 * Provides CRUD operations for team invitation management.
 */

const BASE_COLUMNS = `
  id, team_id, invited_by, invited_user_id, invited_email, status, expires_at, responded_at, created_at
`;

/**
 * Creates a new team invitation.
 * @param {Object} data - Invitation data
 * @param {number} data.teamId - Team ID
 * @param {number} data.invitedBy - User ID of the inviter
 * @param {number} data.invitedUserId - User ID of the invitee
 * @param {string|null} data.invitedEmail - Email of the invitee (optional)
 * @param {Date} data.expiresAt - Expiration date
 * @returns {Promise<number>} The insert ID
 */
async function create({ teamId, invitedBy, invitedUserId, invitedEmail, expiresAt }) {
  const [result] = await pool.query(
    `INSERT INTO team_invitations (team_id, invited_by, invited_user_id, invited_email, expires_at)
     VALUES (:teamId, :invitedBy, :invitedUserId, :invitedEmail, :expiresAt)`,
    {
      teamId,
      invitedBy,
      invitedUserId,
      invitedEmail: invitedEmail || null,
      expiresAt,
    }
  );
  return result.insertId;
}

/**
 * Finds an invitation by ID.
 * @param {number} id - Invitation ID
 * @returns {Promise<Object|null>} Invitation object or null if not found
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM team_invitations WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Finds pending invitations for a team.
 * @param {number} teamId - Team ID
 * @returns {Promise<Array>} Array of pending invitations
 */
async function findPendingByTeamId(teamId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM team_invitations 
     WHERE team_id = :teamId AND status = 'pending'
     ORDER BY created_at DESC`,
    { teamId }
  );
  return rows;
}

/**
 * Finds pending invitations for a user.
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of pending invitations with team details
 */
async function findPendingByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT ti.id, ti.team_id, ti.invited_by, ti.invited_user_id, ti.invited_email, 
            ti.status, ti.expires_at, ti.responded_at, ti.created_at,
            t.name AS team_name, t.description AS team_description,
            u.name AS inviter_name, u.profile_photo AS inviter_photo
     FROM team_invitations ti
     JOIN teams t ON ti.team_id = t.id
     JOIN users u ON ti.invited_by = u.id
     WHERE ti.invited_user_id = :userId AND ti.status = 'pending'
     ORDER BY ti.created_at DESC`,
    { userId }
  );
  return rows;
}

/**
 * Finds a pending invitation for a specific team and user.
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Invitation object or null if not found
 */
async function findPendingByTeamAndUser(teamId, userId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM team_invitations 
     WHERE team_id = :teamId AND invited_user_id = :userId AND status = 'pending'
     LIMIT 1`,
    { teamId, userId }
  );
  return rows[0] || null;
}

/**
 * Updates invitation status.
 * @param {number} id - Invitation ID
 * @param {string} status - New status
 * @param {Date|null} respondedAt - Response timestamp
 * @returns {Promise<void>}
 */
async function updateStatus(id, status, respondedAt = null) {
  await pool.query(
    `UPDATE team_invitations 
     SET status = :status, responded_at = :respondedAt 
     WHERE id = :id`,
    { status, respondedAt, id }
  );
}

/**
 * Deletes an invitation by ID.
 * @param {number} id - Invitation ID
 * @returns {Promise<void>}
 */
async function deleteById(id) {
  await pool.query(`DELETE FROM team_invitations WHERE id = :id`, { id });
}

/**
 * Deletes all invitations for a team.
 * @param {number} teamId - Team ID
 * @returns {Promise<void>}
 */
async function deleteByTeamId(teamId) {
  await pool.query(`DELETE FROM team_invitations WHERE team_id = :teamId`, { teamId });
}

/**
 * Deletes all invitations for a user.
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteByUserId(userId) {
  await pool.query(`DELETE FROM team_invitations WHERE invited_user_id = :userId`, { userId });
}

/**
 * Marks expired invitations as expired.
 * @returns {Promise<number>} Number of invitations marked as expired
 */
async function markExpired() {
  const [result] = await pool.query(
    `UPDATE team_invitations 
     SET status = 'expired', responded_at = NOW()
     WHERE status = 'pending' AND expires_at < NOW()`
  );
  return result.affectedRows;
}

/**
 * Counts pending invitations for a team.
 * @param {number} teamId - Team ID
 * @returns {Promise<number>} Number of pending invitations
 */
async function countPendingByTeamId(teamId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM team_invitations 
     WHERE team_id = :teamId AND status = 'pending'`,
    { teamId }
  );
  return rows[0].count;
}

/**
 * Counts pending invitations for a user.
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of pending invitations
 */
async function countPendingByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM team_invitations 
     WHERE invited_user_id = :userId AND status = 'pending'`,
    { userId }
  );
  return rows[0].count;
}

module.exports = {
  create,
  findById,
  findPendingByTeamId,
  findPendingByUserId,
  findPendingByTeamAndUser,
  updateStatus,
  deleteById,
  deleteByTeamId,
  deleteByUserId,
  markExpired,
  countPendingByTeamId,
  countPendingByUserId,
};
