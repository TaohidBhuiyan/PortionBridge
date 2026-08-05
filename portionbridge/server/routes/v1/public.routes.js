const express = require('express');
const router = express.Router();

const {
  getPublicStats,
  getPublicDonorLeaderboard,
  getPublicVolunteerLeaderboard,
  getPublicReviews,
  getRatingsSummary,
  getActivityFeed,
  getPublicZones,
  getPublicZoneDetails,
  getPublicVolunteerProfile,
  getVolunteerReviews,
} = require('../../controllers/public.controller');

const validateRequest = require('../../middleware/validateRequest');

/**
 * Public API routes - no authentication required
 * These endpoints are accessible to anyone for the landing page
 */

// Public statistics
router.get('/stats', getPublicStats);

// Public leaderboards
router.get('/leaderboard/donors', getPublicDonorLeaderboard);
router.get('/leaderboard/volunteers', getPublicVolunteerLeaderboard);

// Public reviews
router.get('/reviews', getPublicReviews);
router.get('/ratings/summary', getRatingsSummary);

// Public activity feed
router.get('/activity-feed', getActivityFeed);

// Public zones
router.get('/zones', getPublicZones);
router.get('/zones/:id', getPublicZoneDetails);

// Public volunteer profile
router.get('/volunteers/:id', getPublicVolunteerProfile);
router.get('/volunteers/:id/reviews', getVolunteerReviews);

module.exports = router;
