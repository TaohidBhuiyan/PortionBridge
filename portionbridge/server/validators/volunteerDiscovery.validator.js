const { body, query, param } = require('express-validator');

/**
 * Validation rules for finding nearby volunteers
 */
const nearbyVolunteersValidationRules = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 km'),
  query('availableOnly')
    .optional()
    .isBoolean()
    .withMessage('availableOnly must be a boolean'),
  query('onlineOnly')
    .optional()
    .isBoolean()
    .withMessage('onlineOnly must be a boolean'),
  query('specialty')
    .optional()
    .isIn(['food', 'clothes'])
    .withMessage('Specialty must be either food or clothes'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['distance', 'rating', 'pickups'])
    .withMessage('sortBy must be distance, rating, or pickups'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Validation rules for finding nearby teams
 */
const nearbyTeamsValidationRules = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 km'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Validation rules for updating volunteer location
 */
const updateVolunteerLocationValidationRules = [
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('isOnline')
    .optional()
    .isBoolean()
    .withMessage('isOnline must be a boolean'),
];

/**
 * Validation rules for updating team location
 */
const updateTeamLocationValidationRules = [
  param('id')
    .notEmpty()
    .withMessage('Team ID is required')
    .isInt({ min: 1 })
    .withMessage('Team ID must be a positive integer'),
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('coverageRadius')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Coverage radius must be between 1 and 100 km'),
];

/**
 * Validation rules for getting volunteer stats
 */
const volunteerStatsValidationRules = [
  param('id')
    .notEmpty()
    .withMessage('Volunteer ID is required')
    .isInt({ min: 1 })
    .withMessage('Volunteer ID must be a positive integer'),
];

module.exports = {
  nearbyVolunteersValidationRules,
  nearbyTeamsValidationRules,
  updateVolunteerLocationValidationRules,
  updateTeamLocationValidationRules,
  volunteerStatsValidationRules,
};
