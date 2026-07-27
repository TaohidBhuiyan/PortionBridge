const { body, param } = require('express-validator');
const { TIME_SLOT, VEHICLE_TYPE, AVAILABILITY, CONTACT_METHOD, GENDER } = require('../constants');
const { PASSWORD_RULES } = require('../utils/password');
const { isCommonWeakPassword } = require('../utils/commonPasswords');

/**
 * express-validator rule chains for every Profile endpoint.
 * Paired with the `validateRequest` middleware, which formats any failures
 * into the standard { success: false, errors: [...] } response shape.
 */

// ============================================================
// Common Profile Validators
// ============================================================

const updateProfileValidationRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 }).withMessage('Phone number must be between 7 and 20 characters.'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Address must not exceed 255 characters.'),

  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Date of birth must be a valid date.')
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      const minAge = 13;
      const maxAge = 120;
      
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      if (age < minAge || age > maxAge) {
        throw new Error(`Date of birth must indicate an age between ${minAge} and ${maxAge} years.`);
      }
      
      return true;
    }),

  body('gender')
    .optional()
    .trim()
    .isIn(Object.values(GENDER)).withMessage(`Gender must be one of: ${Object.values(GENDER).join(', ')}.`),
];

const changePasswordValidationRules = [
  body('currentPassword')
    .trim()
    .notEmpty().withMessage('Current password is required.'),

  body('newPassword')
    .trim()
    .notEmpty().withMessage('New password is required.')
    .custom((value) => {
      if (value !== value.trim()) {
        throw new Error('New password must not contain leading or trailing spaces.');
      }
      return true;
    })
    .isLength({ min: PASSWORD_RULES.MIN_LENGTH, max: PASSWORD_RULES.MAX_LENGTH })
    .withMessage(`New password must be between ${PASSWORD_RULES.MIN_LENGTH} and ${PASSWORD_RULES.MAX_LENGTH} characters.`)
    .matches(PASSWORD_RULES.UPPERCASE_REGEX).withMessage('New password must contain at least one uppercase letter.')
    .matches(PASSWORD_RULES.LOWERCASE_REGEX).withMessage('New password must contain at least one lowercase letter.')
    .matches(PASSWORD_RULES.NUMBER_REGEX).withMessage('New password must contain at least one number.')
    .matches(PASSWORD_RULES.SPECIAL_CHAR_REGEX).withMessage('New password must contain at least one special character.')
    .custom((value) => {
      if (isCommonWeakPassword(value)) {
        throw new Error('This password is too common and easily guessed. Please choose a stronger password.');
      }
      return true;
    }),

  body('confirmPassword')
    .trim()
    .notEmpty().withMessage('Password confirmation is required.')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password.');
      }
      return true;
    }),
];

const updateEmailValidationRules = [
  body('newEmail')
    .trim()
    .notEmpty().withMessage('New email is required.')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty().withMessage('Current password is required to change email.'),
];

const updatePhoneValidationRules = [
  body('newPhone')
    .trim()
    .notEmpty().withMessage('New phone number is required.')
    .isLength({ min: 7, max: 20 }).withMessage('Phone number must be between 7 and 20 characters.'),

  body('password')
    .trim()
    .notEmpty().withMessage('Current password is required to change phone number.'),
];

// ============================================================
// Donor Preference Validators
// ============================================================

const updatePreferencesValidationRules = [
  body('preferredPickupTimeSlot')
    .optional()
    .trim()
    .isIn(Object.values(TIME_SLOT)).withMessage(`Preferred pickup time slot must be one of: ${Object.values(TIME_SLOT).join(', ')}.`),

  body('preferredContactMethod')
    .optional()
    .trim()
    .isIn(Object.values(CONTACT_METHOD)).withMessage(`Preferred contact method must be one of: ${Object.values(CONTACT_METHOD).join(', ')}.`),
];

// ============================================================
// Notification Settings Validators
// ============================================================

const updateNotificationSettingsValidationRules = [
  body('emailNotifications')
    .optional()
    .isBoolean().withMessage('Email notifications must be a boolean.'),

  body('smsNotifications')
    .optional()
    .isBoolean().withMessage('SMS notifications must be a boolean.'),

  body('pushNotifications')
    .optional()
    .isBoolean().withMessage('Push notifications must be a boolean.'),

  body('donationUpdates')
    .optional()
    .isBoolean().withMessage('Donation updates must be a boolean.'),

  body('pickupUpdates')
    .optional()
    .isBoolean().withMessage('Pickup updates must be a boolean.'),

  body('chatNotifications')
    .optional()
    .isBoolean().withMessage('Chat notifications must be a boolean.'),
];

// ============================================================
// Volunteer Profile Validators
// ============================================================

const updateVolunteerProfileValidationRules = [
  body('vehicleType')
    .optional()
    .trim()
    .isIn(Object.values(VEHICLE_TYPE)).withMessage(`Vehicle type must be one of: ${Object.values(VEHICLE_TYPE).join(', ')}.`),

  body('availability')
    .optional()
    .isArray().withMessage('Availability must be an array.')
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      
      const validSlots = Object.values(AVAILABILITY);
      const invalidSlots = value.filter(slot => !validSlots.includes(slot));
      
      if (invalidSlots.length > 0) {
        throw new Error(`Invalid availability slots: ${invalidSlots.join(', ')}. Valid options are: ${validSlots.join(', ')}.`);
      }
      
      return true;
    }),

  body('serviceAreas')
    .optional()
    .isArray().withMessage('Service areas must be an array.')
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      
      for (const area of value) {
        if (!area || typeof area !== 'object') {
          throw new Error('Each service area must be an object.');
        }
        if (!area.division || typeof area.division !== 'string') {
          throw new Error('Each service area must have a division field.');
        }
        if (!area.district || typeof area.district !== 'string') {
          throw new Error('Each service area must have a district field.');
        }
      }
      
      return true;
    }),
];

// ============================================================
// Statistics Validators
// ============================================================

const getDonationStatisticsValidationRules = [
  // No parameters needed - uses authenticated user ID
];

const getVolunteerStatisticsValidationRules = [
  // No parameters needed - uses authenticated user ID
];

module.exports = {
  // Common profile validators
  updateProfileValidationRules,
  changePasswordValidationRules,
  updateEmailValidationRules,
  updatePhoneValidationRules,
  
  // Donor validators
  updatePreferencesValidationRules,
  getDonationStatisticsValidationRules,
  
  // Volunteer validators
  updateVolunteerProfileValidationRules,
  getVolunteerStatisticsValidationRules,
  
  // Notification validators
  updateNotificationSettingsValidationRules,
};
