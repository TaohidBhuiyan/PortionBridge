const { body, query } = require('express-validator');
const { PAGINATION_DEFAULTS } = require('../constants');

const REPORT_STATUS_VALUES = ['pending', 'reviewed', 'resolved'];
const ALLOWED_REPORT_SORT_FIELDS = ['created_at', 'status'];

const createReportValidationRules = [
  body('donationId')
    .notEmpty().withMessage('donationId is required.')
    .isInt({ min: 1 }).withMessage('donationId must be a positive integer.')
    .toInt(),

  body('reportedUserId')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('reportedUserId must be a positive integer.')
    .toInt(),

  body('reason')
    .trim()
    .notEmpty().withMessage('reason is required.')
    .isLength({ max: 500 }).withMessage('reason must not exceed 500 characters.'),

  body('details')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('details must not exceed 2000 characters.'),
];

const listMyReportsValidationRules = [
  query('status')
    .optional()
    .trim()
    .isIn(REPORT_STATUS_VALUES)
    .withMessage(`status must be one of: ${REPORT_STATUS_VALUES.join(', ')}.`),

  query('sortBy')
    .optional()
    .trim()
    .isIn(ALLOWED_REPORT_SORT_FIELDS)
    .withMessage(`sortBy must be one of: ${ALLOWED_REPORT_SORT_FIELDS.join(', ')}.`),

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

module.exports = { createReportValidationRules, listMyReportsValidationRules };
