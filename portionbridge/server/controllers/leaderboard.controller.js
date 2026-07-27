const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const leaderboardService = require('../services/leaderboard.service');

/**
 * GET /api/v1/leaderboard/donors
 */
const getTopDonors = asyncHandler(async (req, res) => {
  const { donors, meta } = await leaderboardService.getTopDonors(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Top donors retrieved successfully.',
    data: { donors },
    meta,
  });
});

/**
 * GET /api/v1/leaderboard/volunteers
 */
const getTopVolunteers = asyncHandler(async (req, res) => {
  const { volunteers, meta } = await leaderboardService.getTopVolunteers(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Top volunteers retrieved successfully.',
    data: { volunteers },
    meta,
  });
});

module.exports = { getTopDonors, getTopVolunteers };
