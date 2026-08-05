const express = require('express');
const router = express.Router();

const { createRating, getRatingByDonation } = require('../../controllers/rating.controller');
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
