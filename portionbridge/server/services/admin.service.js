const { HTTP_STATUS, USER_ROLES, AUDIT_ACTIONS, REPORT_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const adminModel = require('../models/admin.model');
const donationModel = require('../models/donation.model');
const volunteerModel = require('../models/volunteer.model');
const reportModel = require('../models/report.model');
const teamMemberModel = require('../models/teamMember.model');
const teamModel = require('../models/team.model');
const volunteerProfileModel = require('../models/volunteerProfile.model');
const socketRegistry = require('../sockets/socketRegistry');
const { getLastLocationUpdateAt } = require('../sockets/handlers/tracking.handler');
const { deriveDonationFlags, computeDonationHealthScore } = require('../utils/donationHealthScore');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
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
 * Records the action in audit_logs (Phase 8) — this previously wasn't
 * logged at all despite being a real moderation action.
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
  await auditService.record({
    userId: requestingAdminId,
    action: AUDIT_ACTIONS.USER_BANNED,
    metadata: { targetUserId: userId, targetUserRole: user.role },
  });
  return adminModel.findUserById(userId);
}

/**
 * Re-enables (unbans) a user. Records the action in audit_logs (Phase 8).
 * @param {number} userId - User ID to re-enable
 * @param {number} requestingAdminId - ID of the admin making the request
 * @returns {Promise<Object>} The updated user object
 * @throws {AppError} 404 not found, 409 already active/deleted
 */
