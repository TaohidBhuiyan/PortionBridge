const { param, query } = require('express-validator');
const { USER_ROLES, DONATION_CATEGORY, DONATION_STATUS, PAGINATION_DEFAULTS } = require('../constants');

const ALLOWED_USER_SORT_FIELDS = ['created_at', 'name', 'email'];
const ALLOWED_ADMIN_DONATION_SORT_FIELDS = ['created_at', 'pickup_time', 'scheduled_at', 'completed_at'];
const USER_STATUS_VALUES = ['active', 'banned', 'deleted'];

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
// validateRequest in the routes, consistent with every other endpoint's
// shape (same pattern as volunteer.validator.js#dashboardValidationRules).
const dashboardValidationRules = [];

const userIdParamValidationRules = [
  param('id').isInt({ min: 1 }).withMessage('A valid user id is required.'),
];

const donationIdParamValidationRules = [
  param('id').isInt({ min: 1 }).withMessage('A valid donation id is required.'),
];

const listUsersValidationRules = [
  ...paginationValidationRules,

  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search keyword must not exceed 255 characters.'),

  query('role')
    .optional()
    .trim()
    .isIn(Object.values(USER_ROLES))
    .withMessage(`role must be one of: ${Object.values(USER_ROLES).join(', ')}.`),

  query('status')
    .optional()
    .trim()
    .isIn(USER_STATUS_VALUES)
    .withMessage(`status must be one of: ${USER_STATUS_VALUES.join(', ')}.`),

  query('sortBy')
    .optional()
    .trim()
    .isIn(ALLOWED_USER_SORT_FIELDS)
    .withMessage(`sortBy must be one of: ${ALLOWED_USER_SORT_FIELDS.join(', ')}.`),

  query('sortOrder')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['asc', 'desc']).withMessage('sortOrder must be either "asc" or "desc".'),
];

const getUserValidationRules = [...userIdParamValidationRules];
const disableUserValidationRules = [...userIdParamValidationRules];
const enableUserValidationRules = [...userIdParamValidationRules];

const getUserActivityValidationRules = [
  ...userIdParamValidationRules,
  ...paginationValidationRules,
];

const listDonationsValidationRules = [
  ...paginationValidationRules,

  query('status')
    .optional()
    .trim()
    .isIn(Object.values(DONATION_STATUS))
    .withMessage(`status must be one of: ${Object.values(DONATION_STATUS).join(', ')}.`),

  query('category')
    .optional()
    .trim()
    .isIn(Object.values(DONATION_CATEGORY))
    .withMessage(`Category must be one of: ${Object.values(DONATION_CATEGORY).join(', ')}.`),

  query('donorId')
    .optional()
    .isInt({ min: 1 }).withMessage('donorId must be a positive integer.')
    .toInt(),

  query('volunteerId')
    .optional()
    .isInt({ min: 1 }).withMessage('volunteerId must be a positive integer.')
    .toInt(),

  query('deleted')
    .optional()
    .isBoolean().withMessage('deleted must be a boolean (true/false).')
    .toBoolean(),

  query('reported')
    .optional()
    .isBoolean().withMessage('reported must be a boolean (true/false).')
    .toBoolean(),

  query('dateFrom')
    .optional()
    .isISO8601().withMessage('dateFrom must be a valid date (ISO 8601).'),

  query('dateTo')
    .optional()
    .isISO8601().withMessage('dateTo must be a valid date (ISO 8601).')
    .custom((value, { req }) => {
      if (req.query.dateFrom && new Date(value) < new Date(req.query.dateFrom)) {
        throw new Error('dateTo must be on or after dateFrom.');
      }
      return true;
    }),

  query('sortBy')
    .optional()
    .trim()
    .isIn(ALLOWED_ADMIN_DONATION_SORT_FIELDS)
    .withMessage(`sortBy must be one of: ${ALLOWED_ADMIN_DONATION_SORT_FIELDS.join(', ')}.`),

  query('sortOrder')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['asc', 'desc']).withMessage('sortOrder must be either "asc" or "desc".'),
];

const getDonationValidationRules = [...donationIdParamValidationRules];
const getDonationHistoryValidationRules = [...donationIdParamValidationRules];

const listVolunteersValidationRules = [
  ...paginationValidationRules,

  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search keyword must not exceed 255 characters.'),
];

const getVolunteerValidationRules = [
  param('id').isInt({ min: 1 }).withMessage('A valid volunteer id is required.'),
];

const listTeamsValidationRules = [
  ...paginationValidationRules,

  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search keyword must not exceed 255 characters.'),
];

const getTeamValidationRules = [
  param('id').isInt({ min: 1 }).withMessage('A valid team id is required.'),
];

module.exports = {
  dashboardValidationRules,
  listUsersValidationRules,
  getUserValidationRules,
  disableUserValidationRules,
  enableUserValidationRules,
  getUserActivityValidationRules,
  listDonationsValidationRules,
  getDonationValidationRules,
  getDonationHistoryValidationRules,
  listVolunteersValidationRules,
  getVolunteerValidationRules,
  listTeamsValidationRules,
  getTeamValidationRules,
};
