const { HTTP_STATUS, USER_ROLES } = require('../constants');
const AppError = require('../utils/AppError');
const adminModel = require('../models/admin.model');
const donationModel = require('../models/donation.model');
const volunteerModel = require('../models/volunteer.model');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

/**
 * Normalizes a value that may arrive from mysql2 as a string/Buffer/null
 * (e.g. SUM() over zero rows) into a plain JS integer. Same helper shape
 * as volunteer.service.js#toInt.
 * @param {*} value - Raw aggregate value from the database
 * @returns {number} Normalized integer (0 if null/undefined)
 */
function toInt(value) {
  return Number(value) || 0;
}

/* ============================================================
 * Dashboard
 * ============================================================ */

/**
 * Builds the admin dashboard summary from three independent aggregate
 * queries, run in parallel.
 * @returns {Promise<Object>} Dashboard summary object
 */
async function getDashboard() {
  const [userCounts, donationCounts, recentDonations] = await Promise.all([
    adminModel.getUserCounts(),
    adminModel.getDonationCounts(),
    adminModel.getRecentDonations(10),
  ]);

  return {
    totalUsers: toInt(userCounts.totalUsers),
    totalDonors: toInt(userCounts.totalDonors),
    totalVolunteers: toInt(userCounts.totalVolunteers),
    totalDonationRequests: toInt(donationCounts.totalDonationRequests),
    pending: toInt(donationCounts.pending),
    accepted: toInt(donationCounts.accepted),
    scheduled: toInt(donationCounts.scheduled),
    completed: toInt(donationCounts.completed),
    cancelled: toInt(donationCounts.cancelled),
    recentDonations,
  };
}

/* ============================================================
 * User management
 * ============================================================ */

/**
 * Lists users with search/filter/pagination. Pure orchestration — all SQL
 * lives in the model.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing users array and pagination meta
 */
