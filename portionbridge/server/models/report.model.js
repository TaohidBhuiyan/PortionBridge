const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `reports` table.
 * "One report per user per donation" is enforced at the DB level via
 * uq_reports_reporter_donation (added in migration_006) — the service
 * layer's pre-check is a fast, friendly path; this constraint is the
 * real guarantee.
 */

const REPORT_COLUMNS = `
  id, reporter_id, reported_user_id, reported_donation_id, reason, details, status, created_at, updated_at
`;

const ALLOWED_REPORT_SORT_COLUMNS = ['created_at', 'status'];

/**
 * Inserts a new report. MUST be called with an active transaction
 * connection (see report.service.js#createReport).
 * @param {Object} connection - Active transaction connection
 * @param {Object} data - Report data
 * @param {number} data.reporterId - User filing the report
 * @param {number|null} [data.reportedUserId] - User being reported, if any
 * @param {number} data.reportedDonationId - Donation the report relates to
 * @param {string} data.reason - Reason for the report
 * @param {string|null} [data.details] - Optional additional details
 * @returns {Promise<number>} Insert ID of the new report
 */
async function create(connection, { reporterId, reportedUserId, reportedDonationId, reason, details }) {
  const [result] = await connection.query(
    `INSERT INTO reports (reporter_id, reported_user_id, reported_donation_id, reason, details)
     VALUES (:reporterId, :reportedUserId, :reportedDonationId, :reason, :details)`,
    {
      reporterId,
      reportedUserId: reportedUserId || null,
      reportedDonationId,
      reason,
      details: details || null,
    }
  );
  return result.insertId;
}

/**
 * Finds a report by its ID.
 * @param {number} id - Report ID
 * @returns {Promise<Object|null>} Report object or null if not found
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${REPORT_COLUMNS} FROM reports WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Finds an existing report by this reporter for this donation, if any —
 * used for the "one report per user per donation" pre-check.
 * @param {number} reporterId - Reporting user's ID
 * @param {number} donationId - Donation ID
 * @returns {Promise<Object|null>} Report object or null if none exists
 */
async function findByReporterAndDonation(reporterId, donationId) {
  const [rows] = await pool.query(
    `SELECT ${REPORT_COLUMNS} FROM reports
     WHERE reporter_id = :reporterId AND reported_donation_id = :donationId
     LIMIT 1`,
    { reporterId, donationId }
  );
  return rows[0] || null;
}

/**
 * Builds the shared WHERE clause + params for "my reports". Used by both
 * findMyReports (data) and countMyReports (total), so the two never drift
 * out of sync — same pattern as donation.model.js#buildHistoryFilter.
 * @param {Object} filters
 * @param {number} filters.reporterId - Reporting user's ID
 * @param {string} [filters.status] - Filter by report status
 * @returns {Object} Object containing whereClause string and params object
 */
function buildMyReportsFilter({ reporterId, status }) {
  const conditions = ['reporter_id = :reporterId'];
  const params = { reporterId };

  if (status) {
    conditions.push('status = :status');
    params.status = status;
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Lists the requesting user's own filed reports, with optional status
 * filter, whitelisted sort, and pagination.
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of report objects
 */
async function findMyReports({ reporterId, status, sortBy, sortOrder, limit, offset }) {
  const { whereClause, params } = buildMyReportsFilter({ reporterId, status });
  const orderColumn = ALLOWED_REPORT_SORT_COLUMNS.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `SELECT ${REPORT_COLUMNS} FROM reports
     WHERE ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

/**
 * Total count matching the same filters as findMyReports. Powers pagination meta.
 * @param {Object} filters - Filter options (same as buildMyReportsFilter)
 * @returns {Promise<number>} Total count of matching reports
 */
async function countMyReports({ reporterId, status }) {
  const { whereClause, params } = buildMyReportsFilter({ reporterId, status });
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM reports WHERE ${whereClause}`, params);
  return rows[0].total;
}

module.exports = {
  create,
  findById,
  findByReporterAndDonation,
  findMyReports,
  countMyReports,
};
