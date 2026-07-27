const express = require('express');
const router = express.Router();

const { authenticate } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validation.middleware');
const profileController = require('../../controllers/profile.controller');
const profileValidator = require('../../validators/profile.validator');

// ============================================================
// Common Profile Routes (All authenticated users)
// ============================================================

/**
 * GET /api/v1/profile
 * Get the authenticated user's complete profile
 */
router.get('/', authenticate, profileController.getProfile);

/**
 * PATCH /api/v1/profile
 * Update the authenticated user's profile information
 */
router.patch(
  '/',
  authenticate,
  profileValidator.updateProfileValidationRules,
  validateRequest,
  profileController.updateProfile
);

/**
 * POST /api/v1/profile/change-password
 * Change the authenticated user's password
 */
router.post(
  '/change-password',
  authenticate,
  profileValidator.changePasswordValidationRules,
  validateRequest,
  profileController.changePassword
);

/**
 * POST /api/v1/profile/update-email
 * Update the authenticated user's email address
 */
router.post(
  '/update-email',
  authenticate,
  profileValidator.updateEmailValidationRules,
  validateRequest,
  profileController.updateEmail
);

/**
 * POST /api/v1/profile/update-phone
 * Update the authenticated user's phone number
 */
router.post(
  '/update-phone',
  authenticate,
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
  authenticate,
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
  authenticate,
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
  authenticate,
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
  authenticate,
  profileValidator.getVolunteerStatisticsValidationRules,
  validateRequest,
  profileController.getVolunteerStatistics
);

// ============================================================
// Notification Settings Routes (All authenticated users)
// ============================================================

/**
 * GET /api/v1/profile/notifications
 * Get notification settings
 */
router.get(
  '/notifications',
  authenticate,
  profileController.getNotificationSettings
);

/**
 * PATCH /api/v1/profile/notifications
 * Update notification settings
 */
router.patch(
  '/notifications',
  authenticate,
  profileValidator.updateNotificationSettingsValidationRules,
  validateRequest,
  profileController.updateNotificationSettings
);

module.exports = router;
