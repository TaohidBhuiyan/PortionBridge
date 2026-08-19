const { param, query } = require('express-validator');
const { DONATION_CATEGORY, DONATION_STATUS, PAGINATION_DEFAULTS } = require('../constants');

const ALLOWED_ASSIGNMENT_SORT_FIELDS = ['created_at', 'pickup_time', 'scheduled_at', 'accepted_at'];

/**
 * /assignments only ever means "active work" — narrowing status further
 * is restricted to the four non-terminal statuses this endpoint covers
 * (Phase 5: widened from ACCEPTED/SCHEDULED-only to include ON_THE_WAY
 * and PICKED_UP, since the volunteer's "My Mission" view needs to keep
 * surfacing the donation through those statuses too — that's exactly when
 * live location tracking matters most).
 */
const ASSIGNMENT_STATUSES = [
  DONATION_STATUS.ACCEPTED,
  DONATION_STATUS.SCHEDULED,
  DONATION_STATUS.ON_THE_WAY,
  DONATION_STATUS.PICKED_UP,
];

const paginationValidationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer.')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION_DEFAULTS.MAX_LIMIT })
    .withMessage(`limit must be between 1 and ${PAGINATION_DEFAULTS.MAX_LIMIT}.`)
    .toInt(),
];

// Dashboard takes no input — kept as an explicit empty rule set +
// validateRequest in the routes for consistency with every other
// endpoint's shape, rather than special-casing this one.
const dashboardValidationRules = [];

const assignmentsListValidationRules = [
  ...paginationValidationRules,

  query('status')
    .optional()
    .trim()
    .isIn(ASSIGNMENT_STATUSES)
    .withMessage(`status must be one of: ${ASSIGNMENT_STATUSES.join(', ')}.`),

  query('category')
    .optional()
    .trim()
    .isIn(Object.values(DONATION_CATEGORY))
    .withMessage(`Category must be one of: ${Object.values(DONATION_CATEGORY).join(', ')}.`),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search keyword must not exceed 255 characters.'),

  query('sortBy')
    .optional()
    .trim()
    .isIn(ALLOWED_ASSIGNMENT_SORT_FIELDS)
    .withMessage(`sortBy must be one of: ${ALLOWED_ASSIGNMENT_SORT_FIELDS.join(', ')}.`),

  query('sortOrder')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['asc', 'desc']).withMessage('sortOrder must be either "asc" or "desc".'),
];

const upcomingValidationRules = [
  ...paginationValidationRules,

  query('today')
    .optional()
    .isBoolean().withMessage('today must be a boolean (true/false).')
    .toBoolean(),

  query('week')
    .optional()
    .isBoolean().withMessage('week must be a boolean (true/false).')
    .toBoolean(),
];

const assignmentDetailValidationRules = [
  param('id').isInt({ min: 1 }).withMessage('A valid assignment id is required.'),
];

module.exports = {
  dashboardValidationRules,
  assignmentsListValidationRules,
  upcomingValidationRules,
  assignmentDetailValidationRules,
};
