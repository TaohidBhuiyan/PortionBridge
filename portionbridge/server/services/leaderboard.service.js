const leaderboardModel = require('../models/leaderboard.model');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

const POINTS_PER_COMPLETED_DONATION = 50;

/**
 * Maps a raw top_donors view row (user_id, donor_name, completed_count...)
 * to the shape the frontend actually consumes. Also computes `points` —
 * the donor dashboard has always advertised "+50 impact points per
 * completed donation," but nothing ever calculated that value server-side,
 * so every donor's points silently rendered as 0.
 * @param {Object} row - Raw row from leaderboardModel.findTopDonors
 * @returns {Object} Frontend-shaped donor leaderboard entry
 */
function mapDonorRow(row) {
  return {
    id: row.user_id,
    name: row.donor_name,
    photo: row.profile_photo,
    donationsCount: row.completed_count,
    totalDonations: row.total_donations,
    totalQuantityDonated: row.total_quantity_donated,
    averageRating: row.average_rating,
    points: row.completed_count * POINTS_PER_COMPLETED_DONATION,
  };
}

/**
 * Maps a raw top_volunteers view row to the frontend-facing shape, mirroring
 * mapDonorRow above for the same reasons.
 * @param {Object} row - Raw row from leaderboardModel.findTopVolunteers
 * @returns {Object} Frontend-shaped volunteer leaderboard entry
 */
function mapVolunteerRow(row) {
  return {
    id: row.user_id,
    name: row.volunteer_name,
    photo: row.profile_photo,
    completedCount: row.completed_count,
    totalPickups: row.total_pickups,
    averageRating: row.average_rating,
    points: row.completed_count * POINTS_PER_COMPLETED_DONATION,
  };
}

/**
 * Top donors leaderboard, sorted/paginated. All ranking logic lives in the
 * top_donors DB view — this is pure orchestration, same shape as
 * donationService.browseDonations.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing donors array and pagination meta
 */
async function getTopDonors(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { sortBy, sortOrder } = query;

  const [rows, totalItems] = await Promise.all([
    leaderboardModel.findTopDonors({ sortBy, sortOrder, limit, offset }),
    leaderboardModel.countTopDonors(),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { donors: rows.map(mapDonorRow), meta };
}

/**
 * Top volunteers leaderboard, sorted/paginated. All ranking logic lives in
 * the top_volunteers DB view.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing volunteers array and pagination meta
 */
async function getTopVolunteers(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { sortBy, sortOrder } = query;

  const [rows, totalItems] = await Promise.all([
    leaderboardModel.findTopVolunteers({ sortBy, sortOrder, limit, offset }),
    leaderboardModel.countTopVolunteers(),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { volunteers: rows.map(mapVolunteerRow), meta };
}

module.exports = { getTopDonors, getTopVolunteers };
