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

module.exports = router;
