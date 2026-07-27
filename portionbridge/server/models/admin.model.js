const { pool } = require('../config/db');
const { USER_ROLES, DONATION_STATUS } = require('../constants');

/**
 * Raw SQL data-access layer for admin dashboard, user management, donation
 * oversight, volunteer monitoring, and audit-support queries.
 *
 * This module reads from users, donation_requests, donation_status_history,
 * and audit_logs — no new tables, no changes to any existing model.
 */

const ADMIN_USER_COLUMNS = `
  id, name, email, role, phone, address, profile_photo,
  is_banned, is_deleted, deleted_at, email_verified,
  failed_login_attempts, lock_until, last_login_at, last_login_ip,
  created_at, updated_at
`;

const DONATION_COLUMNS = `
  id, donor_id, volunteer_id, category, quantity, description, photo,
  pickup_location, pickup_time, scheduled_at, accepted_at, completed_at, status,
  is_deleted, deleted_at, created_at, updated_at
`;

const ALLOWED_USER_SORT_COLUMNS = ['created_at', 'name', 'email'];
const ALLOWED_ADMIN_DONATION_SORT_COLUMNS = ['created_at', 'pickup_time', 'scheduled_at', 'completed_at'];

/* ============================================================
 * Dashboard
 * ============================================================ */

/**
 * Single aggregate query for user counts. SUM() on a boolean expression
 * counts matching rows in one pass — avoids one COUNT query per role.
 * @returns {Promise<Object>} { totalUsers, totalDonors, totalVolunteers }
 */
async function getUserCounts() {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS totalUsers,
       SUM(role = :donorRole) AS totalDonors,
       SUM(role = :volunteerRole) AS totalVolunteers
     FROM users
     WHERE is_deleted = 0`,
    { donorRole: USER_ROLES.DONOR, volunteerRole: USER_ROLES.VOLUNTEER }
  );
  return rows[0];
}

/**
 * Single aggregate query for donation counts by status, plus the
 * soft-deleted ("cancelled") count. totalDonationRequests intentionally
 * includes cancelled donations — it's the all-time total, broken down
 * by the buckets below.
 * @returns {Promise<Object>} Status-bucketed donation counts
 */
async function getDonationCounts() {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS totalDonationRequests,
       SUM(status = :pending AND is_deleted = 0) AS pending,
       SUM(status = :accepted AND is_deleted = 0) AS accepted,
       SUM(status = :scheduled AND is_deleted = 0) AS scheduled,
       SUM(status = :completed AND is_deleted = 0) AS completed,
       SUM(is_deleted = 1) AS cancelled
     FROM donation_requests`,
    {
      pending: DONATION_STATUS.PENDING,
      accepted: DONATION_STATUS.ACCEPTED,
      scheduled: DONATION_STATUS.SCHEDULED,
      completed: DONATION_STATUS.COMPLETED,
    }
  );
  return rows[0];
}

/**
 * Latest N donation requests for the dashboard activity feed.
 * Deliberately NOT filtered by is_deleted — admins should see recently
 * cancelled donations in the feed too (is_deleted is included in the
 * response so the frontend can badge them).
 * @param {number} limit - Number of recent donations to return
 * @returns {Promise<Array>} Array of donation objects
 */
async function getRecentDonations(limit) {
  const [rows] = await pool.query(
    `SELECT ${DONATION_COLUMNS} FROM donation_requests
     ORDER BY created_at DESC
     LIMIT :limit`,
    { limit }
  );
  return rows;
}

/* ============================================================
 * User management
 * ============================================================ */

/**
 * Builds the shared WHERE clause + params for the admin user list.
 * `status` is a derived filter, not a raw column:
 *   - 'deleted' -> is_deleted = 1
 *   - 'banned'  -> is_deleted = 0 AND is_banned = 1
 *   - 'active'  -> is_deleted = 0 AND is_banned = 0
 *   - omitted   -> is_deleted = 0 (both active and banned; deleted excluded
 *                  by default, matching every other list endpoint's default)
 * @param {Object} filters - Filter options
 * @param {string} [filters.search] - Search across name and email
 * @param {string} [filters.role] - Filter by role
 * @param {string} [filters.status] - 'active' | 'banned' | 'deleted'
 * @returns {Object} Object containing whereClause string and params object
 */
