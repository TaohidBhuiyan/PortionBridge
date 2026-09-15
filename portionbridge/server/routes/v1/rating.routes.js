const express = require('express');
const router = express.Router();

const { createRating, getRatingByDonation, getPendingReminders } = require('../../controllers/rating.controller');
const { createRatingValidationRules, getRatingValidationRules } = require('../../validators/rating.validator');
const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');

// Only donors can submit ratings.
router.post(
  '/',
  protect,
  authorize('donor'),
  createRatingValidationRules,
  validateRequest,
  createRating
);

// Donor-only — completed donations they haven't rated yet. Registered
// before /:donationId (same "specific route before param route" pattern
// used elsewhere in this codebase, e.g. donation.routes.js) even though
// the two don't actually collide here (/:donationId is single-segment,
// this is two), just to keep the ordering convention consistent.
router.get(
  '/pending/reminders',
  protect,
  authorize('donor'),
  getPendingReminders
);

// Either participant (donor or assigned volunteer) can view a donation's
// rating — ownership is enforced inside ratingService.getRatingByDonation,
// so no role restriction here beyond being authenticated.
router.get(
  '/:donationId',
  protect,
  getRatingValidationRules,
  validateRequest,
  getRatingByDonation
);

module.exports = router;
