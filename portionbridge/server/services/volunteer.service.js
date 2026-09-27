const { HTTP_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const volunteerModel = require('../models/volunteer.model');
const donationModel = require('../models/donation.model');
const teamMemberModel = require('../models/teamMember.model');
const socketRegistry = require('../sockets/socketRegistry');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

/**
 * Normalizes a value that may arrive from mysql2 as a string/Buffer/null
 * (e.g. SUM() over zero rows) into a plain JS integer.
 * @param {*} value - Raw aggregate value from the database
 * @returns {number} Normalized integer (0 if null/undefined)
 */
function toInt(value) {
  return Number(value) || 0;
}

/**
 * Builds the volunteer dashboard summary.
 *
 * Reuses donationModel.getVolunteerSummary (already powers the existing
 * /donations/assigned-history/summary endpoint) for accepted/scheduled/
 * completed/total, and adds only the two new time-windowed counters via
 * volunteerModel.getUpcomingCounts — no duplicated aggregate SQL.
 * @param {number} volunteerId - ID of the volunteer
 * @returns {Promise<Object>} Dashboard summary object
 */
async function getDashboard(volunteerId) {
  const [summary, upcoming] = await Promise.all([
    donationModel.getVolunteerSummary(volunteerId),
    volunteerModel.getUpcomingCounts(volunteerId),
  ]);

  const accepted = toInt(summary.accepted);
  const scheduled = toInt(summary.scheduled);
  const completed = toInt(summary.completed);
  const totalAssigned = toInt(summary.total);

  const completionRate = totalAssigned > 0
    ? Number(((completed / totalAssigned) * 100).toFixed(2))
    : 0;

  return {
    activeAssignments: accepted + scheduled,
    accepted,
    scheduled,
    completed,
    totalCompleted: completed,
    completionRate,
    upcomingToday: toInt(upcoming.upcomingToday),
    upcomingThisWeek: toInt(upcoming.upcomingThisWeek),
  };
}

/**
 * Lists the volunteer's active assignments (accepted/scheduled), with
 * search/filter/sort/pagination. Pure orchestration — all SQL lives in
 * the model.
 * @param {number} volunteerId - ID of the volunteer
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing assignments array and pagination meta
 */
async function listAssignments(volunteerId, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { status, category, search, sortBy, sortOrder } = query;
  const filters = { volunteerId, status, category, search };

  const [assignments, totalItems] = await Promise.all([
    volunteerModel.findAssignments({ ...filters, sortBy, sortOrder, limit, offset }),
    volunteerModel.countAssignments(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { assignments, meta };
}

/**
 * Lists the volunteer's upcoming (scheduled, future) pickups, with
 * optional today/week narrowing and pagination.
 * @param {number} volunteerId - ID of the volunteer
 * @param {Object} query - Query parameters from request (today/week already booleans)
 * @returns {Promise<Object>} Object containing assignments array and pagination meta
 */
async function getUpcoming(volunteerId, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const today = query.today === true;
  const week = query.week === true;
  const filters = { volunteerId, today, week };

  const [assignments, totalItems] = await Promise.all([
    volunteerModel.findUpcoming({ ...filters, limit, offset }),
    volunteerModel.countUpcoming(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { assignments, meta };
}

/**
 * Gets full assignment detail for the Phase 5 mission map: donor
 * name/phone, real pickup coordinates when available (via saved_addresses),
 * and — for team-mode donations — the team roster with a live online/
 * offline snapshot from the in-memory socket registry (see
 * sockets/socketRegistry.js#isOnline; this is a snapshot at request time,
 * not a push subscription).
 *
 * Authorization now checks assigned_member_id as well as volunteer_id
 * (same two-way check as donation.service.js#assertAssignedVolunteer) —
 * the previous version only checked volunteer_id, which would incorrectly
 * 403 the actual assigned team member on a team-mode donation (they're
 * not volunteer_id, the team leader is).
 * @param {number} volunteerId - ID of the requesting volunteer
 * @param {number} donationId - Donation ID
 * @returns {Promise<Object>} The donation object enriched with donor/pickup/team info
 * @throws {AppError} 404 if not found, 403 if not the assigned volunteer/member
 */
async function getAssignmentDetail(volunteerId, donationId) {
  const donation = await volunteerModel.getAssignmentMapContext(donationId);

  if (!donation) {
    throw new AppError('Donation assignment not found.', HTTP_STATUS.NOT_FOUND);
  }

  const isAssigned = donation.volunteer_id === volunteerId || donation.assigned_member_id === volunteerId;
  if (!isAssigned) {
    throw new AppError('You are not allowed to view this donation assignment.', HTTP_STATUS.FORBIDDEN);
  }

  let team = null;
  if (donation.assignment_mode === 'team' && donation.team_id) {
    const rawMembers = await teamMemberModel.findByTeamId(donation.team_id);
    const members = rawMembers.map((m) => ({
      id: m.user_id,
      name: m.name,
      role: m.role,
      isOnline: socketRegistry.isOnline(m.user_id),
    }));
    team = {
      id: donation.team_id,
      members,
      leader: members.find((m) => m.role === 'leader') || null,
    };
  }

  return { ...donation, team };
}

module.exports = {
  getDashboard,
  listAssignments,
  getUpcoming,
  getAssignmentDetail,
};
