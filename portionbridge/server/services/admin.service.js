const { HTTP_STATUS, USER_ROLES } = require('../constants');
const AppError = require('../utils/AppError');
const adminModel = require('../models/admin.model');
const donationModel = require('../models/donation.model');
const volunteerModel = require('../models/volunteer.model');
const reportModel = require('../models/report.model');
const teamMemberModel = require('../models/teamMember.model');
const teamModel = require('../models/team.model');
const volunteerProfileModel = require('../models/volunteerProfile.model');
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
 * Fills gaps in a monthly time series so the frontend always gets a fixed
 * number of trailing months, even ones with zero rows — same purpose as
 * profile.service.js#calculateMonthlyTrend, generalized here to accept any
 * set of numeric fields (donation trend, user growth, volunteer activity
 * all shape differently) instead of being hardcoded to one shape.
 * @param {Array} rows - Raw grouped rows, each with a `month` key ('YYYY-MM')
 * @param {number} months - How many trailing months to guarantee
 * @param {string[]} fields - Numeric field names to default to 0 when missing
 * @returns {Array} Exactly `months` entries, oldest first, gaps zero-filled
 */
function fillMonthlyGaps(rows, months, fields) {
  const byMonth = new Map(rows.map((row) => [row.month, row]));
  const now = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toISOString().slice(0, 7);
    const existing = byMonth.get(key);
    const entry = { month: key };
    fields.forEach((field) => {
      entry[field] = toInt(existing?.[field]);
    });
    result.push(entry);
  }

  return result;
}

/**
 * ISO date string for the first day of the month `months - 1` months ago —
 * the lower bound for a trailing N-month query (e.g. months=6 covers the
 * current month plus the previous 5).
 * @param {number} months - Trailing window size
 * @returns {string} ISO date string
 */
function monthsAgoStart(months) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).toISOString();
}

const TREND_MONTHS = 6;

/**
 * Builds the admin Overview ("Command Center") payload: KPI counts, impact
 * totals, analytics trends, and recent-activity feeds. Every figure comes
 * from a real aggregate query — nothing here is hardcoded or estimated
 * beyond the same mealsShared/clothesDonated -> peopleHelped formula
 * profile.service.js already uses for a single donor.
 * @returns {Promise<Object>} Dashboard summary object
 */
