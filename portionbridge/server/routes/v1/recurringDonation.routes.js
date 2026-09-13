const express = require('express');
const router = express.Router();

const {
  protect,
  authorize
} = require('../../middleware/auth.middleware');
const validateRequest = require('../../middleware/validateRequest');
const {
  createRecurringDonation,
  getMyRecurringDonations,
  getRecurringDonation,
  updateRecurringDonation,
  deactivateRecurringDonation,
} = require('../../controllers/recurringDonation.controller');
const {
  createRecurringDonationValidationRules,
  updateRecurringDonationValidationRules,
} = require('../../validators/recurringDonation.validator');

// ============================================================================
// RECURRING DONATION ROUTES (Donor only)
// ============================================================================

/**
 * GET /api/v1/recurring-donations
 * Get all recurring donations for the current donor
 */
router.get(
  '/',
  protect,
  authorize('donor'),
  getMyRecurringDonations
);

/**
 * POST /api/v1/recurring-donations
 * Create a new recurring donation schedule
 */
router.post(
  '/',
  protect,
  authorize('donor'),
  createRecurringDonationValidationRules,
  validateRequest,
  createRecurringDonation
);

/**
 * GET /api/v1/recurring-donations/:id
 * Get a recurring donation by ID
 */
router.get(
  '/:id',
  protect,
  authorize('donor'),
  getRecurringDonation
);

/**
 * PATCH /api/v1/recurring-donations/:id
 * Update a recurring donation
 */
router.patch(
  '/:id',
  protect,
  authorize('donor'),
  updateRecurringDonationValidationRules,
  validateRequest,
  updateRecurringDonation
);

/**
 * DELETE /api/v1/recurring-donations/:id
 * Deactivate a recurring donation
 */
router.delete(
  '/:id',
  protect,
  authorize('donor'),
  deactivateRecurringDonation
);

module.exports = router;
