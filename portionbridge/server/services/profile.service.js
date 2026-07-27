const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/password');
const { USER_ROLES, DONATION_STATUS, DONATION_CATEGORY, AUTH, HTTP_STATUS } = require('../constants');

const userModel = require('../models/user.model');
const userPreferencesModel = require('../models/userPreferences.model');
const notificationSettingsModel = require('../models/notificationSettings.model');
const volunteerProfileModel = require('../models/volunteerProfile.model');
const donationModel = require('../models/donation.model');
const ratingModel = require('../models/rating.model');
const passwordHistoryModel = require('../models/passwordHistory.model');
const refreshTokenModel = require('../models/refreshToken.model');

const auditService = require('./audit.service');

/**
 * Core profile management business logic. Controllers stay thin — they parse
 * the request, call one of these functions, and format the response.
 */

// ============================================================
// Common Profile Operations
// ============================================================

/**
 * Gets a complete profile for a user including all related data.
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Complete user profile
 */
async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Get role-specific data
  let preferences = null;
  let volunteerProfile = null;
  let notificationSettings = null;

  if (user.role === USER_ROLES.DONOR) {
    preferences = await userPreferencesModel.findByUserId(userId);
  } else if (user.role === USER_ROLES.VOLUNTEER) {
    volunteerProfile = await volunteerProfileModel.findByUserId(userId);
  }

  // All users can have notification settings
  notificationSettings = await notificationSettingsModel.findByUserId(userId);

  return {
    user,
    preferences,
    volunteerProfile,
    notificationSettings,
  };
}

/**
 * Updates a user's profile information.
 * @param {number} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated user
 */
async function updateProfile(userId, profileData) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  await userModel.updateProfile(userId, profileData);

  const updatedUser = await userModel.findById(userId);
  return updatedUser;
}

/**
 * Changes a user's password.
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {Object} metadata - Audit metadata
 * @returns {Promise<void>}
 */
