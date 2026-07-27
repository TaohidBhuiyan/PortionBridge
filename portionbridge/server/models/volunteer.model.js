const { pool } = require('../config/db');
const { DONATION_STATUS } = require('../constants');

/**
 * Raw SQL data-access layer for volunteer-facing dashboard and assignment
 * views. Reuses the `donation_requests` table exclusively — no new tables.
 * Reads always exclude soft-deleted rows (is_deleted = 0).
 */

const BASE_COLUMNS = `
  id, donor_id, volunteer_id, category, quantity, description, photo,
  pickup_location, pickup_time, scheduled_at, accepted_at, completed_at, status,
  is_deleted, deleted_at, created_at, updated_at
`;

/**
 * Whitelisted sort columns for the active-assignments list.
 * Never interpolate sortBy directly into SQL.
 */
const ALLOWED_ASSIGNMENT_SORT_COLUMNS = ['created_at', 'pickup_time', 'scheduled_at', 'accepted_at'];

/**
 * Builds the shared WHERE clause + params for the active-assignments list
 * (Section 2). Used by both findAssignments (data) and countAssignments
 * (total), so the two never drift out of sync — same pattern as
 * donation.model.js#buildBrowseFilter.
 *
 * If `status` is provided it must already be validated as one of
 * ACCEPTED/SCHEDULED (see volunteer.validator.js) and narrows to that exact
 * status. Otherwise both active statuses are included.
 * @param {Object} filters - Filter options
 * @param {number} filters.volunteerId - ID of the volunteer
 * @param {string} [filters.status] - Narrow to 'accepted' or 'scheduled'
 * @param {string} [filters.category] - Filter by category
 * @param {string} [filters.search] - Search across description and pickup location
 * @returns {Object} Object containing whereClause string and params object
 */
function buildAssignmentFilter({ volunteerId, status, category, search }) {
  const conditions = ['is_deleted = 0', 'volunteer_id = :volunteerId'];
  const params = { volunteerId };

  if (status) {
    conditions.push('status = :status');
    params.status = status;
  } else {
    conditions.push('(status = :activeStatus1 OR status = :activeStatus2)');
    params.activeStatus1 = DONATION_STATUS.ACCEPTED;
    params.activeStatus2 = DONATION_STATUS.SCHEDULED;
  }

  if (category) {
    conditions.push('category = :category');
    params.category = category;
  }

  if (search) {
    conditions.push('(description LIKE :search OR pickup_location LIKE :search)');
    params.search = `%${search}%`;
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Lists the volunteer's active assignments (accepted/scheduled), with
 * optional status narrowing, category filter, search, whitelisted sort,
 * and pagination. Defaults to scheduled_at ASC per spec.
 * @param {Object} options - Query options
 * @param {number} options.volunteerId - ID of the volunteer
 * @param {string} [options.status] - Narrow to 'accepted' or 'scheduled'
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.search] - Search across description and location
 * @param {string} [options.sortBy] - Sort column (whitelisted)
 * @param {string} [options.sortOrder] - Sort direction (asc/desc); default asc
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of donation objects
 */
async function findAssignments({ volunteerId, status, category, search, sortBy, sortOrder, limit, offset }) {
  const { whereClause, params } = buildAssignmentFilter({ volunteerId, status, category, search });

  const orderColumn = ALLOWED_ASSIGNMENT_SORT_COLUMNS.includes(sortBy) ? sortBy : 'scheduled_at';
  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests
     WHERE ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

/**
 * Total count matching the same filters as findAssignments.
 * Powers pagination meta.
 * @param {Object} filters - Filter options (same as buildAssignmentFilter)
 * @returns {Promise<number>} Total count of matching assignments
 */
async function countAssignments({ volunteerId, status, category, search }) {
  const { whereClause, params } = buildAssignmentFilter({ volunteerId, status, category, search });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM donation_requests WHERE ${whereClause}`,
    params
  );
  return rows[0].total;
}

/**
 * Builds the shared WHERE clause + params for the upcoming-pickups list
 * (Section 3). Always restricted to status = 'scheduled' with a
 * non-null, not-yet-past scheduled_at — "upcoming" only ever means the
 * future. `today`/`week` are rolling windows from NOW(), not calendar
 * boundaries; combining both narrows to `today` (a subset of `week`).
 * @param {Object} filters - Filter options
 * @param {number} filters.volunteerId - ID of the volunteer
 * @param {boolean} [filters.today] - Restrict to the next 24 hours
 * @param {boolean} [filters.week] - Restrict to the next 7 days
 * @returns {Object} Object containing whereClause string and params object
 */
function buildUpcomingFilter({ volunteerId, today, week }) {
  const conditions = [
    'is_deleted = 0',
    'volunteer_id = :volunteerId',
    'status = :scheduledStatus',
    'scheduled_at IS NOT NULL',
    'scheduled_at >= NOW()',
  ];
  const params = { volunteerId, scheduledStatus: DONATION_STATUS.SCHEDULED };

  if (today) {
    conditions.push('scheduled_at < (CURDATE() + INTERVAL 1 DAY)');
  }

  if (week) {
    conditions.push('scheduled_at < DATE_ADD(NOW(), INTERVAL 7 DAY)');
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Lists the volunteer's upcoming (scheduled, future) pickups, ordered by
 * scheduled_at ASC, with optional today/week narrowing and pagination.
 * @param {Object} options - Query options
 * @param {number} options.volunteerId - ID of the volunteer
 * @param {boolean} [options.today] - Restrict to the next 24 hours
 * @param {boolean} [options.week] - Restrict to the next 7 days
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of donation objects
 */
async function findUpcoming({ volunteerId, today, week, limit, offset }) {
  const { whereClause, params } = buildUpcomingFilter({ volunteerId, today, week });

  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests
     WHERE ${whereClause}
     ORDER BY scheduled_at ASC
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

/**
 * Total count matching the same filters as findUpcoming.
 * Powers pagination meta.
 * @param {Object} filters - Filter options (same as buildUpcomingFilter)
 * @returns {Promise<number>} Total count of matching upcoming pickups
 */
async function countUpcoming({ volunteerId, today, week }) {
  const { whereClause, params } = buildUpcomingFilter({ volunteerId, today, week });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM donation_requests WHERE ${whereClause}`,
    params
  );
  return rows[0].total;
}

/**
 * Single aggregate query for the dashboard's "upcoming" counters.
 * Deliberately separate from getVolunteerSummary (donation.model.js),
 * which already covers accepted/scheduled/completed/total — this only
 * adds the two time-windowed counts that summary doesn't provide.
 * @param {number} volunteerId - ID of the volunteer
 * @returns {Promise<Object>} Object with upcomingToday and upcomingThisWeek counts
 */
async function getUpcomingCounts(volunteerId) {
  const [rows] = await pool.query(
    `SELECT
       SUM(scheduled_at >= NOW() AND scheduled_at < (CURDATE() + INTERVAL 1 DAY)) AS upcomingToday,
       SUM(scheduled_at >= NOW() AND scheduled_at < DATE_ADD(NOW(), INTERVAL 7 DAY)) AS upcomingThisWeek
     FROM donation_requests
     WHERE volunteer_id = :volunteerId AND is_deleted = 0 AND status = :scheduledStatus`,
    { volunteerId, scheduledStatus: DONATION_STATUS.SCHEDULED }
  );
  return rows[0];
}

module.exports = {
  findAssignments,
  countAssignments,
  findUpcoming,
  countUpcoming,
  getUpcomingCounts,
};
