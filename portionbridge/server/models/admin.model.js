const { pool } = require('../config/db');
const { USER_ROLES, DONATION_STATUS, DONATION_CATEGORY } = require('../constants');

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

// Same donation_requests columns as the donor-facing model would use,
// plus the donor's, volunteer's, and (for team-mode donations) assigned member's name/email —
// resolved via LEFT JOIN rather than a second round trip per donation.
// Used by the Phase 3 admin donation list/detail so "Donor → Volunteer"
// can actually show names, not just raw IDs. NULL volunteer_name/
// assigned_member_name is expected and meaningful (nobody's picked it up
// yet / not a team assignment) — the frontend renders that as "Not yet
// assigned", not as missing data.
const ADMIN_DONATION_COLUMNS_WITH_NAMES = `
  dr.id, dr.title, dr.donor_id, dr.volunteer_id, dr.assignment_mode, dr.team_id, dr.assigned_member_id,
  dr.category, dr.quantity, dr.quantity_unit, dr.number_of_servings, dr.description, dr.photo,
  dr.pickup_location, dr.pickup_time, dr.scheduled_at, dr.accepted_at, dr.completed_at, dr.status,
  dr.is_deleted, dr.deleted_at, dr.created_at, dr.updated_at, dr.saved_address_id,
  donor.name AS donor_name, donor.email AS donor_email, donor.phone AS donor_phone,
  donor.email_verified AS donor_verified,
  volunteer.name AS volunteer_name, volunteer.email AS volunteer_email, volunteer.phone AS volunteer_phone,
  member.name AS assigned_member_name,
  sa.latitude AS pickup_latitude, sa.longitude AS pickup_longitude,
  (SELECT MAX(h.changed_at) FROM donation_status_history h
     WHERE h.donation_request_id = dr.id AND h.new_status = 'picked_up') AS picked_up_at
`;

const ADMIN_DONATION_JOINS = `
  FROM donation_requests dr
  LEFT JOIN users donor ON donor.id = dr.donor_id
  LEFT JOIN users volunteer ON volunteer.id = dr.volunteer_id
  LEFT JOIN users member ON member.id = dr.assigned_member_id
  LEFT JOIN saved_addresses sa ON sa.id = dr.saved_address_id
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
 * by the buckets below. `active` is every non-terminal, non-cancelled
 * status (accepted through picked_up) — added for the Phase 2 Overview
 * "Active Donations" KPI.
 * @returns {Promise<Object>} Status-bucketed donation counts
 */
async function getDonationCounts() {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS totalDonationRequests,
       SUM(status = :pending AND is_deleted = 0) AS pending,
       SUM(status = :accepted AND is_deleted = 0) AS accepted,
       SUM(status = :scheduled AND is_deleted = 0) AS scheduled,
       SUM(status IN (:accepted, :scheduled, :onTheWay, :pickedUp) AND is_deleted = 0) AS active,
       SUM(status = :completed AND is_deleted = 0) AS completed,
       SUM(is_deleted = 1) AS cancelled
     FROM donation_requests`,
    {
      pending: DONATION_STATUS.PENDING,
      accepted: DONATION_STATUS.ACCEPTED,
      scheduled: DONATION_STATUS.SCHEDULED,
      onTheWay: DONATION_STATUS.ON_THE_WAY,
      pickedUp: DONATION_STATUS.PICKED_UP,
      completed: DONATION_STATUS.COMPLETED,
    }
  );
  return rows[0];
}

/**
 * Count of distinct volunteers currently holding at least one non-terminal
 * assignment (accepted/scheduled/on_the_way/picked_up, not soft-deleted).
 * Backs the Phase 2 Overview "Active Volunteers" KPI.
 * @returns {Promise<number>} Count of active volunteers
 */
