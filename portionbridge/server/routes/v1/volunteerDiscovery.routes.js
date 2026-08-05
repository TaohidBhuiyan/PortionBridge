const express = require('express');
const router = express.Router();

const {
  getNearbyVolunteers,
  getNearbyTeams,
  updateMyLocation,
  updateTeamLocation,
  getVolunteerStats,
  getRecommendedVolunteer,
} = require('../../controllers/volunteerDiscovery.controller');

const {
  nearbyVolunteersValidationRules,
  nearbyTeamsValidationRules,
  updateVolunteerLocationValidationRules,
  updateTeamLocationValidationRules,
  volunteerStatsValidationRules,
} = require('../../validators/volunteerDiscovery.validator');

const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');
const { USER_ROLES } = require('../../constants');

// Public routes (donors can discover volunteers)
router.get(
  '/nearby',
  protect,
  authorize(USER_ROLES.DONOR),
  nearbyVolunteersValidationRules,
  validateRequest,
  getNearbyVolunteers
);

router.get(
  '/nearby-teams',
  protect,
  authorize(USER_ROLES.DONOR),
  nearbyTeamsValidationRules,
  validateRequest,
  getNearbyTeams
);

// Volunteer-only routes
router.put(
  '/my-location',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  updateVolunteerLocationValidationRules,
  validateRequest,
  updateMyLocation
);

// Team leader routes
router.put(
  '/teams/:id/location',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  updateTeamLocationValidationRules,
  validateRequest,
  updateTeamLocation
);

// Public route for volunteer stats
router.get(
  '/volunteer/:id/stats',
  protect,
  authorize(USER_ROLES.DONOR, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN),
  volunteerStatsValidationRules,
  validateRequest,
  getVolunteerStats
);

// Smart recommendation
router.get(
  '/recommend',
  protect,
  authorize(USER_ROLES.DONOR),
  getRecommendedVolunteer
);

module.exports = router;
