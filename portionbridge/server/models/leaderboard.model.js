const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the top_donors / top_volunteers leaderboard
 * views. All aggregation lives in the views themselves (see
 * database/portionbridge_schema.sql and migration_007) — this module only
 * reads from them, whitelisting sort columns and applying pagination.
 */

const ALLOWED_DONOR_SORT_COLUMNS = ['completed_count', 'total_quantity_donated', 'average_rating', 'total_donations'];
const ALLOWED_VOLUNTEER_SORT_COLUMNS = ['completed_count', 'average_rating', 'total_pickups'];

/**
 * Lists the top_donors view, sorted/paginated.
 * @param {Object} options
 * @param {string} [options.sortBy] - Sort column (whitelisted)
 * @param {string} [options.sortOrder] - Sort direction (asc/desc)
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of donor leaderboard rows
 */
async function findTopDonors({ sortBy, sortOrder, limit, offset }) {
  const orderColumn = ALLOWED_DONOR_SORT_COLUMNS.includes(sortBy) ? sortBy : 'completed_count';
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `SELECT user_id, donor_name, profile_photo, total_donations, completed_count,
            total_quantity_donated, average_rating
     FROM top_donors
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT :limit OFFSET :offset`,
    { limit, offset }
  );
  return rows;
}

/**
 * Total number of rows in top_donors — powers pagination meta.
 * @returns {Promise<number>} Total count
 */
async function countTopDonors() {
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM top_donors`);
  return rows[0].total;
}

/**
 * Lists the top_volunteers view, sorted/paginated.
 * @param {Object} options
 * @param {string} [options.sortBy] - Sort column (whitelisted)
 * @param {string} [options.sortOrder] - Sort direction (asc/desc)
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of volunteer leaderboard rows
 */
async function findTopVolunteers({ sortBy, sortOrder, limit, offset }) {
  const orderColumn = ALLOWED_VOLUNTEER_SORT_COLUMNS.includes(sortBy) ? sortBy : 'completed_count';
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `SELECT user_id, volunteer_name, profile_photo, total_pickups, completed_count, average_rating
     FROM top_volunteers
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT :limit OFFSET :offset`,
    { limit, offset }
  );
  return rows;
}

/**
 * Total number of rows in top_volunteers — powers pagination meta.
 * @returns {Promise<number>} Total count
 */
async function countTopVolunteers() {
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM top_volunteers`);
  return rows[0].total;
}

module.exports = {
  findTopDonors,
  countTopDonors,
  findTopVolunteers,
  countTopVolunteers,
};