async function getActiveVolunteersCount() {
  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT volunteer_id) AS activeVolunteers
     FROM donation_requests
     WHERE volunteer_id IS NOT NULL AND is_deleted = 0
       AND status IN (:accepted, :scheduled, :onTheWay, :pickedUp)`,
    {
      accepted: DONATION_STATUS.ACCEPTED,
      scheduled: DONATION_STATUS.SCHEDULED,
      onTheWay: DONATION_STATUS.ON_THE_WAY,
      pickedUp: DONATION_STATUS.PICKED_UP,
    }
  );
  return rows[0].activeVolunteers;
}

/**
 * Platform-wide impact aggregate for completed donations only. Mirrors the
 * per-donor formula in profile.service.js#getDonationStatistics (mealsShared
 * from number_of_servings, clothesDonated from quantity) so the same
 * "impact" language means the same thing whether it's one donor's profile
 * or the admin-wide Overview.
 * @returns {Promise<Object>} Raw impact aggregate row
 */
async function getImpactStats() {
  const [rows] = await pool.query(
    `SELECT
       SUM(status = :completed AND is_deleted = 0) AS successfulDonations,
       SUM(
         CASE WHEN category = :food AND status = :completed AND is_deleted = 0
           THEN COALESCE(number_of_servings, 0) ELSE 0 END
       ) AS mealsShared,
       SUM(
         CASE WHEN category = :clothes AND status = :completed AND is_deleted = 0
           THEN COALESCE(quantity, 0) ELSE 0 END
       ) AS clothesDonated
     FROM donation_requests`,
    {
      completed: DONATION_STATUS.COMPLETED,
      food: DONATION_CATEGORY.FOOD,
      clothes: DONATION_CATEGORY.CLOTHES,
    }
  );
  return rows[0];
}

/**
 * Donation count per category (food/clothes), excluding soft-deleted rows.
 * Backs the Phase 2 Overview category distribution chart.
 * @returns {Promise<Array>} Array of { category, count } rows
 */
async function getCategoryDistribution() {
  const [rows] = await pool.query(
    `SELECT category, COUNT(*) AS count
     FROM donation_requests
     WHERE is_deleted = 0
     GROUP BY category`
  );
  return rows;
}

/**
 * Monthly donation volume + completions since `since`, grouped by
 * created_at. Gaps (months with zero donations) are NOT filled here —
 * that's the service layer's job (see admin.service.js#fillMonthlyGaps),
 * matching how profile.service.js separates raw SQL from month-skeleton
 * filling.
 * @param {string} since - ISO date string; only rows on/after this are counted
 * @returns {Promise<Array>} Array of { month, count, completed } rows
 */
async function getDonationTrend(since) {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
       COUNT(*) AS count,
       SUM(status = :completed) AS completed
     FROM donation_requests
     WHERE created_at >= :since AND is_deleted = 0
     GROUP BY month
     ORDER BY month ASC`,
    { since, completed: DONATION_STATUS.COMPLETED }
  );
  return rows;
}

/**
 * Monthly new-user counts since `since`, split by role.
 * @param {string} since - ISO date string; only rows on/after this are counted
 * @returns {Promise<Array>} Array of { month, donors, volunteers } rows
 */
async function getUserGrowth(since) {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
       SUM(role = :donorRole) AS donors,
       SUM(role = :volunteerRole) AS volunteers
     FROM users
     WHERE created_at >= :since AND is_deleted = 0
     GROUP BY month
     ORDER BY month ASC`,
    { since, donorRole: USER_ROLES.DONOR, volunteerRole: USER_ROLES.VOLUNTEER }
  );
  return rows;
}

/**
 * Monthly completed-pickup volume and distinct active-volunteer count
 * since `since`, keyed by completed_at (when the pickup actually finished,
 * not when it was created).
 * @param {string} since - ISO date string; only rows on/after this are counted
 * @returns {Promise<Array>} Array of { month, completedPickups, activeVolunteers } rows
 */
async function getVolunteerActivityTrend(since) {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(completed_at, '%Y-%m') AS month,
       COUNT(*) AS completedPickups,
       COUNT(DISTINCT volunteer_id) AS activeVolunteers
     FROM donation_requests
     WHERE status = :completed AND completed_at >= :since AND is_deleted = 0
     GROUP BY month
     ORDER BY month ASC`,
    { since, completed: DONATION_STATUS.COMPLETED }
  );
  return rows;
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
    `SELECT ${ADMIN_DONATION_COLUMNS_WITH_NAMES}
     ${ADMIN_DONATION_JOINS}
     ORDER BY dr.created_at DESC
     LIMIT :limit`,
    { limit }
  );
  return rows;
}

