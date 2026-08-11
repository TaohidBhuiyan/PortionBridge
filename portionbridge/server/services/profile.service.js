const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/password');
const { USER_ROLES, DONATION_STATUS, DONATION_CATEGORY, AUTH, HTTP_STATUS, AUDIT_ACTIONS } = require('../constants');

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
 * @param {Object} options - Query options
 * @param {string} [options.timeRange] - Time range filter (this_month, last_3_months, last_6_months, all_time)
 * @returns {Promise<Object>} Donor statistics
 */
async function getDonationStatistics(userId, options = {}) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (user.role !== USER_ROLES.DONOR) {
    throw new AppError('Only donors can have donation statistics.', HTTP_STATUS.FORBIDDEN);
  }

  // Get all donations for the donor
  const donations = await donationModel.findByDonorId(userId);

  // Filter by time range if specified
  let filteredDonations = donations;
  if (options.timeRange && options.timeRange !== 'all_time') {
    const now = new Date();
    const cutoffDate = new Date();

    switch (options.timeRange) {
      case 'this_month':
        cutoffDate.setDate(1); // First day of current month
        break;
      case 'last_3_months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'last_6_months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      default:
        break;
    }

    filteredDonations = donations.filter(d => new Date(d.created_at) >= cutoffDate);
  }

  // Calculate statistics dynamically
  const totalDonations = filteredDonations.length;
  const foodDonations = filteredDonations.filter(d => d.category === DONATION_CATEGORY.FOOD).length;
  const clothingDonations = filteredDonations.filter(d => d.category === DONATION_CATEGORY.CLOTHES).length;
  const completedDonations = filteredDonations.filter(d => d.status === DONATION_STATUS.COMPLETED).length;
  const pendingDonations = filteredDonations.filter(d => d.status === DONATION_STATUS.PENDING).length;
  const cancelledDonations = filteredDonations.filter(d => d.is_deleted === 1).length;
  const totalSuccessfulPickups = filteredDonations.filter(d => d.status === DONATION_STATUS.COMPLETED && d.is_deleted === 0).length;

  // Calculate meals shared (from food donations)
  const mealsShared = filteredDonations
    .filter(d => d.category === DONATION_CATEGORY.FOOD && d.status === DONATION_STATUS.COMPLETED)
    .reduce((sum, d) => sum + (d.number_of_servings || 0), 0);

  // Calculate clothes donated (from clothing donations)
  const clothesDonated = filteredDonations
    .filter(d => d.category === DONATION_CATEGORY.CLOTHES && d.status === DONATION_STATUS.COMPLETED)
    .reduce((sum, d) => sum + (d.quantity || 0), 0);

  // Calculate people helped (estimate based on meals and clothes)
  const peopleHelped = mealsShared + Math.floor(clothesDonated / 2);

  // Calculate success rate
  const successRate = totalDonations > 0 
    ? ((completedDonations / totalDonations) * 100).toFixed(1) 
    : 0;

  // Calculate completion rate
  const completionRate = totalDonations > 0
    ? ((completedDonations / totalDonations) * 100).toFixed(1)
    : 0;

  // Calculate monthly donation trend
  const monthlyTrend = calculateMonthlyTrend(filteredDonations);

  return {
    totalDonations,
    foodDonations,
    clothingDonations,
    completedDonations,
    pendingDonations,
    cancelledDonations,
    totalSuccessfulPickups,
    mealsShared,
    clothesDonated,
    peopleHelped,
    successRate: parseFloat(successRate),
    completionRate: parseFloat(completionRate),
    monthlyTrend,
  };
}

/**
 * Calculates monthly donation trend data
 * @param {Array} donations - Array of donation objects
 * @returns {Array} Array of monthly data points
 */
function calculateMonthlyTrend(donations) {
  const monthlyData = {};
  
  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toISOString().slice(0, 7); // YYYY-MM format
    monthlyData[key] = { month: key, count: 0, completed: 0 };
  }

  // Populate with actual data
  donations.forEach(donation => {
    const monthKey = donation.created_at.slice(0, 7);
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].count++;
      if (donation.status === DONATION_STATUS.COMPLETED) {
        monthlyData[monthKey].completed++;
      }
    }
  });

  return Object.values(monthlyData);
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
  // NOTE: the `ratings` table column is `stars` (see ratings schema /
  // rating.model.js RATING_COLUMNS), not `rating` — using `r.rating` here
  // previously summed `undefined` for every row, silently forcing
  // averageRating to 0 regardless of actual ratings. Fixed to read `stars`.
  const averageRating = totalRatings > 0
    ? ratings.reduce((sum, r) => sum + r.stars, 0) / totalRatings
    : 0;

  const totalAssignments = donations.length;
  const completionRate = totalAssignments > 0 
    ? (completedPickups / totalAssignments) * 100 
    : 0;

  // "People helped" — reuses the exact same business rule as the donor-side
  // statistics (getDonorStatistics, above): mealsShared (sum of servings on
  // completed food donations) + floor(clothesDonated / 2) (sum of quantity
  // on completed clothes donations, halved as an estimate of people per
  // clothing lot). Computed from this volunteer's own completed donations
  // rather than inventing a new formula.
  const completedDonations = donations.filter(
    d => d.status === DONATION_STATUS.COMPLETED && d.is_deleted === 0
  );

  const mealsShared = completedDonations
    .filter(d => d.category === DONATION_CATEGORY.FOOD)
    .reduce((sum, d) => sum + (d.number_of_servings || 0), 0);

  const clothesDonated = completedDonations
    .filter(d => d.category === DONATION_CATEGORY.CLOTHES)
    .reduce((sum, d) => sum + (d.quantity || 0), 0);

  const peopleHelped = mealsShared + Math.floor(clothesDonated / 2);

  return {
    acceptedDonations,
    completedPickups,
    cancelledPickups,
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalRatings,
    completionRate: parseFloat(completionRate.toFixed(2)),
    peopleHelped,
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
