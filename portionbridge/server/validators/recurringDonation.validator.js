const { body } = require('express-validator');

/**
 * Validation rules for creating a recurring donation
 */
const createRecurringDonationValidationRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title must be less than 150 characters'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['food', 'clothes'])
    .withMessage('Category must be either food or clothes'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  
  body('quantityUnit')
    .trim()
    .notEmpty()
    .withMessage('Quantity unit is required'),
  
  body('pickupLocation')
    .trim()
    .notEmpty()
    .withMessage('Pickup location is required')
    .isLength({ max: 500 })
    .withMessage('Pickup location must be less than 500 characters'),
  
  body('contactPhone')
    .trim()
    .notEmpty()
    .withMessage('Contact phone is required')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
  
  body('frequency')
    .trim()
    .notEmpty()
    .withMessage('Frequency is required')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be daily, weekly, or monthly'),
  
  body('intervalValue')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Interval value must be at least 1'),
  
  body('dayOfWeek')
    .if(body('frequency').equals('weekly'))
    .notEmpty()
    .withMessage('Day of week is required for weekly frequency')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  
  body('dayOfMonth')
    .if(body('frequency').equals('monthly'))
    .notEmpty()
    .withMessage('Day of month is required for monthly frequency')
    .isInt({ min: 1, max: 31 })
    .withMessage('Day of month must be between 1 and 31'),
  
  body('startDate')
    .trim()
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (value && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
];

/**
 * Validation rules for updating a recurring donation
 */
const updateRecurringDonationValidationRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 150 })
    .withMessage('Title must be less than 150 characters'),
  
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty')
    .isIn(['food', 'clothes'])
    .withMessage('Category must be either food or clothes'),
  
  body('quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  
  body('quantityUnit')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Quantity unit cannot be empty'),
  
  body('pickupLocation')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Pickup location cannot be empty')
    .isLength({ max: 500 })
    .withMessage('Pickup location must be less than 500 characters'),
  
  body('contactPhone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Contact phone cannot be empty')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
  
  body('frequency')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Frequency cannot be empty')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be daily, weekly, or monthly'),
  
  body('intervalValue')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Interval value must be at least 1'),
  
  body('dayOfWeek')
    .if(body('frequency').equals('weekly'))
    .notEmpty()
    .withMessage('Day of week is required for weekly frequency')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  
  body('dayOfMonth')
    .if(body('frequency').equals('monthly'))
    .notEmpty()
    .withMessage('Day of month is required for monthly frequency')
    .isInt({ min: 1, max: 31 })
    .withMessage('Day of month must be between 1 and 31'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

module.exports = {
  createRecurringDonationValidationRules,
  updateRecurringDonationValidationRules,
};
