const { HTTP_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const recurringDonationModel = require('../models/recurringDonation.model');
const donationModel = require('../models/donation.model');

/**
 * Creates a new recurring donation schedule
 * @param {number} donorId - Donor user ID
 * @param {Object} data - Recurring donation data
 * @returns {Promise<Object>} Created recurring donation
 */
async function createRecurringDonation(donorId, data) {
  const {
    title,
    category,
    description,
    quantity,
    quantityUnit,
    pickupLocation,
    contactPhone,
    frequency,
    intervalValue = 1,
    dayOfWeek,
    dayOfMonth,
    foodDetails,
    clothingDetails,
    startDate,
    endDate,
  } = data;

  // Validate frequency-specific fields
  if (frequency === 'weekly' && dayOfWeek === undefined) {
    throw new AppError('Day of week is required for weekly frequency', HTTP_STATUS.BAD_REQUEST);
  }
  if (frequency === 'monthly' && dayOfMonth === undefined) {
    throw new AppError('Day of month is required for monthly frequency', HTTP_STATUS.BAD_REQUEST);
  }

  const id = await recurringDonationModel.create({
    donorId,
    title,
    category,
    description,
    quantity,
    quantityUnit,
    pickupLocation,
    contactPhone,
    frequency,
    intervalValue,
    dayOfWeek,
    dayOfMonth,
    foodDetails,
    clothingDetails,
    startDate,
    endDate,
  });

  return await recurringDonationModel.findById(id);
}

/**
 * Gets all recurring donations for a donor
 * @param {number} donorId - Donor user ID
 * @param {boolean} activeOnly - Only return active schedules
 * @returns {Promise<Array>} Array of recurring donations
 */
async function getDonorRecurringDonations(donorId, activeOnly = false) {
  return await recurringDonationModel.findByDonorId(donorId, activeOnly);
}

/**
 * Gets a recurring donation by ID
 * @param {number} id - Recurring donation ID
 * @param {number} donorId - Donor user ID (for ownership check)
 * @returns {Promise<Object>} Recurring donation
 */
async function getRecurringDonationById(id, donorId) {
  const recurring = await recurringDonationModel.findById(id);

  if (!recurring) {
    throw new AppError('Recurring donation schedule not found', HTTP_STATUS.NOT_FOUND);
  }

  if (recurring.donor_id !== donorId) {
    throw new AppError('You are not allowed to view this recurring donation schedule', HTTP_STATUS.FORBIDDEN);
  }

  return recurring;
}

/**
 * Updates a recurring donation
 * @param {number} id - Recurring donation ID
 * @param {number} donorId - Donor user ID (for ownership check)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated recurring donation
 */
async function updateRecurringDonation(id, donorId, updates) {
  const recurring = await recurringDonationModel.findById(id);

  if (!recurring) {
    throw new AppError('Recurring donation schedule not found', HTTP_STATUS.NOT_FOUND);
  }

  if (recurring.donor_id !== donorId) {
    throw new AppError('You are not allowed to modify this recurring donation schedule', HTTP_STATUS.FORBIDDEN);
  }

  await recurringDonationModel.updateById(id, updates);
  return await recurringDonationModel.findById(id);
}

/**
 * Deactivates a recurring donation
 * @param {number} id - Recurring donation ID
 * @param {number} donorId - Donor user ID (for ownership check)
 * @returns {Promise<boolean>} True if deactivated
 */
async function deactivateRecurringDonation(id, donorId) {
  const recurring = await recurringDonationModel.findById(id);

  if (!recurring) {
    throw new AppError('Recurring donation schedule not found', HTTP_STATUS.NOT_FOUND);
  }

  if (recurring.donor_id !== donorId) {
    throw new AppError('You are not allowed to modify this recurring donation schedule', HTTP_STATUS.FORBIDDEN);
  }

  return await recurringDonationModel.deactivate(id);
}

/**
 * Calculates the next occurrence date based on frequency
 * @param {string} frequency - Frequency (daily, weekly, monthly)
 * @param {number} intervalValue - Interval value
 * @param {number} dayOfWeek - Day of week (0-6) for weekly
 * @param {number} dayOfMonth - Day of month (1-31) for monthly
 * @param {string} currentDate - Current date string (YYYY-MM-DD)
 * @returns {string} Next occurrence date string (YYYY-MM-DD)
 */
function calculateNextOccurrence(frequency, intervalValue, dayOfWeek, dayOfMonth, currentDate) {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + intervalValue);
      break;
    case 'weekly':
      const currentDay = date.getDay();
      const targetDay = dayOfWeek;
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }
      date.setDate(date.getDate() + daysUntilTarget + (intervalValue - 1) * 7);
      break;
    case 'monthly':
      const currentMonth = date.getMonth();
      const targetDayOfMonth = dayOfMonth;
      const currentDayOfMonth = date.getDate();
      
      if (targetDayOfMonth >= currentDayOfMonth) {
        date.setDate(targetDayOfMonth);
      } else {
        date.setMonth(currentMonth + intervalValue);
        date.setDate(targetDayOfMonth);
      }
      break;
    default:
      throw new AppError('Invalid frequency', HTTP_STATUS.BAD_REQUEST);
  }
  
  return date.toISOString().split('T')[0];
}

module.exports = {
  createRecurringDonation,
  getDonorRecurringDonations,
  getRecurringDonationById,
  updateRecurringDonation,
  deactivateRecurringDonation,
  calculateNextOccurrence,
};
