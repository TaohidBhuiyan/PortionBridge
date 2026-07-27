const { query } = require('express-validator');
const { PAGINATION_DEFAULTS } = require('../constants');

const ALLOWED_DONOR_SORT_FIELDS = ['completed_count', 'total_quantity_donated', 'average_rating', 'total_donations'];
const ALLOWED_VOLUNTEER_SORT_FIELDS = ['completed_count', 'average_rating', 'total_pickups'];

const paginationAndSortRules = (allowedSortFields) => [
  query('sortBy')
    .optional()
    .trim()
    .isIn(allowedSortFields)
    .withMessage(`sortBy must be one of: ${allowedSortFields.join(', ')}.`),

  query('sortOrder')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['asc', 'desc']).withMessage('sortOrder must be either "asc" or "desc".'),

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

const getTopDonorsValidationRules = paginationAndSortRules(ALLOWED_DONOR_SORT_FIELDS);
const getTopVolunteersValidationRules = paginationAndSortRules(ALLOWED_VOLUNTEER_SORT_FIELDS);

module.exports = {
  getTopDonorsValidationRules,
  getTopVolunteersValidationRules,
};
