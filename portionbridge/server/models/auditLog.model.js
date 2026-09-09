const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `audit_logs` table.
 * Write path (logEvent) is append-only — no update/delete is exposed here,
 * since audit trails must not be mutable. Read path (findAll/countAll)
 * powers the admin-facing audit log viewer.
 */

/**
 * Inserts a new audit log entry.
 * @param {object} params
 * @param {number|null} params.userId - nullable (e.g. failed login with unknown email)
 * @param {string} params.action - one of AUDIT_ACTIONS in constants/index.js
 * @param {string|null} params.ipAddress
 * @param {string|null} params.userAgent
 * @param {object|null} params.metadata - arbitrary JSON-serializable context
 */
async function logEvent({ userId, action, ipAddress, userAgent, metadata }) {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, metadata)
     VALUES (:userId, :action, :ipAddress, :userAgent, :metadata)`,
    {
      userId: userId || null,
      action,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    }
  );
}

/**
 * Builds the shared WHERE clause for findAll/countAll — same
 * conditions-array + named-params pattern as admin.model.js's
 * buildUserFilter/buildVolunteerFilter.
 */
function buildAuditLogFilter({ action, userId, dateFrom, dateTo }) {
  const conditions = ['1 = 1'];
  const params = {};

  if (action) {
    conditions.push('al.action = :action');
    params.action = action;
  }
  if (userId) {
    conditions.push('al.user_id = :userId');
    params.userId = userId;
  }
  if (dateFrom) {
    conditions.push('al.created_at >= :dateFrom');
    params.dateFrom = dateFrom;
  }
  if (dateTo) {
    conditions.push('al.created_at <= :dateTo');
    params.dateTo = dateTo;
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Paginated, filterable audit log listing for the admin audit log page.
 * LEFT JOINs users since user_id is nullable (e.g. a failed login attempt
 * against an email that doesn't correspond to any account).
 * @param {object} params
 * @param {string} [params.action] - Exact AUDIT_ACTIONS value
 * @param {number} [params.userId] - Filter to one actor
 * @param {string} [params.dateFrom] - ISO date/datetime, inclusive
 * @param {string} [params.dateTo] - ISO date/datetime, inclusive
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<Array>}
 */
async function findAll({ action, userId, dateFrom, dateTo, limit, offset }) {
  const { whereClause, params } = buildAuditLogFilter({ action, userId, dateFrom, dateTo });

  const [rows] = await pool.query(
    `SELECT al.id, al.user_id, al.action, al.ip_address, al.user_agent, al.metadata, al.created_at,
            u.name AS user_name, u.email AS user_email, u.role AS user_role
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

/**
 * Unpaginated row count for the same filters — pairs with findAll for
 * pagination meta.
 */
async function countAll({ action, userId, dateFrom, dateTo }) {
  const { whereClause, params } = buildAuditLogFilter({ action, userId, dateFrom, dateTo });
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM audit_logs al WHERE ${whereClause}`,
    params
  );
  return rows[0].total;
}

module.exports = { logEvent, findAll, countAll };