function buildUserFilter({ search, role, status }) {
  const conditions = [];
  const params = {};

  if (status === 'deleted') {
    conditions.push('is_deleted = 1');
  } else {
    conditions.push('is_deleted = 0');
    if (status === 'banned') {
      conditions.push('is_banned = 1');
    } else if (status === 'active') {
      conditions.push('is_banned = 0');
    }
  }

  if (role) {
    conditions.push('role = :role');
    params.role = role;
  }

  if (search) {
    conditions.push('(name LIKE :search OR email LIKE :search)');
    params.search = `%${search}%`;
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Lists users with search/role/status filters, whitelisted sort, and pagination.
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of user objects
 */
async function findUsers({ search, role, status, sortBy, sortOrder, limit, offset }) {
  const { whereClause, params } = buildUserFilter({ search, role, status });
  const orderColumn = ALLOWED_USER_SORT_COLUMNS.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `SELECT ${ADMIN_USER_COLUMNS} FROM users
     WHERE ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

/**
 * Total count matching the same filters as findUsers. Powers pagination meta.
 * @param {Object} filters - Filter options (same as buildUserFilter)
 * @returns {Promise<number>} Total count of matching users
 */
async function countUsers({ search, role, status }) {
  const { whereClause, params } = buildUserFilter({ search, role, status });
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE ${whereClause}`, params);
  return rows[0].total;
}

/**
 * Finds a user by ID for admin purposes — UNLIKE user.model.js#findById,
 * this does NOT exclude soft-deleted rows (admins need to see deleted
 * accounts too) and includes deleted_at. Never includes the password hash.
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null if no row exists at all
 */
async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT ${ADMIN_USER_COLUMNS} FROM users WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Sets a user's is_banned flag. Business rules (self-lockout guard,
 * already-banned/already-active conflict checks) live in the service layer.
 * @param {number} id - User ID
 * @param {boolean} isBanned - New banned state
 * @returns {Promise<void>}
 */
async function setUserBanned(id, isBanned) {
  await pool.query(
    `UPDATE users SET is_banned = :isBanned WHERE id = :id`,
    { isBanned: isBanned ? 1 : 0, id }
  );
}

/* ============================================================
 * Donation oversight
 * ============================================================ */

/**
 * Builds the shared WHERE clause + params for the admin donation list.
 * `deleted` is left unfiltered (shows both) unless explicitly passed as
 * a boolean — this endpoint intentionally has broader visibility than
 * the donor/volunteer-facing donation lists.
 * @param {Object} filters - Filter options
 * @returns {Object} Object containing whereClause string and params object
 */
function buildAdminDonationFilter({ status, category, donorId, volunteerId, dateFrom, dateTo, deleted }) {
  const conditions = [];
  const params = {};

  if (typeof deleted === 'boolean') {
    conditions.push('is_deleted = :deleted');
    params.deleted = deleted ? 1 : 0;
  }
  if (status) {
    conditions.push('status = :status');
    params.status = status;
  }
  if (category) {
    conditions.push('category = :category');
    params.category = category;
  }
  if (donorId) {
    conditions.push('donor_id = :donorId');
    params.donorId = donorId;
  }
  if (volunteerId) {
    conditions.push('volunteer_id = :volunteerId');
    params.volunteerId = volunteerId;
  }
  if (dateFrom) {
    conditions.push('created_at >= :dateFrom');
    params.dateFrom = dateFrom;
  }
  if (dateTo) {
    conditions.push('created_at <= :dateTo');
    params.dateTo = dateTo;
  }

  return { whereClause: conditions.length ? conditions.join(' AND ') : '1 = 1', params };
}

/**
 * Lists donations with full admin filtering, whitelisted sort, and pagination.
 * @param {Object} options - Query + pagination options
 * @returns {Promise<Array>} Array of donation objects
 */
async function findDonations(options) {
  const { whereClause, params } = buildAdminDonationFilter(options);
  const { sortBy, sortOrder, limit, offset } = options;
  const orderColumn = ALLOWED_ADMIN_DONATION_SORT_COLUMNS.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `SELECT ${DONATION_COLUMNS} FROM donation_requests
     WHERE ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

/**
 * Total count matching the same filters as findDonations. Powers pagination meta.
 * @param {Object} filters - Filter options (same as buildAdminDonationFilter)
 * @returns {Promise<number>} Total count of matching donations
 */
async function countDonations(filters) {
  const { whereClause, params } = buildAdminDonationFilter(filters);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM donation_requests WHERE ${whereClause}`, params);
  return rows[0].total;
}

/**
 * Finds a donation by ID for admin purposes — UNLIKE donation.model.js#findById,
 * this does NOT exclude soft-deleted rows, since admins need to view
 * cancelled donations too.
 * @param {number} id - Donation ID
 * @returns {Promise<Object|null>} Donation object or null if not found
 */
