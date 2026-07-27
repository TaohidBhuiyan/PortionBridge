const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getClientIp, getUserAgent } = require('../utils/helpers');
const ratingService = require('../services/rating.service');

/**
 * POST /api/v1/ratings
 */
const createRating = asyncHandler(async (req, res) => {
  const { donationId, rating, comment } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const createdRating = await ratingService.createRating(req.user.id, {
    donationId,
    stars: rating,
    comment,
    ipAddress,
    userAgent,
  });

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Rating submitted successfully.',
    data: { rating: createdRating },
  });
});

/**
 * GET /api/v1/ratings/:donationId
 */
const getRatingByDonation = asyncHandler(async (req, res) => {
  const rating = await ratingService.getRatingByDonation(req.params.donationId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Rating retrieved successfully.',
    data: { rating },
  });
});

module.exports = { createRating, getRatingByDonation };
