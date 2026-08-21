const express = require('express');
const router = express.Router();

const {
  getDashboard,
  listUsers,
  getUser,
  disableUser,
  enableUser,
  getUserActivity,
  listDonations,
  getDonation,
  getDonationHistory,
  listVolunteers,
  getVolunteer,
  listTeams,
  getTeam,
  getLiveOperations,
  getAttentionCenter,
  listReports,
  getReport,
  investigateReport,
  resolveReport,
  dismissReport,
  sendAnnouncement,
  listAnnouncementHistory,
  getAreaIntelligence,
} = require('../../controllers/admin.controller');

const {
  dashboardValidationRules,
  listUsersValidationRules,
  getUserValidationRules,
  disableUserValidationRules,
  enableUserValidationRules,
  getUserActivityValidationRules,
  listDonationsValidationRules,
  getDonationValidationRules,
  getDonationHistoryValidationRules,
  listVolunteersValidationRules,
  getVolunteerValidationRules,
  listTeamsValidationRules,
  getTeamValidationRules,
  liveOperationsValidationRules,
  attentionCenterValidationRules,
  listReportsValidationRules,
  getReportValidationRules,
  reportModerationNotesValidationRules,
  sendAnnouncementValidationRules,
  areaIntelligenceValidationRules,
} = require('../../validators/admin.validator');

const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');

// Every route in this file is admin-only. Applied per-route (rather than
// router.use()) to stay consistent with donation.routes.js / volunteer.routes.js,
// where authorize() is always paired inline with its route.

router.get(
  '/dashboard',
  protect,
  authorize('admin'),
  dashboardValidationRules,
  validateRequest,
  getDashboard
);

// --- User management ---
router.get(
  '/users',
  protect,
  authorize('admin'),
  listUsersValidationRules,
  validateRequest,
  listUsers
);

router.get(
  '/users/:id/activity',
  protect,
  authorize('admin'),
  getUserActivityValidationRules,
  validateRequest,
  getUserActivity
);

router.patch(
  '/users/:id/disable',
  protect,
  authorize('admin'),
  disableUserValidationRules,
  validateRequest,
  disableUser
);

router.patch(
  '/users/:id/enable',
  protect,
  authorize('admin'),
  enableUserValidationRules,
  validateRequest,
  enableUser
);

router.get(
  '/users/:id',
  protect,
  authorize('admin'),
  getUserValidationRules,
  validateRequest,
  getUser
);

// --- Donation oversight ---
router.get(
  '/donations',
  protect,
  authorize('admin'),
  listDonationsValidationRules,
  validateRequest,
  listDonations
);

router.get(
  '/donations/:id/history',
  protect,
  authorize('admin'),
  getDonationHistoryValidationRules,
  validateRequest,
  getDonationHistory
);

router.get(
  '/donations/:id',
  protect,
  authorize('admin'),
  getDonationValidationRules,
  validateRequest,
  getDonation
);

// --- Volunteer monitoring ---
router.get(
  '/volunteers',
  protect,
  authorize('admin'),
  listVolunteersValidationRules,
  validateRequest,
  listVolunteers
);

router.get(
  '/volunteers/:id',
  protect,
  authorize('admin'),
  getVolunteerValidationRules,
  validateRequest,
  getVolunteer
);

// --- Team monitoring (Phase 4) ---
router.get(
  '/teams',
  protect,
  authorize('admin'),
  listTeamsValidationRules,
  validateRequest,
  listTeams
);

router.get(
  '/teams/:id',
  protect,
  authorize('admin'),
  getTeamValidationRules,
  validateRequest,
  getTeam
);

// --- Live operations (Phase 6) ---
router.get(
  '/live-operations',
  protect,
  authorize('admin'),
  liveOperationsValidationRules,
  validateRequest,
  getLiveOperations
);

// --- Attention Center (Phase 7) ---
router.get(
  '/attention-center',
  protect,
  authorize('admin'),
  attentionCenterValidationRules,
  validateRequest,
  getAttentionCenter
);

// --- Reports & Moderation (Phase 8) ---
router.get(
  '/reports',
  protect,
  authorize('admin'),
  listReportsValidationRules,
  validateRequest,
  listReports
);

router.get(
  '/reports/:id',
  protect,
  authorize('admin'),
  getReportValidationRules,
  validateRequest,
  getReport
);

router.patch(
  '/reports/:id/investigate',
  protect,
  authorize('admin'),
  getReportValidationRules,
  validateRequest,
  investigateReport
);

router.patch(
  '/reports/:id/resolve',
  protect,
  authorize('admin'),
  reportModerationNotesValidationRules,
  validateRequest,
  resolveReport
);

router.patch(
  '/reports/:id/dismiss',
  protect,
  authorize('admin'),
  reportModerationNotesValidationRules,
  validateRequest,
  dismissReport
);

// --- Admin Notifications (Phase 8) ---
router.post(
  '/announcements',
  protect,
  authorize('admin'),
  sendAnnouncementValidationRules,
  validateRequest,
  sendAnnouncement
);

router.get(
  '/announcements',
  protect,
  authorize('admin'),
  listAnnouncementHistory
);

// --- Area Intelligence (Phase 9) ---
router.get(
  '/area-intelligence',
  protect,
  authorize('admin'),
  areaIntelligenceValidationRules,
  validateRequest,
  getAreaIntelligence
);

module.exports = router;