async function getDashboard() {
  const since = monthsAgoStart(TREND_MONTHS);

  const [
    userCounts,
    donationCounts,
    activeVolunteers,
    impact,
    categoryDistribution,
    donationTrendRows,
    userGrowthRows,
    volunteerActivityRows,
    recentDonations,
    recentUsers,
    recentActivity,
  ] = await Promise.all([
    adminModel.getUserCounts(),
    adminModel.getDonationCounts(),
    adminModel.getActiveVolunteersCount(),
    adminModel.getImpactStats(),
    adminModel.getCategoryDistribution(),
    adminModel.getDonationTrend(since),
    adminModel.getUserGrowth(since),
    adminModel.getVolunteerActivityTrend(since),
    adminModel.getRecentDonations(10),
    adminModel.getRecentUsers(10),
    adminModel.findRecentActivity(15),
  ]);

  const totalDonationRequests = toInt(donationCounts.totalDonationRequests);
  const completed = toInt(donationCounts.completed);
  const mealsShared = toInt(impact.mealsShared);
  const clothesDonated = toInt(impact.clothesDonated);
  const successfulDonations = toInt(impact.successfulDonations);
  const completionRate = totalDonationRequests > 0
    ? Number(((completed / totalDonationRequests) * 100).toFixed(1))
    : 0;

  return {
    // KPI cards
    totalUsers: toInt(userCounts.totalUsers),
    totalDonors: toInt(userCounts.totalDonors),
    totalVolunteers: toInt(userCounts.totalVolunteers),
    totalDonationRequests,
    activeDonations: toInt(donationCounts.active),
    completed,
    pending: toInt(donationCounts.pending),
    activeVolunteers: toInt(activeVolunteers),

    // Kept for backward compatibility with anything already reading these
    // (Phase 1's AdminStatsCards) — same fields as before Phase 2.
    accepted: toInt(donationCounts.accepted),
    scheduled: toInt(donationCounts.scheduled),
    cancelled: toInt(donationCounts.cancelled),

    // Impact section
    impact: {
      peopleHelped: mealsShared + Math.floor(clothesDonated / 2),
      successfulDonations,
      completedPickups: successfulDonations,
      mealsShared,
      clothesDonated,
    },

    // Analytics
    analytics: {
      donationTrend: fillMonthlyGaps(donationTrendRows, TREND_MONTHS, ['count', 'completed']),
      completionRate,
      categoryDistribution: categoryDistribution.map((row) => ({
        category: row.category,
        count: toInt(row.count),
      })),
      userGrowth: fillMonthlyGaps(userGrowthRows, TREND_MONTHS, ['donors', 'volunteers']),
      volunteerActivity: fillMonthlyGaps(
        volunteerActivityRows,
        TREND_MONTHS,
        ['completedPickups', 'activeVolunteers']
      ),
    },

    // Recent activity
    recentDonations,
    recentUsers,
    recentActivity: recentActivity.map((entry) => {
      let metadata = null;
      if (entry.metadata) {
        try {
          metadata = JSON.parse(entry.metadata);
        } catch {
          metadata = entry.metadata;
        }
      }
      return { ...entry, metadata };
    }),
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
 * Lists donations with full admin filtering and pagination. Accepts a new
 * `reported` boolean (Phase 3) alongside the existing filters, backing the
 * Donation Management page's "Reported" tab.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing donations array and pagination meta
 */
async function listDonations(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { status, category, donorId, volunteerId, dateFrom, dateTo, deleted, reported, sortBy, sortOrder } = query;
  const filters = { status, category, donorId, volunteerId, dateFrom, dateTo, deleted, reported };

  const [donations, totalItems] = await Promise.all([
    adminModel.findDonations({ ...filters, sortBy, sortOrder, limit, offset }),
    adminModel.countDonations(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { donations, meta };
}

/**
 * Gets full details for a single donation, regardless of soft-delete state,
 * plus any reports filed against it (Phase 3 — reuses report.model.js,
 * the same table/rows the donor/volunteer-facing report feature already
 * writes to; no duplicate report logic).
 * @param {number} donationId - Donation ID
 * @returns {Promise<Object>} Donation object with a `reports` array
 * @throws {AppError} 404 if no such donation exists
 */
async function getDonationDetail(donationId) {
  const donation = await adminModel.findDonationById(donationId);
  if (!donation) {
    throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
  }

  const reports = await reportModel.findByDonationId(donationId);
  return { ...donation, reports };
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
 * Lists volunteers with per-volunteer assignment stats and derived
 * performance metrics.
 *
 * `isActive`/`currentStatus` (Phase 4) are derived, not stored — this
 * schema has no availability/online-status column on `users`, so "active"
 * means "currently holds a non-terminal assignment", the same definition
 * Phase 2's getActiveVolunteersCount KPI uses. completionRate/
 * cancellationRate are computed against completed+cancelled ("attempted")
 * rather than totalAssigned, so a volunteer with an active-but-unfinished
 * assignment isn't penalized for it yet.
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

  const normalized = volunteers.map((v) => {
    const activeAssignments = toInt(v.activeAssignments);
    const completedPickups = toInt(v.completedPickups);
    const cancelledPickups = toInt(v.cancelledPickups);
    const totalAssigned = toInt(v.totalAssigned);
    const attempted = completedPickups + cancelledPickups;

    return {
      ...v,
      activeAssignments,
      completedPickups,
      cancelledPickups,
      totalAssigned,
      isActive: activeAssignments > 0,
      currentStatus: activeAssignments > 0 ? 'On a Mission' : 'Available',
      completionRate: attempted > 0 ? Number(((completedPickups / attempted) * 100).toFixed(1)) : 0,
      cancellationRate: attempted > 0 ? Number(((cancelledPickups / attempted) * 100).toFixed(1)) : 0,
    };
  });

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { volunteers: normalized, meta };
}

/**
 * Gets a single volunteer's profile, aggregate stats (including Phase 4's
 * completion/cancellation rate and derived active status), declared
 * availability (volunteer_profiles — real, volunteer-entered data, not
 * derived), team membership, and current active assignments. Reuses
 * donationModel.getVolunteerSummary (Module 6) and volunteerModel.findAssignments
 * (Module 7) unchanged — no new SQL for data that already has a query.
 * @param {number} volunteerId - Volunteer's user ID
 * @returns {Promise<Object>} Object with volunteer, stats, availability, team, and currentAssignments
 * @throws {AppError} 404 if no such volunteer exists
 */
async function getVolunteerDetail(volunteerId) {
  const user = await adminModel.findUserById(volunteerId);
  if (!user || user.role !== USER_ROLES.VOLUNTEER) {
    throw new AppError('Volunteer not found.', HTTP_STATUS.NOT_FOUND);
  }

  const [summary, cancelledPickups, currentAssignments, profile, membership] = await Promise.all([
    donationModel.getVolunteerSummary(volunteerId),
    adminModel.getVolunteerCancelledCount(volunteerId),
    volunteerModel.findAssignments({ volunteerId, limit: 50, offset: 0 }),
    volunteerProfileModel.findByUserId(volunteerId),
    teamMemberModel.findByUserId(volunteerId),
  ]);

  const completed = toInt(summary.completed);
  const cancelled = toInt(cancelledPickups);
  const activeAssignments = toInt(summary.accepted) + toInt(summary.scheduled);
  const attempted = completed + cancelled;

  let team = null;
  if (membership) {
    const teamRecord = await teamModel.findById(membership.team_id);
    if (teamRecord) {
      team = { id: teamRecord.id, name: teamRecord.name, role: membership.role };
    }
  }

  return {
    volunteer: user,
    stats: {
      activeAssignments,
      completedPickups: completed,
      cancelledPickups: cancelled,
      totalCompletedDonations: completed,
      totalAssigned: toInt(summary.total) + cancelled,
      isActive: activeAssignments > 0,
      currentStatus: activeAssignments > 0 ? 'On a Mission' : 'Available',
      completionRate: attempted > 0 ? Number(((completed / attempted) * 100).toFixed(1)) : 0,
      cancellationRate: attempted > 0 ? Number(((cancelled / attempted) * 100).toFixed(1)) : 0,
    },
    availability: profile
      ? { vehicleType: profile.vehicle_type, availability: profile.availability, serviceAreas: profile.service_areas }
      : null,
    team,
    currentAssignments,
  };
}

/* ============================================================
 * Team monitoring (Phase 4)
 * ============================================================ */

const TEAM_ACTIVITY_LIMIT = 15;

/**
 * Lists all teams with leader name, member count, and mission counts —
 * "Team list" + at-a-glance "Team leader"/"Active missions" from the
 * Phase 4 spec. Backed entirely by the new adminModel.findTeams query;
 * team.model.js's own findByLeaderId etc. are single-team lookups scoped
 * to "my team", not a paginated admin-wide list, so they weren't reusable
 * here as-is.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing teams array and pagination meta
 */
async function listTeams(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { search } = query;

  const [teams, totalItems] = await Promise.all([
    adminModel.findTeams({ search, limit, offset }),
    adminModel.countTeams({ search }),
  ]);

  const normalized = teams.map((t) => ({
    ...t,
    memberCount: toInt(t.memberCount),
    activeMissions: toInt(t.activeMissions),
    completedMissions: toInt(t.completedMissions),
  }));

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { teams: normalized, meta };
}

/**
 * Gets full team detail: leader, members, active/completed missions, and
 * a merged team-activity feed (membership changes from audit_logs +
 * announcements from the existing team_announcement notifications —
 * see adminModel.findTeamAuditActivity/findTeamAnnouncements). Reuses
 * teamMemberModel.findByTeamId and donationModel.findByTeamId unchanged.
 * @param {number} teamId - Team ID
 * @returns {Promise<Object>} Team detail object
 * @throws {AppError} 404 if no such team exists
 */
async function getTeamDetail(teamId) {
  const team = await adminModel.findTeamById(teamId);
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  const [members, missions, auditActivity, announcements] = await Promise.all([
    teamMemberModel.findByTeamId(teamId),
    donationModel.findByTeamId(teamId),
    adminModel.findTeamAuditActivity(teamId, TEAM_ACTIVITY_LIMIT),
    adminModel.findTeamAnnouncements(teamId, TEAM_ACTIVITY_LIMIT),
  ]);

  const activeMissions = missions.filter((m) => m.status !== 'completed');
  const completedMissions = missions.filter((m) => m.status === 'completed');

  const activity = [
    ...auditActivity.map((a) => ({
      kind: 'member_change',
      id: `audit-${a.id}`,
      action: a.action,
      actorName: a.actor_name,
      actorRole: a.actor_role,
      createdAt: a.created_at,
    })),
    ...announcements.map((n) => ({
      kind: 'announcement',
      id: `announcement-${n.id}`,
      message: n.message,
      createdAt: n.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, TEAM_ACTIVITY_LIMIT);

  return {
    team,
    members,
    activeMissions,
    completedMissions,
    activity,
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
  listTeams,
  getTeamDetail,
  getUserActivity,
};
