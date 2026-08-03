const express = require('express');
const router = express.Router();

const { protect } = require('../../middleware/auth.middleware');
const validateRequest = require('../../middleware/validateRequest');
const profileController = require('../../controllers/profile.controller');
const profileValidator = require('../../validators/profile.validator');

// ============================================================
// Common Profile Routes (All protectd users)
// ============================================================

/**
 * GET /api/v1/profile
 * Get the protectd user's complete profile
 */
router.get('/', protect, profileController.getProfile);

/**
 * PATCH /api/v1/profile
 * Update the protectd user's profile information
 */
router.patch(
  '/',
  protect,
  profileValidator.updateProfileValidationRules,
  validateRequest,
  profileController.updateProfile
);

/**
 * POST /api/v1/profile/change-password
 * Change the protectd user's password
 */
router.post(
  '/change-password',
  protect,
  profileValidator.changePasswordValidationRules,
  validateRequest,
  profileController.changePassword
);

/**
 * POST /api/v1/profile/update-email
 * Update the protectd user's email address
 */
router.post(
  '/update-email',
  protect,
  profileValidator.updateEmailValidationRules,
  validateRequest,
  profileController.updateEmail
);

/**
 * POST /api/v1/profile/update-phone
 * Update the protectd user's phone number
 */
router.post(
  '/update-phone',
  protect,
  profileValidator.updatePhoneValidationRules,
  validateRequest,
  profileController.updatePhone
);

// ============================================================
// Donor-Specific Routes
// ============================================================

/**
 * PATCH /api/v1/profile/preferences
 * Update donor preferences
 */
router.patch(
  '/preferences',
  protect,
  profileValidator.updatePreferencesValidationRules,
  validateRequest,
  profileController.updatePreferences
);

/**
 * GET /api/v1/profile/donor/statistics
 * Get donor statistics
 */
router.get(
  '/donor/statistics',
  protect,
  profileValidator.getDonationStatisticsValidationRules,
  validateRequest,
  profileController.getDonationStatistics
);

// ============================================================
// Volunteer-Specific Routes
// ============================================================

/**
 * PATCH /api/v1/profile/volunteer
 * Update volunteer profile information
 */
router.patch(
  '/volunteer',
  protect,
  profileValidator.updateVolunteerProfileValidationRules,
  validateRequest,
  profileController.updateVolunteerProfile
);

/**
 * GET /api/v1/profile/volunteer/statistics
 * Get volunteer statistics
 */
router.get(
  '/volunteer/statistics',
  protect,
  profileValidator.getVolunteerStatisticsValidationRules,
  validateRequest,
  profileController.getVolunteerStatistics
);

// ============================================================
// Notification Settings Routes (All protectd users)
// ============================================================

/**
 * GET /api/v1/profile/notifications
 * Get notification settings
 */
router.get(
  '/notifications',
  protect,
  profileController.getNotificationSettings
);

/**
 * PATCH /api/v1/profile/notifications
 * Update notification settings
 */
router.patch(
  '/notifications',
  protect,
  profileValidator.updateNotificationSettingsValidationRules,
  validateRequest,
  profileController.updateNotificationSettings
);

module.exports = router;