async function findDonationById(id) {
  const [rows] = await pool.query(
    `SELECT ${DONATION_COLUMNS} FROM donation_requests WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Full status history for a donation, oldest first, joined with the name/role
 * of whoever triggered each change. Populated entirely by DB triggers
 * (trg_donation_status_insert / trg_donation_status_update) — this is a
 * pure read, nothing in the application writes to this table.
 * @param {number} donationRequestId - Donation ID
 * @returns {Promise<Array>} Array of status history rows
 */
async function findDonationStatusHistory(donationRequestId) {
  const [rows] = await pool.query(
    `SELECT h.id, h.donation_request_id, h.old_status, h.new_status, h.changed_at,
            h.changed_by, u.name AS changed_by_name, u.role AS changed_by_role
     FROM donation_status_history h
     LEFT JOIN users u ON u.id = h.changed_by
     WHERE h.donation_request_id = :id
     ORDER BY h.changed_at ASC`,
    { id: donationRequestId }
  );
  return rows;
}

/* ============================================================
 * Volunteer monitoring
 * ============================================================ */

/**
 * Builds the shared WHERE clause + params for the volunteer list.
 * @param {Object} filters
 * @param {string} [filters.search] - Search across name and email
 * @returns {Object} Object containing whereClause string and params object
 */
function buildVolunteerFilter({ search }) {
  const conditions = ['role = :volunteerRole', 'is_deleted = 0'];
  const params = { volunteerRole: USER_ROLES.VOLUNTEER };

  if (search) {
    conditions.push('(name LIKE :search OR email LIKE :search)');
    params.search = `%${search}%`;
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Lists volunteers with per-volunteer assignment stats computed in a single
 * aggregate query (LEFT JOIN + GROUP BY) — avoids one query per volunteer.
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of volunteer rows with activeAssignments/completedPickups
 */
async function findVolunteersWithStats({ search, limit, offset }) {
  const { whereClause, params } = buildVolunteerFilter({ search });

  const [rows] = await pool.query(
    `SELECT
       u.id, u.name, u.email, u.phone, u.is_banned, u.created_at,
       SUM((dr.status = :accepted OR dr.status = :scheduled) AND dr.is_deleted = 0) AS activeAssignments,
       SUM(dr.status = :completed AND dr.is_deleted = 0) AS completedPickups
     FROM users u
     LEFT JOIN donation_requests dr ON dr.volunteer_id = u.id
     WHERE ${whereClause}
     GROUP BY u.id, u.name, u.email, u.phone, u.is_banned, u.created_at
     ORDER BY u.created_at DESC
     LIMIT :limit OFFSET :offset`,
    {
      ...params,
      accepted: DONATION_STATUS.ACCEPTED,
      scheduled: DONATION_STATUS.SCHEDULED,
      completed: DONATION_STATUS.COMPLETED,
      limit,
      offset,
    }
  );
  return rows;
}

/**
 * Total count of volunteers matching the same filter as findVolunteersWithStats.
 * Deliberately no JOIN here — counting users doesn't need donation_requests.
 * @param {Object} filters - Filter options (same as buildVolunteerFilter)
 * @returns {Promise<number>} Total count of matching volunteers
 */
async function countVolunteers({ search }) {
  const { whereClause, params } = buildVolunteerFilter({ search });
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE ${whereClause}`, params);
  return rows[0].total;
}

/* ============================================================
 * Audit support — user activity
 * ============================================================ */

/**
 * Paginated raw audit log entries for a single user, most recent first.
 * @param {number} userId - User ID
 * @param {Object} options - Pagination options
 * @returns {Promise<Array>} Array of audit log rows
 */
async function findUserActivity(userId, { limit, offset }) {
  const [rows] = await pool.query(
    `SELECT id, user_id, action, ip_address, user_agent, metadata, created_at
     FROM audit_logs
     WHERE user_id = :userId
     ORDER BY created_at DESC
     LIMIT :limit OFFSET :offset`,
    { userId, limit, offset }
  );
  return rows;
}

/**
 * Total count of audit log entries for a user. Powers pagination meta.
 * @param {number} userId - User ID
 * @returns {Promise<number>} Total count of audit log rows
 */
async function countUserActivity(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM audit_logs WHERE user_id = :userId`,
    { userId }
  );
  return rows[0].total;
}

/**
 * Per-action-type counts for a user's activity (e.g. how many logins,
 * password resets, etc.) — a single GROUP BY query, not N+1 per action.
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of { action, count } rows
 */
async function getUserActivityActionSummary(userId) {
  const [rows] = await pool.query(
    `SELECT action, COUNT(*) AS count
     FROM audit_logs
     WHERE user_id = :userId
     GROUP BY action`,
    { userId }
  );
  return rows;
}

module.exports = {
  getUserCounts,
  getDonationCounts,
  getRecentDonations,
  findUsers,
  countUsers,
  findUserById,
  setUserBanned,
  findDonations,
  countDonations,
  findDonationById,
  findDonationStatusHistory,
  findVolunteersWithStats,
  countVolunteers,
  findUserActivity,
  countUserActivity,
  getUserActivityActionSummary,
};
