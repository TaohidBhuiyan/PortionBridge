const leaderboardModel = require('../models/leaderboard.model');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

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

  const [donors, totalItems] = await Promise.all([
    leaderboardModel.findTopDonors({ sortBy, sortOrder, limit, offset }),
    leaderboardModel.countTopDonors(),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { donors, meta };
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

  const [volunteers, totalItems] = await Promise.all([
    leaderboardModel.findTopVolunteers({ sortBy, sortOrder, limit, offset }),
    leaderboardModel.countTopVolunteers(),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { volunteers, meta };
}

module.exports = { getTopDonors, getTopVolunteers };
