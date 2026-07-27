const { HTTP_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const volunteerModel = require('../models/volunteer.model');
const donationModel = require('../models/donation.model');
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
 * Gets full details for a single assignment, verifying the requesting
 * volunteer owns it. Reuses donationModel.findById — no new SQL — and
 * layers the ownership check in the service so a 404 (doesn't exist /
 * soft-deleted) is always distinguishable from a 403 (exists, but isn't
 * this volunteer's assignment).
 * @param {number} volunteerId - ID of the requesting volunteer
 * @param {number} donationId - Donation ID to look up
 * @returns {Promise<Object>} The donation object
 * @throws {AppError} 404 if not found, 403 if not owned by this volunteer
 */
async function getAssignmentDetail(volunteerId, donationId) {
  const donation = await donationModel.findById(donationId);

  if (!donation) {
    throw new AppError('Donation assignment not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (donation.volunteer_id !== volunteerId) {
    throw new AppError('You are not allowed to view this donation assignment.', HTTP_STATUS.FORBIDDEN);
  }

  return donation;
}

module.exports = {
  getDashboard,
  listAssignments,
  getUpcoming,
  getAssignmentDetail,
};