/**
 * Latest N registered users for the dashboard activity feed.
 * @param {number} limit - Number of recent users to return
 * @returns {Promise<Array>} Array of { id, name, email, role, created_at } rows
 */
async function getRecentUsers(limit) {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE is_deleted = 0
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
 * All active (not banned, not soft-deleted) user IDs matching a role — the
 * unpaginated counterpart to findUsers, for Phase 8's admin announcement
 * broadcast ("notify all volunteers", "notify all donors", "system-wide").
 * findUsers/countUsers are capped by PAGINATION_DEFAULTS.MAX_LIMIT (100),
 * which is fine for a browsable list but wrong for "everyone in this
 * role" — this intentionally has no limit.
 * @param {string|null} role - USER_ROLES value, or null for every role
 * @returns {Promise<number[]>} Array of user IDs
 */
async function findUserIdsByRole(role) {
  const conditions = ['is_banned = 0', 'is_deleted = 0'];
  const params = {};
  if (role) {
    conditions.push('role = :role');
    params.role = role;
  }
  const [rows] = await pool.query(
    `SELECT id FROM users WHERE ${conditions.join(' AND ')}`,
    params
  );
  return rows.map((r) => r.id);
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
 * the donor/volunteer-facing donation lists. `reported` filters to
 * donations with (true) or without (false) at least one row in `reports`
 * — reuses the existing reports table via EXISTS rather than a JOIN, so
 * a donation with multiple reports isn't duplicated in the result set.
 * @param {Object} filters - Filter options
 * @returns {Object} Object containing whereClause string and params object
 */
function buildAdminDonationFilter({ status, category, donorId, volunteerId, dateFrom, dateTo, deleted, reported }) {
  const conditions = [];
  const params = {};

  if (typeof deleted === 'boolean') {
    conditions.push('dr.is_deleted = :deleted');
    params.deleted = deleted ? 1 : 0;
  }
  if (status) {
    conditions.push('dr.status = :status');
    params.status = status;
  }
  if (category) {
    conditions.push('dr.category = :category');
    params.category = category;
  }
  if (donorId) {
    conditions.push('dr.donor_id = :donorId');
    params.donorId = donorId;
  }
  if (volunteerId) {
    conditions.push('dr.volunteer_id = :volunteerId');
    params.volunteerId = volunteerId;
  }
  if (dateFrom) {
    conditions.push('dr.created_at >= :dateFrom');
    params.dateFrom = dateFrom;
  }
  if (dateTo) {
    conditions.push('dr.created_at <= :dateTo');
    params.dateTo = dateTo;
  }
  if (typeof reported === 'boolean') {
    const existsClause = 'EXISTS (SELECT 1 FROM reports r WHERE r.reported_donation_id = dr.id)';
    conditions.push(reported ? existsClause : `NOT ${existsClause}`);
  }

  return { whereClause: conditions.length ? conditions.join(' AND ') : '1 = 1', params };
}

/**
 * Lists donations with full admin filtering, whitelisted sort, and pagination.
 * Donor/volunteer/assigned-member names are resolved via LEFT JOIN (see
 * ADMIN_DONATION_COLUMNS_WITH_NAMES) so the admin UI can show names
 * directly instead of raw IDs.
 * @param {Object} options - Query + pagination options
 * @returns {Promise<Array>} Array of donation objects
 */
async function findDonations(options) {
  const { whereClause, params } = buildAdminDonationFilter(options);
  const { sortBy, sortOrder, limit, offset } = options;
  const orderColumn = ALLOWED_ADMIN_DONATION_SORT_COLUMNS.includes(sortBy) ? `dr.${sortBy}` : 'dr.created_at';
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `SELECT ${ADMIN_DONATION_COLUMNS_WITH_NAMES}
     ${ADMIN_DONATION_JOINS}
     WHERE ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

/**
 * Total count matching the same filters as findDonations. Powers pagination meta.
 * No JOIN needed here (counting doesn't need names), but `reported`'s
 * EXISTS subquery still references the `dr` alias, so the FROM clause
 * keeps it for consistency with buildAdminDonationFilter's conditions.
 * @param {Object} filters - Filter options (same as buildAdminDonationFilter)
 * @returns {Promise<number>} Total count of matching donations
 */
async function countDonations(filters) {
  const { whereClause, params } = buildAdminDonationFilter(filters);
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM donation_requests dr WHERE ${whereClause}`,
    params
  );
  return rows[0].total;
}

/**
 * Finds a donation by ID for admin purposes — UNLIKE donation.model.js#findById,
 * this does NOT exclude soft-deleted rows, since admins need to view
 * cancelled donations too. Includes donor/volunteer/assigned-member names.
 * @param {number} id - Donation ID
 * @returns {Promise<Object|null>} Donation object or null if not found
 */
async function findDonationById(id) {
  const [rows] = await pool.query(
    `SELECT ${ADMIN_DONATION_COLUMNS_WITH_NAMES}
     ${ADMIN_DONATION_JOINS}
     WHERE dr.id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * All currently-active donations (accepted/scheduled/on_the_way/picked_up,
 * not soft-deleted) for the Phase 6 admin Live Operations Map's initial
 * load — everything the live map needs to plot before any socket event
 * has arrived: donor/volunteer names, team info, and pickup coordinates
 * when available (same conditional-null caveat as everywhere else in this
 * app: only set when the donor used a saved address).
 *
 * Capped at 200 rows as a sane safety ceiling for a live map rendering
 * markers — if a deployment ever has more concurrent active missions than
 * that, pagination/clustering would be a real follow-up, not a silent
 * truncation surprise.
 * @returns {Promise<Array>} Array of active donation objects
 */
async function findActiveDonationsForMap() {
  const [rows] = await pool.query(
    `SELECT ${ADMIN_DONATION_COLUMNS_WITH_NAMES}
     ${ADMIN_DONATION_JOINS}
     WHERE dr.is_deleted = 0
       AND dr.status IN (:accepted, :scheduled, :onTheWay, :pickedUp)
     ORDER BY dr.updated_at DESC
     LIMIT 200`,
    {
      accepted: DONATION_STATUS.ACCEPTED,
      scheduled: DONATION_STATUS.SCHEDULED,
      onTheWay: DONATION_STATUS.ON_THE_WAY,
      pickedUp: DONATION_STATUS.PICKED_UP,
    }
  );
  return rows;
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
 * `activeAssignments` uses the same 4-status definition (accepted through
 * picked_up) as Phase 2's getActiveVolunteersCount, so "how many active
 * volunteers" means the same thing on the Overview KPI and here.
 * `cancelledPickups`/`totalAssigned` (Phase 4) back the completion/
 * cancellation rate shown on the volunteer list and detail pages.
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of volunteer rows with stats
 */
async function findVolunteersWithStats({ search, limit, offset }) {
  const { whereClause, params } = buildVolunteerFilter({ search });

  const [rows] = await pool.query(
    `SELECT
       u.id, u.name, u.email, u.phone, u.is_banned, u.created_at,
       SUM(dr.status IN (:accepted, :scheduled, :onTheWay, :pickedUp) AND dr.is_deleted = 0) AS activeAssignments,
       SUM(dr.status = :completed AND dr.is_deleted = 0) AS completedPickups,
       SUM(dr.is_deleted = 1) AS cancelledPickups,
       COUNT(dr.id) AS totalAssigned
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
      onTheWay: DONATION_STATUS.ON_THE_WAY,
      pickedUp: DONATION_STATUS.PICKED_UP,
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

/* ============================================================
 * Audit support — platform-wide recent activity
 * ============================================================ */

/**
 * Latest N audit log entries across ALL users, joined with the actor's
 * name/role. Backs the Phase 2 Overview "Recent Activity" feed — distinct
 * from findUserActivity above, which is scoped to a single user's audit
 * trail for the (later-phase) Audit Logs page.
 * @param {number} limit - Number of recent activity entries to return
 * @returns {Promise<Array>} Array of audit log rows with actor name/role
 */
async function findRecentActivity(limit) {
  const [rows] = await pool.query(
    `SELECT a.id, a.user_id, a.action, a.metadata, a.created_at,
            u.name AS user_name, u.role AS user_role
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT :limit`,
    { limit }
  );
  return rows;
}

/**
 * Cancelled-pickup count for a single volunteer (donations that were
 * assigned to them and later soft-deleted). Used by getVolunteerDetail
 * for the Phase 4 completion/cancellation rate — kept separate from
 * donationModel.getVolunteerSummary (shared across the app) rather than
 * modifying that shared query's bucket list.
 * @param {number} volunteerId - Volunteer's user ID
 * @returns {Promise<number>} Count of cancelled donations ever assigned to them
 */
async function getVolunteerCancelledCount(volunteerId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cancelledPickups
     FROM donation_requests
     WHERE volunteer_id = :volunteerId AND is_deleted = 1`,
    { volunteerId }
  );
  return rows[0].cancelledPickups;
}

/* ============================================================
 * Team monitoring (Phase 4)
 * ============================================================ */

/**
 * Builds the shared WHERE clause + params for the team list.
 * @param {Object} filters
 * @param {string} [filters.search] - Search across team name
 * @returns {Object} Object containing whereClause string and params object
 */
function buildTeamFilter({ search }) {
  const conditions = ['1 = 1'];
  const params = {};

  if (search) {
    conditions.push('t.name LIKE :search');
    params.search = `%${search}%`;
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Lists all teams with leader name, member count, and mission counts.
 * Member count and mission counts are correlated subqueries rather than
 * LEFT JOINs — joining team_members and donation_requests directly would
 * fan out (member_count × donation_count rows per team) and inflate both
 * aggregates.
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of team rows with stats
 */
async function findTeams({ search, limit, offset }) {
  const { whereClause, params } = buildTeamFilter({ search });

  const [rows] = await pool.query(
    `SELECT
       t.id, t.name, t.description, t.leader_id, t.created_at,
       leader.name AS leader_name, leader.email AS leader_email,
       (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) AS memberCount,
       (SELECT COUNT(*) FROM donation_requests dr
          WHERE dr.team_id = t.id AND dr.is_deleted = 0
            AND dr.status IN (:accepted, :scheduled, :onTheWay, :pickedUp)) AS activeMissions,
       (SELECT COUNT(*) FROM donation_requests dr
          WHERE dr.team_id = t.id AND dr.is_deleted = 0 AND dr.status = :completed) AS completedMissions
     FROM teams t
     LEFT JOIN users leader ON leader.id = t.leader_id
     WHERE ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT :limit OFFSET :offset`,
    {
      ...params,
      accepted: DONATION_STATUS.ACCEPTED,
      scheduled: DONATION_STATUS.SCHEDULED,
      onTheWay: DONATION_STATUS.ON_THE_WAY,
      pickedUp: DONATION_STATUS.PICKED_UP,
      completed: DONATION_STATUS.COMPLETED,
      limit,
      offset,
    }
  );
  return rows;
}

/**
 * Total count of teams matching the same filter as findTeams.
 * @param {Object} filters - Filter options (same as buildTeamFilter)
 * @returns {Promise<number>} Total count of matching teams
 */
async function countTeams({ search }) {
  const { whereClause, params } = buildTeamFilter({ search });
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM teams t WHERE ${whereClause}`,
    params
  );
  return rows[0].total;
}

/**
 * Single team with leader name/email — admin-facing equivalent of
 * team.service.js#getTeam, but WITHOUT that function's "requester must be
 * a member" check (admins aren't team members). Deliberately queries
 * teams/users directly rather than calling the team service, to avoid
 * that membership authorization getting in the way.
 * @param {number} teamId - Team ID
 * @returns {Promise<Object|null>} Team object with leader_name/leader_email, or null
 */
async function findTeamById(teamId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.description, t.leader_id, t.created_at, t.updated_at,
            leader.name AS leader_name, leader.email AS leader_email, leader.phone AS leader_phone
     FROM teams t
     LEFT JOIN users leader ON leader.id = t.leader_id
     WHERE t.id = :teamId LIMIT 1`,
    { teamId }
  );
  return rows[0] || null;
}

/**
 * Recent membership-change activity for one team (member removed,
 * leadership transferred, invitation accepted) — reuses the SAME
 * audit_logs rows team.service.js already writes via auditService.record,
 * no new tracking added. `metadata.teamId` is filtered in JS after a
 * capped fetch rather than with a JSON_EXTRACT SQL predicate, since
 * nothing else in this codebase uses MySQL JSON functions yet and audit_logs
 * is small enough at this project's scale for this to be fine.
 * @param {number} teamId - Team ID
 * @param {number} limit - Max activity entries to return
 * @returns {Promise<Array>} Array of audit log rows for this team
 */
async function findTeamAuditActivity(teamId, limit) {
  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.metadata, a.created_at,
            u.name AS actor_name, u.role AS actor_role
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.action IN ('team_member_removed', 'team_leadership_transferred', 'team_invitation_accepted')
     ORDER BY a.created_at DESC
     LIMIT 200`
  );

  return rows
    .filter((row) => {
      try {
        const meta = JSON.parse(row.metadata || '{}');
        return Number(meta.teamId) === Number(teamId);
      } catch {
        return false;
      }
    })
    .slice(0, limit);
}

/**
 * Recent announcements sent to a team — reuses the existing
 * `team_announcement` notifications already written by
 * notificationService#sendTeamAnnouncement (one row per recipient member),
 * deduped by message+timestamp since a single announcement fans out to N
 * rows. This is the "reuse existing team announcement infrastructure"
 * requirement — no new announcement storage was added.
 * @param {number} teamId - Team ID
 * @param {number} limit - Max announcements to return
 * @returns {Promise<Array>} Array of { id, message, created_at } rows
 */
async function findTeamAnnouncements(teamId, limit) {
  const [rows] = await pool.query(
    `SELECT MIN(id) AS id, message, created_at
     FROM notifications
     WHERE type = 'team_announcement' AND related_id = :teamId
     GROUP BY message, created_at
     ORDER BY created_at DESC
     LIMIT :limit`,
    { teamId, limit }
  );
  return rows;
}

/**
 * History of admin-sent announcements (Phase 8) — grouped the same way
 * findTeamAnnouncements groups team_announcement rows, since a single
 * broadcast fans out into one notifications row per recipient with no
 * shared "batch" id to group by otherwise. Only covers the 'all'/
 * 'donors'/'volunteers' audiences (type='admin_announcement'); team
 * announcements reuse the existing 'team_announcement' type instead (see
 * admin.service.js#sendAnnouncement) and show up in that team's own
 * activity feed (findTeamAuditActivity/findTeamAnnouncements above), not
 * here — notifications.create doesn't record a sender, so there's no
 * reliable way to attribute a 'team_announcement' row to "sent by an
 * admin" versus "sent by the team leader" without guessing.
 * @param {number} limit - Max announcements to return
 * @returns {Promise<Array>} Array of { id, title, message, created_at, recipientCount, readCount }
 */
async function findSentAnnouncements(limit) {
  const [rows] = await pool.query(
    `SELECT MIN(id) AS id, title, message, created_at,
            COUNT(*) AS recipientCount,
            SUM(is_read) AS readCount
     FROM notifications
     WHERE type = 'admin_announcement'
     GROUP BY title, message, created_at
     ORDER BY created_at DESC
     LIMIT :limit`,
    { limit }
  );
  return rows;
}

/* ============================================================
 * Attention Center (Phase 7)
 * ============================================================ */

/**
 * Every pending (not pending/scheduled-for-later — actually non-terminal)
 * donation, enriched with everything admin.service.js#getAttentionCenter
 * needs to derive operational flags (see utils/donationHealthScore.js):
 * donor verification, assignment, scheduling, and — via a correlated
 * subquery against the trigger-populated donation_status_history table —
 * when the donation entered 'picked_up', since that timestamp isn't its
 * own column on donation_requests.
 *
 * Capped at 300 rows for the same "sane ceiling, not a silent truncation
 * surprise" reasoning as findActiveDonationsForMap (Phase 6).
 * @returns {Promise<Array>} Array of candidate donation rows
 */
async function findDonationsForAttentionCenter() {
  const [rows] = await pool.query(
    `SELECT
       dr.id, dr.title, dr.category, dr.status, dr.donor_id, dr.volunteer_id,
       dr.assignment_mode, dr.team_id, dr.assigned_member_id,
       dr.scheduled_at, dr.created_at, dr.updated_at, dr.is_deleted,
       donor.name AS donor_name, donor.email_verified AS donor_verified,
       volunteer.name AS volunteer_name,
       member.name AS assigned_member_name,
       (SELECT MAX(h.changed_at) FROM donation_status_history h
          WHERE h.donation_request_id = dr.id AND h.new_status = 'picked_up') AS picked_up_at
     FROM donation_requests dr
     LEFT JOIN users donor ON donor.id = dr.donor_id
     LEFT JOIN users volunteer ON volunteer.id = dr.volunteer_id
     LEFT JOIN users member ON member.id = dr.assigned_member_id
     WHERE dr.is_deleted = 0
       AND dr.status IN (:pending, :accepted, :scheduled, :onTheWay, :pickedUp)
     ORDER BY dr.updated_at DESC
     LIMIT 300`,
    {
      pending: DONATION_STATUS.PENDING,
      accepted: DONATION_STATUS.ACCEPTED,
      scheduled: DONATION_STATUS.SCHEDULED,
      onTheWay: DONATION_STATUS.ON_THE_WAY,
      pickedUp: DONATION_STATUS.PICKED_UP,
    }
  );
  return rows;
}

/**
 * Every unresolved (status='pending') report, joined with reporter name,
 * reported-user name (if any), and the reported donation's title (if
 * any) — backs the "reported donations" and "pending moderation items"
 * Attention Center buckets. A report with reported_donation_id set is a
 * "reported donation" (links to the donation); one without is a
 * user-only report (links to the reported user) — a real distinction
 * already present in the reports table, not invented for this feature.
 * @returns {Promise<Array>} Array of pending report rows
 */
async function findPendingReportsForAttentionCenter() {
  const [rows] = await pool.query(
    `SELECT r.id, r.reporter_id, r.reported_user_id, r.reported_donation_id,
            r.reason, r.details, r.created_at,
            reporter.name AS reporter_name,
            reportedUser.name AS reported_user_name,
            dr.title AS donation_title
     FROM reports r
     LEFT JOIN users reporter ON reporter.id = r.reporter_id
     LEFT JOIN users reportedUser ON reportedUser.id = r.reported_user_id
     LEFT JOIN donation_requests dr ON dr.id = r.reported_donation_id
     WHERE r.status = 'pending'
     ORDER BY r.created_at DESC
     LIMIT 100`
  );
  return rows;
}

/* ============================================================
 * Area Intelligence (Phase 9)
 * ============================================================ */

/**
 * Per-area donation stats — demand, completion, and delay signals — built
 * entirely from real, already-entered data: `saved_addresses.area` (a
 * genuine text field donors fill in when adding a pickup address; NOT
 * geocoded/derived) joined against every donation that used a saved
 * address. Donations without a saved address (a one-off typed location)
 * are excluded — there's no reliable area for them, and guessing one
 * would violate the "real data only" requirement.
 *
 * Delay/completion signals reuse the exact thresholds and picked_up_at
 * derivation already established in utils/donationHealthScore.js /
 * Phase 7's Attention Center — a donation counts as a "delayed pickup" or
 * "delayed delivery" here under the SAME rule it would trigger an
 * Attention Center item under, so the two features never disagree about
 * what "delayed" means.
 *
 * The inner derived table (x) computes picked_up_at once per donation via
 * a correlated subquery against donation_status_history, then the outer
 * query aggregates — avoids running that subquery twice per row.
 * @returns {Promise<Array>} Array of per-area stat rows, busiest area first
 */
async function findAreaDonationStats() {
  const [rows] = await pool.query(
    `SELECT sa.area,
       COUNT(*) AS totalDonations,
       SUM(x.status = :completed) AS completed,
       SUM(x.is_deleted = 1) AS cancelled,
       SUM(
         x.is_deleted = 0
         AND x.status IN (:accepted, :scheduled)
         AND x.scheduled_at IS NOT NULL
         AND x.scheduled_at < NOW()
       ) AS delayedPickups,
       SUM(
         x.is_deleted = 0
         AND x.status = :pickedUp
         AND x.picked_up_at IS NOT NULL
         AND TIMESTAMPDIFF(MINUTE, x.picked_up_at, NOW()) > 90
       ) AS delayedDeliveries
     FROM (
       SELECT dr.id, dr.status, dr.is_deleted, dr.scheduled_at, dr.saved_address_id,
              (SELECT MAX(h.changed_at) FROM donation_status_history h
                 WHERE h.donation_request_id = dr.id AND h.new_status = :pickedUp2) AS picked_up_at
       FROM donation_requests dr
       WHERE dr.saved_address_id IS NOT NULL
     ) x
     JOIN saved_addresses sa ON sa.id = x.saved_address_id
     GROUP BY sa.area
     ORDER BY totalDonations DESC
     LIMIT 50`,
    {
      completed: DONATION_STATUS.COMPLETED,
      accepted: DONATION_STATUS.ACCEPTED,
      scheduled: DONATION_STATUS.SCHEDULED,
      pickedUp: DONATION_STATUS.PICKED_UP,
      pickedUp2: DONATION_STATUS.PICKED_UP,
    }
  );
  return rows;
}

module.exports = {
  getUserCounts,
  getDonationCounts,
  getActiveVolunteersCount,
  getImpactStats,
  getCategoryDistribution,
  getDonationTrend,
  getUserGrowth,
  getVolunteerActivityTrend,
  getRecentDonations,
  getRecentUsers,
  findUsers,
  countUsers,
  findUserIdsByRole,
  findUserById,
  setUserBanned,
  findDonations,
  countDonations,
  findDonationById,
  findActiveDonationsForMap,
  findDonationStatusHistory,
  findVolunteersWithStats,
  countVolunteers,
  getVolunteerCancelledCount,
  findTeams,
  countTeams,
  findTeamById,
  findTeamAuditActivity,
  findTeamAnnouncements,
  findSentAnnouncements,
  findDonationsForAttentionCenter,
  findPendingReportsForAttentionCenter,
  findAreaDonationStats,
  findUserActivity,
  countUserActivity,
  getUserActivityActionSummary,
  findRecentActivity,
};