async function changePassword(userId, currentPassword, newPassword, { ipAddress, userAgent }) {
  const user = await userModel.findById(userId);
  
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Need to get the user with password hash - we'll need to add this to user model
  // For now, we'll use a workaround by getting the user via email
  const userWithPassword = await userModel.findByEmail(user.email);
  
  if (!userWithPassword) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const passwordMatches = await comparePassword(currentPassword, userWithPassword.password);
  if (!passwordMatches) {
    throw new AppError('Current password is incorrect.', HTTP_STATUS.UNAUTHORIZED);
  }

  // Check password reuse
  const recentHashes = await passwordHistoryModel.getRecentPasswordHashes(userId, AUTH.PASSWORD_HISTORY_LIMIT);
  for (const historyRow of recentHashes) {
    const matchesOldPassword = await comparePassword(newPassword, historyRow.password_hash);
    if (matchesOldPassword) {
      throw new AppError(
        `You cannot reuse any of your last ${AUTH.PASSWORD_HISTORY_LIMIT} passwords. Please choose a different password.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  const hashedPassword = await hashPassword(newPassword);

  await userModel.updatePassword(userId, hashedPassword);
  await passwordHistoryModel.addPasswordToHistory(userId, hashedPassword);
  await passwordHistoryModel.pruneOldHistory(userId, AUTH.PASSWORD_HISTORY_LIMIT);

  // Force re-login on every device after password change
  await refreshTokenModel.revokeAllForUser(userId);

  await auditService.record({
    userId,
    action: AUDIT_ACTIONS.PASSWORD_RESET_SUCCESS,
    ipAddress,
    userAgent,
    metadata: { reason: 'user_initiated' },
  });
}

/**
 * Updates a user's email address.
 * @param {number} userId - User ID
 * @param {string} newEmail - New email address
 * @param {string} password - Current password for verification
 * @param {Object} metadata - Audit metadata
 * @returns {Promise<void>}
 */
async function updateEmail(userId, newEmail, password, { ipAddress, userAgent }) {
  const user = await userModel.findById(userId);
  
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const userWithPassword = await userModel.findByEmail(user.email);
  
  if (!userWithPassword) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const passwordMatches = await comparePassword(password, userWithPassword.password);
  if (!passwordMatches) {
    throw new AppError('Current password is incorrect.', HTTP_STATUS.UNAUTHORIZED);
  }

  // Check if email is already taken by another user
  const existingUser = await userModel.findByEmail(newEmail);
  if (existingUser && existingUser.id !== userId) {
    throw new AppError('This email is already in use by another account.', HTTP_STATUS.CONFLICT);
  }

  await userModel.updateEmail(userId, newEmail);

  await auditService.record({
    userId,
    action: AUDIT_ACTIONS.EMAIL_VERIFICATION_RESENT,
    ipAddress,
    userAgent,
    metadata: { reason: 'email_changed', oldEmail: user.email, newEmail },
  });
}

/**
 * Updates a user's phone number.
 * @param {number} userId - User ID
 * @param {string} newPhone - New phone number
 * @param {string} password - Current password for verification
 * @param {Object} metadata - Audit metadata
 * @returns {Promise<void>}
 */
async function updatePhone(userId, newPhone, password, { ipAddress, userAgent }) {
  const user = await userModel.findById(userId);
  
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const userWithPassword = await userModel.findByEmail(user.email);
  
  if (!userWithPassword) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const passwordMatches = await comparePassword(password, userWithPassword.password);
  if (!passwordMatches) {
    throw new AppError('Current password is incorrect.', HTTP_STATUS.UNAUTHORIZED);
  }

  await userModel.updatePhone(userId, newPhone);

  await auditService.record({
    userId,
    action: AUDIT_ACTIONS.EMAIL_VERIFICATION_RESENT,
    ipAddress,
    userAgent,
    metadata: { reason: 'phone_changed', oldPhone: user.phone, newPhone },
  });
}

// ============================================================
// Donor Preferences
// ============================================================

/**
 * Updates donor preferences.
 * @param {number} userId - User ID
 * @param {Object} preferences - Preference data
 * @returns {Promise<Object>} Updated preferences
 */
async function updatePreferences(userId, preferences) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (user.role !== USER_ROLES.DONOR) {
    throw new AppError('Only donors can have preferences.', HTTP_STATUS.FORBIDDEN);
  }

  await userPreferencesModel.upsert({ userId, ...preferences });

  const updatedPreferences = await userPreferencesModel.findByUserId(userId);
  return updatedPreferences;
}

/**
 * Gets donor statistics dynamically from donation data.
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Donor statistics
 */
async function getDonationStatistics(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (user.role !== USER_ROLES.DONOR) {
    throw new AppError('Only donors can have donation statistics.', HTTP_STATUS.FORBIDDEN);
  }

  // Get all donations for the donor
  const donations = await donationModel.findByDonorId(userId);

  // Calculate statistics dynamically
  const statistics = {
    totalDonations: donations.length,
    foodDonations: donations.filter(d => d.category === DONATION_CATEGORY.FOOD).length,
    clothingDonations: donations.filter(d => d.category === DONATION_CATEGORY.CLOTHES).length,
    completedDonations: donations.filter(d => d.status === DONATION_STATUS.COMPLETED).length,
    pendingDonations: donations.filter(d => d.status === DONATION_STATUS.PENDING).length,
    cancelledDonations: donations.filter(d => d.is_deleted === 1).length,
    totalSuccessfulPickups: donations.filter(d => d.status === DONATION_STATUS.COMPLETED && d.is_deleted === 0).length,
  };

  return statistics;
}

// ============================================================
// Volunteer Profile Operations
// ============================================================

/**
 * Updates volunteer profile information.
 * @param {number} userId - User ID
 * @param {Object} profileData - Volunteer profile data
 * @returns {Promise<Object>} Updated volunteer profile
 */
async function updateVolunteerProfile(userId, profileData) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (user.role !== USER_ROLES.VOLUNTEER) {
    throw new AppError('Only volunteers can have volunteer profiles.', HTTP_STATUS.FORBIDDEN);
  }

  await volunteerProfileModel.upsert({ userId, ...profileData });

  const updatedProfile = await volunteerProfileModel.findByUserId(userId);
  return updatedProfile;
}

/**
 * Gets volunteer statistics dynamically from donation and rating data.
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Volunteer statistics
 */
async function getVolunteerStatistics(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (user.role !== USER_ROLES.VOLUNTEER) {
    throw new AppError('Only volunteers can have volunteer statistics.', HTTP_STATUS.FORBIDDEN);
  }

  // Get all donations assigned to this volunteer
  const donations = await donationModel.findByVolunteerId(userId);

  // Get ratings for this volunteer
  const ratings = await ratingModel.findByRatedUserId(userId);

  // Calculate statistics dynamically
  const acceptedDonations = donations.filter(d => d.status === DONATION_STATUS.ACCEPTED || d.status === DONATION_STATUS.SCHEDULED).length;
  const completedPickups = donations.filter(d => d.status === DONATION_STATUS.COMPLETED && d.is_deleted === 0).length;
  const cancelledPickups = donations.filter(d => d.is_deleted === 1).length;

  const totalRatings = ratings.length;
  const averageRating = totalRatings > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
    : 0;

  const totalAssignments = donations.length;
  const completionRate = totalAssignments > 0 
    ? (completedPickups / totalAssignments) * 100 
    : 0;

  return {
    acceptedDonations,
    completedPickups,
    cancelledPickups,
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalRatings,
    completionRate: parseFloat(completionRate.toFixed(2)),
  };
}

// ============================================================
// Notification Settings
// ============================================================

/**
 * Updates notification settings for a user.
 * @param {number} userId - User ID
 * @param {Object} settings - Notification settings
 * @returns {Promise<Object>} Updated notification settings
 */
async function updateNotificationSettings(userId, settings) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  await notificationSettingsModel.upsert({ userId, ...settings });

  const updatedSettings = await notificationSettingsModel.findByUserId(userId);
  return updatedSettings;
}

/**
 * Gets notification settings for a user.
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Notification settings
 */
async function getNotificationSettings(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  let settings = await notificationSettingsModel.findByUserId(userId);

  // Return default settings if none exist
  if (!settings) {
    settings = {
      email_notifications: 1,
      sms_notifications: 0,
      push_notifications: 1,
      donation_updates: 1,
      pickup_updates: 1,
      chat_notifications: 1,
    };
  }

  return settings;
}

module.exports = {
  // Common profile operations
  getProfile,
  updateProfile,
  changePassword,
  updateEmail,
  updatePhone,

  // Donor operations
  updatePreferences,
  getDonationStatistics,

  // Volunteer operations
  updateVolunteerProfile,
  getVolunteerStatistics,

  // Notification settings
  updateNotificationSettings,
  getNotificationSettings,
};
