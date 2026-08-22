const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `reports` table.
 * "One report per user per donation" is enforced at the DB level via
 * uq_reports_reporter_donation (added in migration_006) — the service
 * layer's pre-check is a fast, friendly path; this constraint is the
 * real guarantee.
 */

const REPORT_COLUMNS = `
  id, reporter_id, reported_user_id, reported_donation_id, reason, details,
  resolution_notes, status, resolved_by, resolved_at, created_at, updated_at
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

/**
 * Finds all reports filed against a specific donation, most recent first,
 * joined with the reporter's name for admin display. Backs Phase 3's
 * admin donation detail ("Reported" context) and the Donation Management
 * "Reported" filter in admin.model.js#buildAdminDonationFilter.
 * @param {number} donationId - Donation ID
 * @returns {Promise<Array>} Array of report rows with reporter_name
 */
async function findByDonationId(donationId) {
  const [rows] = await pool.query(
    `SELECT r.id, r.reporter_id, r.reported_user_id, r.reported_donation_id,
            r.reason, r.details, r.status, r.created_at, r.updated_at,
            reporter.name AS reporter_name, reporter.email AS reporter_email
     FROM reports r
     LEFT JOIN users reporter ON reporter.id = r.reporter_id
     WHERE r.reported_donation_id = :donationId
     ORDER BY r.created_at DESC`,
    { donationId }
  );
  return rows;
}

/* ============================================================
 * Admin moderation (Phase 8)
 * ============================================================ */

const ADMIN_REPORT_COLUMNS = `
  r.id, r.reporter_id, r.reported_user_id, r.reported_donation_id,
  r.reason, r.details, r.resolution_notes, r.status, r.resolved_by, r.resolved_at,
  r.created_at, r.updated_at,
  reporter.name AS reporter_name, reporter.email AS reporter_email,
  reportedUser.name AS reported_user_name, reportedUser.email AS reported_user_email,
  reportedUser.is_banned AS reported_user_banned,
  dr.title AS donation_title, dr.status AS donation_status,
  resolver.name AS resolved_by_name
`;

const ADMIN_REPORT_JOINS = `
  FROM reports r
  LEFT JOIN users reporter ON reporter.id = r.reporter_id
  LEFT JOIN users reportedUser ON reportedUser.id = r.reported_user_id
  LEFT JOIN donation_requests dr ON dr.id = r.reported_donation_id
  LEFT JOIN users resolver ON resolver.id = r.resolved_by
`;

/**
 * Builds the shared WHERE clause + params for the admin report list.
 * `targetType` distinguishes reports against a donation from reports
 * against a user only — the same real distinction Phase 7's Attention
 * Center already uses (reported_donation_id set vs. null), exposed here
 * as an explicit filter instead of the caller inferring it.
 * @param {Object} filters
 * @param {string} [filters.status] - pending/reviewed/resolved/dismissed
 * @param {string} [filters.targetType] - 'donation' | 'user'
 * @param {string} [filters.search] - Matches reason/details
 * @returns {Object} Object containing whereClause string and params object
 */
function buildAdminReportFilter({ status, targetType, search }) {
  const conditions = ['1 = 1'];
  const params = {};

  if (status) {
    conditions.push('r.status = :status');
    params.status = status;
  }
  if (targetType === 'donation') {
    conditions.push('r.reported_donation_id IS NOT NULL');
  } else if (targetType === 'user') {
    conditions.push('r.reported_donation_id IS NULL AND r.reported_user_id IS NOT NULL');
  }
  if (search) {
    conditions.push('(r.reason LIKE :search OR r.details LIKE :search)');
    params.search = `%${search}%`;
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Lists reports for the admin moderation queue/history — one endpoint
 * covers both (see admin.service.js#listReports): pending/reviewed
 * filtered is "the queue", resolved/dismissed filtered is "moderation
 * history". Same table, same columns, just a different status filter —
 * no separate history mechanism.
 * @param {Object} options - Query + pagination options
 * @returns {Promise<Array>} Array of enriched report objects
 */
async function findAllReports({ status, targetType, search, sortBy, sortOrder, limit, offset }) {
  const { whereClause, params } = buildAdminReportFilter({ status, targetType, search });
  const orderColumn = ALLOWED_REPORT_SORT_COLUMNS.includes(sortBy) ? `r.${sortBy}` : 'r.created_at';
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `SELECT ${ADMIN_REPORT_COLUMNS}
     ${ADMIN_REPORT_JOINS}
     WHERE ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

/**
 * Total count matching the same filters as findAllReports. Powers pagination meta.
 * @param {Object} filters - Filter options (same as buildAdminReportFilter)
 * @returns {Promise<number>} Total count of matching reports
 */
async function countAllReports(filters) {
  const { whereClause, params } = buildAdminReportFilter(filters);
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM reports r WHERE ${whereClause}`,
    params
  );
  return rows[0].total;
}

/**
 * Single report, enriched with reporter/reported-user/donation/resolver
 * names for the admin report detail view.
 * @param {number} id - Report ID
 * @returns {Promise<Object|null>} Enriched report object or null
 */
async function findByIdWithDetails(id) {
  const [rows] = await pool.query(
    `SELECT ${ADMIN_REPORT_COLUMNS}
     ${ADMIN_REPORT_JOINS}
     WHERE r.id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Updates a report's moderation state. `investigate` (status='reviewed')
 * leaves resolved_by/resolved_at/resolution_notes untouched — it's just
 * "an admin is looking at this", not a final decision. `resolve`/
 * `dismiss` set all three, closing the report out.
 * @param {number} id - Report ID
 * @param {Object} data
 * @param {string} data.status - New status (reviewed/resolved/dismissed)
 * @param {number|null} [data.resolvedBy] - Admin's user ID, only set on resolve/dismiss
 * @param {string|null} [data.resolutionNotes] - Admin's reasoning, only set on resolve/dismiss
 * @returns {Promise<void>}
 */
async function updateReportStatus(id, { status, resolvedBy = null, resolutionNotes = null }) {
  const isClosing = status === 'resolved' || status === 'dismissed';
  await pool.query(
    `UPDATE reports
     SET status = :status,
         resolved_by = CASE WHEN :isClosing THEN :resolvedBy ELSE resolved_by END,
         resolved_at = CASE WHEN :isClosing THEN NOW() ELSE resolved_at END,
         resolution_notes = COALESCE(:resolutionNotes, resolution_notes)
     WHERE id = :id`,
    { id, status, isClosing, resolvedBy, resolutionNotes }
  );
}

module.exports = {
  create,
  findById,
  findByReporterAndDonation,
  findByDonationId,
  findMyReports,
  countMyReports,
  findAllReports,
  countAllReports,
  findByIdWithDetails,
  updateReportStatus,
};
