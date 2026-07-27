const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `ratings` table.
 * One rating per (donation_request_id, rated_by) is enforced at the DB
 * level via uq_rating_per_donation_rater — the service layer's pre-check
 * is a fast, friendly path; this constraint is the real guarantee.
 */

const RATING_COLUMNS = `
  id, donation_request_id, rated_by, rated_user, stars, comment, created_at
`;

/**
 * Finds the rating for a donation, if one exists.
 * @param {number} donationRequestId - Donation ID
 * @returns {Promise<Object|null>} Rating object or null if not yet rated
 */
async function findByDonationId(donationRequestId) {
  const [rows] = await pool.query(
    `SELECT ${RATING_COLUMNS} FROM ratings WHERE donation_request_id = :donationRequestId LIMIT 1`,
    { donationRequestId }
  );
  return rows[0] || null;
}

/**
 * Finds a rating by its ID.
 * @param {number} id - Rating ID
 * @returns {Promise<Object|null>} Rating object or null if not found
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${RATING_COLUMNS} FROM ratings WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Inserts a new rating. MUST be called with an active transaction
 * connection (see rating.service.js#createRating), so the insert and its
 * accompanying notification commit or roll back together.
 * @param {Object} connection - Active transaction connection
 * @param {Object} data - Rating data
 * @param {number} data.donationRequestId - Donation being rated
 * @param {number} data.ratedBy - User giving the rating (the donor)
 * @param {number} data.ratedUser - User being rated (the volunteer)
 * @param {number} data.stars - Rating value, 1-5
 * @param {string|null} [data.comment] - Optional comment
 * @returns {Promise<number>} Insert ID of the new rating
 */
async function create(connection, { donationRequestId, ratedBy, ratedUser, stars, comment }) {
  const [result] = await connection.query(
    `INSERT INTO ratings (donation_request_id, rated_by, rated_user, stars, comment)
     VALUES (:donationRequestId, :ratedBy, :ratedUser, :stars, :comment)`,
    { donationRequestId, ratedBy, ratedUser, stars, comment: comment || null }
  );
  return result.insertId;
}

/**
 * Finds all ratings for a specific user (the user being rated).
 * @param {number} ratedUserId - ID of the user being rated
 * @returns {Promise<Array>} Array of rating objects
 */
async function findByRatedUserId(ratedUserId) {
  const [rows] = await pool.query(
    `SELECT ${RATING_COLUMNS} FROM ratings WHERE rated_user = :ratedUserId`,
    { ratedUserId }
  );
  return rows;
}

module.exports = { findByDonationId, findById, create, findByRatedUserId };
