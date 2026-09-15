const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sanitizeUser, getClientIp, getUserAgent } = require('../utils/helpers');
const profileService = require('../services/profile.service');

/**
 * Profile Controller
 * Handles all profile management operations for Donors, Volunteers, and Admins.
 */

// ============================================================
// Common Profile Operations
// ============================================================

/**
 * GET /api/v1/profile
 * Get the authenticated user's complete profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Profile retrieved successfully.',
    data: {
      user: sanitizeUser(profile.user),
      preferences: profile.preferences,
      volunteerProfile: profile.volunteerProfile,
      notificationSettings: profile.notificationSettings,
    },
  });
});

/**
 * PATCH /api/v1/profile
 * Update the authenticated user's profile information
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, dateOfBirth, gender, showOnLeaderboard } = req.body;

  const updatedUser = await profileService.updateProfile(req.user.id, {
    name,
    phone,
    address,
    dateOfBirth,
    gender,
    showOnLeaderboard,
  });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Profile updated successfully.',
    data: { user: sanitizeUser(updatedUser) },
  });
});

/**
 * POST /api/v1/profile/change-password
 * Change the authenticated user's password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  await profileService.changePassword(req.user.id, currentPassword, newPassword, { ipAddress, userAgent });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Password changed successfully. Please log in again with your new password.',
  });
});

/**
 * POST /api/v1/profile/update-email
 * Update the authenticated user's email address
 */
const updateEmail = asyncHandler(async (req, res) => {
  const { newEmail, password } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  await profileService.updateEmail(req.user.id, newEmail, password, { ipAddress, userAgent });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Email updated successfully. Please verify your new email address.',
  });
});

/**
 * POST /api/v1/profile/update-phone
 * Update the authenticated user's phone number
 */
const updatePhone = asyncHandler(async (req, res) => {
  const { newPhone, password } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  await profileService.updatePhone(req.user.id, newPhone, password, { ipAddress, userAgent });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Phone number updated successfully.',
  });
});

/**
 * POST /api/v1/profile/switch-role
 * Switch user role between donor and volunteer (self-service)
 */
const switchRole = asyncHandler(async (req, res) => {
  const { newRole } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const updatedUser = await profileService.switchRole(req.user.id, newRole, { ipAddress, userAgent });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: `Role switched to ${newRole} successfully. Please log in again.`,
    data: { user: sanitizeUser(updatedUser) },
  });
});

// ============================================================
// Donor-Specific Operations
// ============================================================

/**
 * PATCH /api/v1/profile/preferences
 * Update donor preferences
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const { preferredPickupTimeSlot, preferredContactMethod } = req.body;

  const updatedPreferences = await profileService.updatePreferences(req.user.id, {
    preferredPickupTimeSlot,
    preferredContactMethod,
  });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Preferences updated successfully.',
    data: { preferences: updatedPreferences },
  });
});

/**
 * GET /api/v1/profile/donor/statistics
 * Get donor statistics
 */
const getDonationStatistics = asyncHandler(async (req, res) => {
  const { timeRange } = req.query;
  const statistics = await profileService.getDonationStatistics(req.user.id, { timeRange });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation statistics retrieved successfully.',
    data: { statistics },
  });
});

// ============================================================
// Volunteer-Specific Operations
// ============================================================

/**
 * PATCH /api/v1/profile/volunteer
 * Update volunteer profile information
 */
const updateVolunteerProfile = asyncHandler(async (req, res) => {
  const { vehicleType, availability, serviceAreas } = req.body;

  const updatedProfile = await profileService.updateVolunteerProfile(req.user.id, {
    vehicleType,
    availability,
    serviceAreas,
  });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Volunteer profile updated successfully.',
    data: { volunteerProfile: updatedProfile },
  });
});

/**
 * PATCH /api/v1/profile/volunteer/location
 * Set/update the volunteer's own base location — the self-service
 * "set my address" step, separate from updateVolunteerProfile (vehicle/
 * availability/service areas) above so this never touches those fields.
 */
const updateVolunteerLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, coverageRadius, baseAddress } = req.body;

  const updatedProfile = await profileService.updateVolunteerLocation(req.user.id, {
    latitude,
    longitude,
    coverageRadius,
    baseAddress,
  });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Volunteer location updated successfully.',
    data: { volunteerProfile: updatedProfile },
  });
});

/**
 * GET /api/v1/profile/volunteer/statistics
 * Get volunteer statistics
 */
const getVolunteerStatistics = asyncHandler(async (req, res) => {
  const statistics = await profileService.getVolunteerStatistics(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Volunteer statistics retrieved successfully.',
    data: { statistics },
  });
});

// ============================================================
// Notification Settings
// ============================================================

/**
 * GET /api/v1/profile/notifications
 * Get notification settings
 */
const getNotificationSettings = asyncHandler(async (req, res) => {
  const settings = await profileService.getNotificationSettings(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Notification settings retrieved successfully.',
    data: { notificationSettings: settings },
  });
});

/**
 * PATCH /api/v1/profile/notifications
 * Update notification settings
 */
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const {
    emailNotifications,
    smsNotifications,
    pushNotifications,
    donationUpdates,
    pickupUpdates,
    chatNotifications,
  } = req.body;

  const updatedSettings = await profileService.updateNotificationSettings(req.user.id, {
    emailNotifications,
    smsNotifications,
    pushNotifications,
    donationUpdates,
    pickupUpdates,
    chatNotifications,
  });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Notification settings updated successfully.',
    data: { notificationSettings: updatedSettings },
  });
});

module.exports = {
  // Common profile operations
  getProfile,
  updateProfile,
  changePassword,
  updateEmail,
  updatePhone,
  switchRole,

  // Donor operations
  updatePreferences,
  getDonationStatistics,

  // Volunteer operations
  updateVolunteerProfile,
  updateVolunteerLocation,
  getVolunteerStatistics,

  // Notification settings
  getNotificationSettings,
  updateNotificationSettings,
};
