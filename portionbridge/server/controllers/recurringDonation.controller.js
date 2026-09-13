const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants');
const recurringDonationService = require('../services/recurringDonation.service');

/**
 * POST /api/v1/recurring-donations
 * Create a new recurring donation schedule
 */
const createRecurringDonation = asyncHandler(async (req, res) => {
  const recurring = await recurringDonationService.createRecurringDonation(
    req.user.id,
    req.body
  );

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Recurring donation schedule created successfully.',
    data: { recurring },
  });
});

/**
 * GET /api/v1/recurring-donations
 * Get all recurring donations for the current donor
 */
const getMyRecurringDonations = asyncHandler(async (req, res) => {
  const { active } = req.query;
  const activeOnly = active === 'true';

  const recurring = await recurringDonationService.getDonorRecurringDonations(
    req.user.id,
    activeOnly
  );

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Recurring donations retrieved successfully.',
    data: { recurring },
  });
});

/**
 * GET /api/v1/recurring-donations/:id
 * Get a recurring donation by ID
 */
const getRecurringDonation = asyncHandler(async (req, res) => {
  const recurring = await recurringDonationService.getRecurringDonationById(
    req.params.id,
    req.user.id
  );

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Recurring donation retrieved successfully.',
    data: { recurring },
  });
});

/**
 * PATCH /api/v1/recurring-donations/:id
 * Update a recurring donation
 */
const updateRecurringDonation = asyncHandler(async (req, res) => {
  const recurring = await recurringDonationService.updateRecurringDonation(
    req.params.id,
    req.user.id,
    req.body
  );

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Recurring donation updated successfully.',
    data: { recurring },
  });
});

/**
 * DELETE /api/v1/recurring-donations/:id
 * Deactivate a recurring donation
 */
const deactivateRecurringDonation = asyncHandler(async (req, res) => {
  await recurringDonationService.deactivateRecurringDonation(
    req.params.id,
    req.user.id
  );

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Recurring donation deactivated successfully.',
    data: null,
  });
});

module.exports = {
  createRecurringDonation,
  getMyRecurringDonations,
  getRecurringDonation,
  updateRecurringDonation,
  deactivateRecurringDonation,
};
