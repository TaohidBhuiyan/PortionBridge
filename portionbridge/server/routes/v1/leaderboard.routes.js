const express = require('express');
const router = express.Router();

const { getTopDonors, getTopVolunteers } = require('../../controllers/leaderboard.controller');
const {
  getTopDonorsValidationRules,
  getTopVolunteersValidationRules,
} = require('../../validators/leaderboard.validator');
const validateRequest = require('../../middleware/validateRequest');
const { protect } = require('../../middleware/auth.middleware');

// Read-only, frontend-safe aggregate data (name, profile photo, counts,
// average rating) — no email/phone/address. Available to any authenticated
// user regardless of role, same as the rest of the API requiring `protect`
// but with no further role restriction, since the leaderboard isn't
// role-specific data.
router.get('/donors', protect, getTopDonorsValidationRules, validateRequest, getTopDonors);
router.get('/volunteers', protect, getTopVolunteersValidationRules, validateRequest, getTopVolunteers);

module.exports = router;