async function enableUser(userId, requestingAdminId) {
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
  await auditService.record({
    userId: requestingAdminId,
    action: AUDIT_ACTIONS.USER_UNBANNED,
    metadata: { targetUserId: userId, targetUserRole: user.role },
  });
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
/**
 * Gets full details for a single donation, regardless of soft-delete state,
 * plus any reports filed against it (Phase 3 — reuses report.model.js,
 * the same table/rows the donor/volunteer-facing report feature already
 * writes to; no duplicate report logic), plus (Phase 7) a transparent,
 * rule-based health score/risk level/reasons — see
 * utils/donationHealthScore.js. Uses the SAME flag-derivation used by
 * getAttentionCenter below, so a donation's score here is always
 * consistent with why (or why not) it shows up in the Attention Center.
 * @param {number} donationId - Donation ID
 * @returns {Promise<Object>} Donation object with `reports` array and `healthScore`
 * @throws {AppError} 404 if no such donation exists
 */
async function getDonationDetail(donationId) {
  const donation = await adminModel.findDonationById(donationId);
  if (!donation) {
    throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
  }

  const reports = await reportModel.findByDonationId(donationId);
  const hasOpenReport = reports.some((r) => r.status === 'pending');

  const assignedPersonId = donation.assignment_mode === 'team' ? donation.assigned_member_id : donation.volunteer_id;
  const flags = deriveDonationFlags(donation, {
    pickedUpAt: donation.picked_up_at,
    hasOpenReport,
    assignedPersonOnline: assignedPersonId ? socketRegistry.isOnline(assignedPersonId) : null,
    lastLocationUpdateAt: assignedPersonId ? getLastLocationUpdateAt(assignedPersonId, donation.id) : null,
  });
  const healthScore = computeDonationHealthScore(donation, flags);

  return { ...donation, reports, healthScore };
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
 * Live Operations (Phase 6)
 * ============================================================ */

/**
 * Builds the Admin Live Operations Map's initial snapshot: every active
 * mission (with donor/volunteer/pickup info), a de-duplicated list of the
 * volunteers currently on one of them (with an online/offline snapshot
 * from socketRegistry — same source Phase 4/5 already use), and the teams
 * involved (leader + roster, reusing teamMemberModel.findByTeamId).
 *
 * This is a REST snapshot for first paint only — live updates after that
 * come from the existing Socket.io 'volunteer_location_updated' /
 * 'donation_status_updated' events, now also broadcast to the
 * 'admin_live_ops' room (see tracking.handler.js and
 * donation.service.js#emitDonationStatusUpdate). No location data is
 * persisted or returned here beyond what's already real: this endpoint
 * does NOT invent a "current position" for any volunteer — that only
 * ever comes from a live socket update after the admin's map has joined
 * the room, exactly like the volunteer's own MissionMap (Phase 5) has no
 * position until the browser's geolocation reports one.
 * @returns {Promise<Object>} { missions, volunteers, teams }
 */
async function getLiveOperations() {
  const missions = await adminModel.findActiveDonationsForMap();

  const volunteerMap = new Map();
  const teamIds = new Set();

  for (const mission of missions) {
    const personId = mission.assignment_mode === 'team' ? mission.assigned_member_id : mission.volunteer_id;
    const personName = mission.assignment_mode === 'team' ? mission.assigned_member_name : mission.volunteer_name;

    if (personId && !volunteerMap.has(personId)) {
      volunteerMap.set(personId, {
        id: personId,
        name: personName,
        isOnline: socketRegistry.isOnline(personId),
        donationId: mission.id,
        status: mission.status,
      });
    }
    if (mission.assignment_mode === 'team' && mission.team_id) {
      teamIds.add(mission.team_id);
    }
  }

  const teams = await Promise.all(
    Array.from(teamIds).map(async (teamId) => {
      const [team, members] = await Promise.all([
        adminModel.findTeamById(teamId),
        teamMemberModel.findByTeamId(teamId),
      ]);
      if (!team) return null;

      const activeMissionForTeam = missions.find((m) => m.team_id === teamId);

      return {
        id: team.id,
        name: team.name,
        leaderId: team.leader_id,
        leaderName: team.leader_name,
        members: members.map((m) => ({
          id: m.user_id,
          name: m.name,
          role: m.role,
          isOnline: socketRegistry.isOnline(m.user_id),
        })),
        activeMission: activeMissionForTeam
          ? { donationId: activeMissionForTeam.id, status: activeMissionForTeam.status }
          : null,
      };
    })
  );

  return {
    missions,
    volunteers: Array.from(volunteerMap.values()),
    teams: teams.filter(Boolean),
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

/* ============================================================
 * Attention Center (Phase 7)
 * ============================================================ */

// Human-readable labels + the admin-facing link each item type resolves
// to. Centralized here (rather than inline in the loop below) so the
// item-building logic and the "what does this type mean" mapping don't
// drift apart.
const ATTENTION_ITEM_META = {
  reported_donation: { severity: 'high', title: 'Donation reported' },
  pending_moderation: { severity: 'medium', title: 'User report pending review' },
  delayed_pickup: { severity: 'high', title: 'Pickup overdue' },
  delayed_delivery: { severity: 'high', title: 'Delivery taking too long' },
  unassigned_donation: { severity: 'medium', title: 'No volunteer assigned' },
  inactive_volunteer: { severity: 'medium', title: 'Assigned volunteer appears offline' },
  stale_location: { severity: 'low', title: "Volunteer location hasn't updated" },
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

/**
 * Builds the Admin Attention Center / Smart Monitoring snapshot: a single
 * prioritized list covering every category the spec asked for (reported
 * donations, delayed pickups/deliveries, unassigned donations, inactive
 * volunteers, pending moderation items) — which doubles as the "Alerts"
 * list, since each entry already IS an operational alert condition. One
 * unified, recomputed-on-request list rather than two separate detection
 * systems, so there's no risk of the same real condition producing two
 * different "alerts" that drift out of sync with each other.
 *
 * Everything here is derived fresh from real data on each call — nothing
 * is persisted, so there's no stale/duplicate notification row to ever
 * clean up, and no external AI call of any kind (see
 * utils/donationHealthScore.js for the transparent, rule-based logic).
 * @returns {Promise<Object>} { items, generatedAt }
 */
async function getAttentionCenter() {
  const [donations, pendingReports] = await Promise.all([
    adminModel.findDonationsForAttentionCenter(),
    adminModel.findPendingReportsForAttentionCenter(),
  ]);

  const reportedDonationIds = new Set(
    pendingReports.filter((r) => r.reported_donation_id).map((r) => r.reported_donation_id)
  );

  const items = [];

  for (const donation of donations) {
    const assignedPersonId = donation.assignment_mode === 'team' ? donation.assigned_member_id : donation.volunteer_id;
    const flags = deriveDonationFlags(donation, {
      pickedUpAt: donation.picked_up_at,
      hasOpenReport: reportedDonationIds.has(donation.id),
      assignedPersonOnline: assignedPersonId ? socketRegistry.isOnline(assignedPersonId) : null,
      lastLocationUpdateAt: assignedPersonId ? getLastLocationUpdateAt(assignedPersonId, donation.id) : null,
    });

    const personName = donation.assignment_mode === 'team' ? donation.assigned_member_name : donation.volunteer_name;
    const link = `/admin/donations/${donation.id}`;

    if (flags.isUnassigned) {
      items.push(buildAttentionItem('unassigned_donation', donation.id, link, {
        description: `#${donation.id} (${donation.category}) has had no volunteer for over ${Math.round((Date.now() - new Date(donation.created_at).getTime()) / 60000)} minutes.`,
      }));
    }
    if (flags.isDelayedPickup) {
      items.push(buildAttentionItem('delayed_pickup', donation.id, link, {
        description: `#${donation.id} was scheduled for pickup by ${donation.volunteer_name || 'the assigned volunteer'} and is now overdue.`,
      }));
    }
    if (flags.isDelayedDelivery) {
      items.push(buildAttentionItem('delayed_delivery', donation.id, link, {
        description: `#${donation.id} has been picked up but not marked completed for an extended period.`,
      }));
    }
    if (flags.isInactiveVolunteer) {
      items.push(buildAttentionItem('inactive_volunteer', donation.id, link, {
        description: `${personName || 'The assigned volunteer'} has an active mission (#${donation.id}) but appears offline.`,
        userId: assignedPersonId,
      }));
    }
    if (flags.isStaleLocation) {
      items.push(buildAttentionItem('stale_location', donation.id, link, {
        description: `No location update from ${personName || 'the volunteer'} on mission #${donation.id} recently.`,
        userId: assignedPersonId,
      }));
    }
  }

  for (const report of pendingReports) {
    if (report.reported_donation_id) {
      items.push(buildAttentionItem('reported_donation', report.reported_donation_id, `/admin/donations/${report.reported_donation_id}`, {
        description: `${report.reporter_name || 'A user'} reported "${report.donation_title || 'a donation'}": ${report.reason}`,
        reportId: report.id,
        detectedAt: report.created_at,
      }));
    } else if (report.reported_user_id) {
      items.push(buildAttentionItem('pending_moderation', report.reported_user_id, `/admin/users/${report.reported_user_id}`, {
        description: `${report.reporter_name || 'A user'} reported ${report.reported_user_name || 'a user'}: ${report.reason}`,
        reportId: report.id,
        detectedAt: report.created_at,
        userId: report.reported_user_id,
      }));
    }
  }

  items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    || new Date(b.detectedAt) - new Date(a.detectedAt));

  return { items, generatedAt: new Date().toISOString() };
}

/**
 * Builds one Attention Center entry from its type + target + extra
 * fields, filling in the shared title/severity from ATTENTION_ITEM_META
 * so every item has a consistent shape.
 * @param {string} type - Key into ATTENTION_ITEM_META
 * @param {number} donationId - Related donation ID (also used as part of a stable item id)
 * @param {string} link - Admin-facing route this item should navigate to
 * @param {Object} extra - { description, userId?, reportId?, detectedAt? }
 * @returns {Object} Attention Center item
 */
function buildAttentionItem(type, donationId, link, extra) {
  const meta = ATTENTION_ITEM_META[type];
  return {
    id: `${type}-${extra.reportId || donationId}`,
    type,
    severity: meta.severity,
    title: meta.title,
    description: extra.description,
    donationId,
    userId: extra.userId || null,
    link,
    detectedAt: extra.detectedAt || new Date().toISOString(),
  };
}

/* ============================================================
 * Reports & Moderation (Phase 8)
 * ============================================================ */

/**
 * Lists reports for the admin moderation queue or history — `status`
 * decides which: pass 'pending'/'reviewed' for the active queue, or
 * 'resolved'/'dismissed' for history. Same table/query either way (see
 * report.model.js#findAllReports) — there's no separate history feature
 * to keep in sync.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing reports array and pagination meta
 */
async function listReports(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { status, targetType, search, sortBy, sortOrder } = query;
  const filters = { status, targetType, search };

  const [reports, totalItems] = await Promise.all([
    reportModel.findAllReports({ ...filters, sortBy, sortOrder, limit, offset }),
    reportModel.countAllReports(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { reports, meta };
}

/**
 * Gets a single report's full detail for the admin moderation view.
 * @param {number} reportId - Report ID
 * @returns {Promise<Object>} Enriched report object
 * @throws {AppError} 404 if no such report exists
 */
async function getReportDetail(reportId) {
  const report = await reportModel.findByIdWithDetails(reportId);
  if (!report) {
    throw new AppError('Report not found.', HTTP_STATUS.NOT_FOUND);
  }
  return report;
}

/**
 * Marks a report as under investigation (status: reviewed) — an admin has
 * looked at it, but no final decision has been made yet. Does not require
 * notes; "resolve"/"dismiss" below do.
 * @param {number} reportId - Report ID
 * @param {number} adminId - Acting admin's user ID
 * @returns {Promise<Object>} The updated report
 * @throws {AppError} 404 not found, 409 already closed
 */
async function investigateReport(reportId, adminId) {
  const report = await reportModel.findByIdWithDetails(reportId);
  if (!report) {
    throw new AppError('Report not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (report.status === REPORT_STATUS.RESOLVED || report.status === REPORT_STATUS.DISMISSED) {
    throw new AppError('This report has already been closed.', HTTP_STATUS.CONFLICT);
  }

  await reportModel.updateReportStatus(reportId, { status: REPORT_STATUS.REVIEWED });
  await auditService.record({
    userId: adminId,
    action: AUDIT_ACTIONS.REPORT_INVESTIGATED,
    metadata: { reportId, reportedUserId: report.reported_user_id, reportedDonationId: report.reported_donation_id },
  });
  return reportModel.findByIdWithDetails(reportId);
}

/**
 * Closes a report as resolved (a real issue was found/action was taken)
 * or dismissed (reviewed, no violation) — the two share this
 * implementation since the only difference is the final status value and
 * audit action, both passed in by the two thin wrappers below.
 * @param {number} reportId - Report ID
 * @param {number} adminId - Acting admin's user ID
 * @param {string} status - REPORT_STATUS.RESOLVED or REPORT_STATUS.DISMISSED
 * @param {string} auditAction - AUDIT_ACTIONS.REPORT_RESOLVED or REPORT_DISMISSED
 * @param {string} [notes] - Admin's reasoning
 * @returns {Promise<Object>} The updated report
 * @throws {AppError} 404 not found, 409 already closed
 */
async function closeReport(reportId, adminId, status, auditAction, notes) {
  const report = await reportModel.findByIdWithDetails(reportId);
  if (!report) {
    throw new AppError('Report not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (report.status === REPORT_STATUS.RESOLVED || report.status === REPORT_STATUS.DISMISSED) {
    throw new AppError('This report has already been closed.', HTTP_STATUS.CONFLICT);
  }

  await reportModel.updateReportStatus(reportId, { status, resolvedBy: adminId, resolutionNotes: notes || null });
  await auditService.record({
    userId: adminId,
    action: auditAction,
    metadata: {
      reportId,
      reportedUserId: report.reported_user_id,
      reportedDonationId: report.reported_donation_id,
      notes: notes || null,
    },
  });
  return reportModel.findByIdWithDetails(reportId);
}

/**
 * Resolves a report — a real issue was found and (outside this system,
 * e.g. via the existing ban/unban actions) acted on.
 * @param {number} reportId - Report ID
 * @param {number} adminId - Acting admin's user ID
 * @param {string} [notes] - Admin's reasoning
 * @returns {Promise<Object>} The updated report
 */
async function resolveReport(reportId, adminId, notes) {
  return closeReport(reportId, adminId, REPORT_STATUS.RESOLVED, AUDIT_ACTIONS.REPORT_RESOLVED, notes);
}

/**
 * Dismisses a report — reviewed, no violation found, no action needed.
 * @param {number} reportId - Report ID
 * @param {number} adminId - Acting admin's user ID
 * @param {string} [notes] - Admin's reasoning
 * @returns {Promise<Object>} The updated report
 */
async function dismissReport(reportId, adminId, notes) {
  return closeReport(reportId, adminId, REPORT_STATUS.DISMISSED, AUDIT_ACTIONS.REPORT_DISMISSED, notes);
}

/* ============================================================
 * Admin Notifications (Phase 8)
 * ============================================================ */

const VALID_AUDIENCES = new Set(['all', 'donors', 'volunteers', 'team']);
const AUDIENCE_TO_ROLE = { donors: USER_ROLES.DONOR, volunteers: USER_ROLES.VOLUNTEER, all: null };

/**
 * Sends an admin announcement to a chosen audience — system-wide (all
 * donors + volunteers), donors only, volunteers only, or a single team.
 *
 * Team announcements are NOT reimplemented here — they go straight to
 * the existing notificationService.sendTeamAnnouncement (same
 * 'team_announcement' notification type teams already use for their own
 * leader-to-member announcements). Every other audience goes through the
 * new notificationService.sendAdminAnnouncement, which reuses the same
 * createNotification primitive sendTeamAnnouncement itself is built on —
 * no duplicate notification-creation logic anywhere in this feature.
 * @param {Object} params
 * @param {string} params.audience - 'all' | 'donors' | 'volunteers' | 'team'
 * @param {number} [params.teamId] - Required when audience is 'team'
 * @param {string} params.title - Announcement title (ignored for 'team' — sendTeamAnnouncement uses a fixed title)
 * @param {string} params.message - Announcement body
 * @param {number} adminId - Sending admin's user ID
 * @returns {Promise<Object>} { audience, recipientCount, sent, failed }
 * @throws {AppError} 400 invalid audience/missing teamId/empty message, 404 team not found
 */
async function sendAnnouncement({ audience, teamId, title, message }, adminId) {
  if (!VALID_AUDIENCES.has(audience)) {
    throw new AppError(`audience must be one of: ${Array.from(VALID_AUDIENCES).join(', ')}.`, HTTP_STATUS.BAD_REQUEST);
  }
  if (!message || !message.trim()) {
    throw new AppError('message is required.', HTTP_STATUS.BAD_REQUEST);
  }

  if (audience === 'team') {
    if (!teamId) {
      throw new AppError('teamId is required when audience is "team".', HTTP_STATUS.BAD_REQUEST);
    }
    const team = await adminModel.findTeamById(teamId);
    if (!team) {
      throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
    }

    await notificationService.sendTeamAnnouncement(teamId, adminId, message);
    const members = await teamMemberModel.findByTeamId(teamId);

    await auditService.record({
      userId: adminId,
      action: AUDIT_ACTIONS.ADMIN_ANNOUNCEMENT_SENT,
      metadata: { audience, teamId, recipientCount: members.length },
    });
    return { audience, recipientCount: members.length, sent: members.length, failed: 0 };
  }

  if (!title || !title.trim()) {
    throw new AppError('title is required.', HTTP_STATUS.BAD_REQUEST);
  }

  const userIds = await adminModel.findUserIdsByRole(AUDIENCE_TO_ROLE[audience]);
  const { sent, failed } = await notificationService.sendAdminAnnouncement(userIds, adminId, { title, message });

  await auditService.record({
    userId: adminId,
    action: AUDIT_ACTIONS.ADMIN_ANNOUNCEMENT_SENT,
    metadata: { audience, recipientCount: userIds.length, sent, failed },
  });

  return { audience, recipientCount: userIds.length, sent, failed };
}

/**
 * History of admin-sent system-wide/donor/volunteer announcements, most
 * recent first — the "view notification history/status" requirement.
 * @returns {Promise<Array>} Array of announcement summaries with recipient/read counts
 */
async function listAnnouncementHistory() {
  const rows = await adminModel.findSentAnnouncements(50);
  return rows.map((r) => ({
    ...r,
    recipientCount: toInt(r.recipientCount),
    readCount: toInt(r.readCount),
  }));
}

/* ============================================================
 * Area Intelligence (Phase 9)
 * ============================================================ */

// Below this many donations, an area's stats are too small a sample to
// generate an insight from without being noisy/misleading (e.g. flagging
// a single delayed pickup as "frequent delays"). Areas below this
// threshold still appear in the raw `areas` list, just never in `insights`.
const MIN_SAMPLE_SIZE = 3;

function average(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Extracts every area name a volunteer declared in their profile's
 * service_areas (a JSON array of { division, district, area? } objects —
 * see validators/profile.validator.js). Falls back to `district` when a
 * specific `area` wasn't given, since that's still real, user-declared
 * coverage information, just coarser-grained than the donation-side
 * `saved_addresses.area` it's being compared against.
 * @param {string|null} serviceAreasJson - Raw JSON string from volunteer_profiles
 * @returns {string[]} Area/district names this volunteer covers
 */
function extractServiceAreaNames(serviceAreasJson) {
  if (!serviceAreasJson) return [];
  try {
    const parsed = JSON.parse(serviceAreasJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => entry?.area || entry?.district).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Builds per-area operational metrics (donation demand, volunteer
 * availability, pickup/delivery delays, completion rate) and a list of
 * transparent, rule-based bottleneck insights — e.g. "Mirpur has high
 * donation demand but comparatively low volunteer availability." Every
 * insight is a template filled with real numbers compared against the
 * platform-wide average across areas; there is no ML model and no
 * external API call anywhere in this function.
 * @returns {Promise<Object>} { areas, insights, generatedAt }
 */
async function getAreaIntelligence() {
  const [areaStats, volunteerProfiles] = await Promise.all([
    adminModel.findAreaDonationStats(),
    volunteerProfileModel.findAllWithServiceAreas(),
  ]);

  const areaVolunteers = new Map(); // area name -> Set of volunteer user IDs
  for (const profile of volunteerProfiles) {
    for (const areaName of extractServiceAreaNames(profile.service_areas)) {
      if (!areaVolunteers.has(areaName)) areaVolunteers.set(areaName, new Set());
      areaVolunteers.get(areaName).add(profile.user_id);
    }
  }

  const areas = areaStats.map((row) => {
    const totalDonations = toInt(row.totalDonations);
    const completed = toInt(row.completed);
    const cancelled = toInt(row.cancelled);
    const attempted = completed + cancelled;

    return {
      area: row.area,
      donationDemand: totalDonations,
      volunteerAvailability: areaVolunteers.get(row.area)?.size || 0,
      delayedPickups: toInt(row.delayedPickups),
      delayedDeliveries: toInt(row.delayedDeliveries),
      completionRate: attempted > 0 ? Number(((completed / attempted) * 100).toFixed(1)) : null,
    };
  });

  const avgDemand = average(areas.map((a) => a.donationDemand));
  const avgAvailability = average(areas.map((a) => a.volunteerAvailability));
  const completionRates = areas.map((a) => a.completionRate).filter((r) => r !== null);
  const avgCompletionRate = average(completionRates);

  const insights = [];
  for (const a of areas) {
    if (a.donationDemand < MIN_SAMPLE_SIZE) continue;

    if (a.donationDemand > avgDemand * 1.3 && a.volunteerAvailability < avgAvailability * 0.7) {
      insights.push({
        area: a.area,
        type: 'demand_availability_gap',
        severity: 'high',
        message: `${a.area} has high donation demand but comparatively low volunteer availability.`,
      });
    }
    if (a.delayedPickups / a.donationDemand > 0.3) {
      insights.push({
        area: a.area,
        type: 'pickup_delay',
        severity: 'medium',
        message: `${a.area} has frequent pickup delays (${a.delayedPickups} of ${a.donationDemand} donations overdue for pickup).`,
      });
    }
    if (completionRates.length > 1 && a.completionRate !== null && a.completionRate < avgCompletionRate - 15) {
      insights.push({
        area: a.area,
        type: 'low_completion',
        severity: 'medium',
        message: `${a.area}'s completion rate (${a.completionRate}%) is well below the platform average (${avgCompletionRate.toFixed(1)}%).`,
      });
    }
  }

  return { areas, insights, generatedAt: new Date().toISOString() };
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
  getAttentionCenter,
  getLiveOperations,
  listReports,
  getReportDetail,
  investigateReport,
  resolveReport,
  dismissReport,
  sendAnnouncement,
  listAnnouncementHistory,
  getAreaIntelligence,
  getUserActivity,
};