async function listUsers(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { search, role, status, sortBy, sortOrder } = query;
  const filters = { search, role, status };

  const [users, totalItems] = await Promise.all([
    adminModel.findUsers({ ...filters, sortBy, sortOrder, limit, offset }),
    adminModel.countUsers(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { users, meta };
}

/**
 * Gets a single user's full admin-facing profile.
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User object
 * @throws {AppError} 404 if no such user exists
 */
async function getUserDetail(userId) {
  const user = await adminModel.findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }
  return user;
}

/**
 * Soft-disables (bans) a user. Guards against an admin disabling their own
 * account (self-lockout prevention) and against redundant state transitions.
 * @param {number} userId - User ID to disable
 * @param {number} requestingAdminId - ID of the admin making the request
 * @returns {Promise<Object>} The updated user object
 * @throws {AppError} 403 self-disable, 404 not found, 409 already in that state
 */
async function disableUser(userId, requestingAdminId) {
  if (Number(userId) === Number(requestingAdminId)) {
    throw new AppError('You cannot disable your own admin account.', HTTP_STATUS.FORBIDDEN);
  }

  const user = await adminModel.findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (user.is_deleted) {
    throw new AppError('This user account no longer exists.', HTTP_STATUS.CONFLICT);
  }
  if (user.is_banned) {
    throw new AppError('This user is already disabled.', HTTP_STATUS.CONFLICT);
  }

  await adminModel.setUserBanned(userId, true);
  return adminModel.findUserById(userId);
}

/**
 * Re-enables (unbans) a user.
 * @param {number} userId - User ID to re-enable
 * @returns {Promise<Object>} The updated user object
 * @throws {AppError} 404 not found, 409 already active/deleted
 */
async function enableUser(userId) {
  const user = await adminModel.findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (user.is_deleted) {
    throw new AppError('This user account no longer exists.', HTTP_STATUS.CONFLICT);
  }
  if (!user.is_banned) {
    throw new AppError('This user is already active.', HTTP_STATUS.CONFLICT);
  }

  await adminModel.setUserBanned(userId, false);
  return adminModel.findUserById(userId);
}

/* ============================================================
 * Donation oversight
 * ============================================================ */

/**
 * Lists donations with full admin filtering and pagination.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing donations array and pagination meta
 */
async function listDonations(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { status, category, donorId, volunteerId, dateFrom, dateTo, deleted, sortBy, sortOrder } = query;
  const filters = { status, category, donorId, volunteerId, dateFrom, dateTo, deleted };

  const [donations, totalItems] = await Promise.all([
    adminModel.findDonations({ ...filters, sortBy, sortOrder, limit, offset }),
    adminModel.countDonations(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { donations, meta };
}

/**
 * Gets full details for a single donation, regardless of soft-delete state.
 * @param {number} donationId - Donation ID
 * @returns {Promise<Object>} Donation object
 * @throws {AppError} 404 if no such donation exists
 */
async function getDonationDetail(donationId) {
  const donation = await adminModel.findDonationById(donationId);
  if (!donation) {
    throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
  }
  return donation;
}

/**
 * Gets the full status history for a donation, plus the donation itself
 * (so the caller doesn't need a second round trip for context).
 * @param {number} donationId - Donation ID
 * @returns {Promise<Object>} Object with donation and its history array
 * @throws {AppError} 404 if no such donation exists
 */
async function getDonationHistory(donationId) {
  const donation = await adminModel.findDonationById(donationId);
  if (!donation) {
    throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
  }

  const history = await adminModel.findDonationStatusHistory(donationId);
  return { donation, history };
}

/* ============================================================
 * Volunteer monitoring
 * ============================================================ */

/**
 * Lists all volunteers with aggregated assignment stats.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing volunteers array and pagination meta
 */
async function listVolunteers(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { search } = query;

  const [volunteers, totalItems] = await Promise.all([
    adminModel.findVolunteersWithStats({ search, limit, offset }),
    adminModel.countVolunteers({ search }),
  ]);

  const normalized = volunteers.map((v) => ({
    ...v,
    activeAssignments: toInt(v.activeAssignments),
    completedPickups: toInt(v.completedPickups),
  }));

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { volunteers: normalized, meta };
}

/**
 * Gets a single volunteer's profile, aggregate stats, and current active
 * assignments. Reuses donationModel.getVolunteerSummary (Module 6) and
 * volunteerModel.findAssignments (Module 7) unchanged — no new SQL for
 * data that already has a query.
 * @param {number} volunteerId - Volunteer's user ID
 * @returns {Promise<Object>} Object with volunteer, stats, and currentAssignments
 * @throws {AppError} 404 if no such volunteer exists
 */
async function getVolunteerDetail(volunteerId) {
  const user = await adminModel.findUserById(volunteerId);
  if (!user || user.role !== USER_ROLES.VOLUNTEER) {
    throw new AppError('Volunteer not found.', HTTP_STATUS.NOT_FOUND);
  }

  const [summary, currentAssignments] = await Promise.all([
    donationModel.getVolunteerSummary(volunteerId),
    volunteerModel.findAssignments({ volunteerId, limit: 50, offset: 0 }),
  ]);

  const completed = toInt(summary.completed);

  return {
    volunteer: user,
    stats: {
      activeAssignments: toInt(summary.accepted) + toInt(summary.scheduled),
      completedPickups: completed,
      totalCompletedDonations: completed,
      totalAssigned: toInt(summary.total),
    },
    currentAssignments,
  };
}

/* ============================================================
 * Audit support
 * ============================================================ */

/**
 * Gets a paginated activity log for a user plus a per-action-type summary.
 * @param {number} userId - User ID
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object with user, activity, summary, and pagination meta
 * @throws {AppError} 404 if no such user exists
 */
async function getUserActivity(userId, query) {
  const user = await adminModel.findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const { page, limit, offset } = getPaginationParams(query);

  const [activity, totalItems, actionSummary] = await Promise.all([
    adminModel.findUserActivity(userId, { limit, offset }),
    adminModel.countUserActivity(userId),
    adminModel.getUserActivityActionSummary(userId),
  ]);

  const parsedActivity = activity.map((entry) => {
    let metadata = null;
    if (entry.metadata) {
      try {
        metadata = JSON.parse(entry.metadata);
      } catch {
        metadata = entry.metadata; // Fall back to raw string if not valid JSON
      }
    }
    return { ...entry, metadata };
  });

  const summary = actionSummary.reduce((acc, row) => {
    acc[row.action] = toInt(row.count);
    return acc;
  }, {});

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { user, activity: parsedActivity, summary, meta };
}

module.exports = {
  getDashboard,
  listUsers,
  getUserDetail,
  disableUser,
  enableUser,
  listDonations,
  getDonationDetail,
  getDonationHistory,
  listVolunteers,
  getVolunteerDetail,
  getUserActivity,
};
