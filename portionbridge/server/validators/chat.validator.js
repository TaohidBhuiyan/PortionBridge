const { param, query } = require('express-validator');
const { PAGINATION_DEFAULTS } = require('../constants');

const donationIdParamValidationRules = [
  param('donationId').isInt({ min: 1 }).withMessage('A valid donationId is required.'),
];

const getMessagesValidationRules = [
  ...donationIdParamValidationRules,
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION_DEFAULTS.MAX_LIMIT })
    .withMessage(`limit must be between 1 and ${PAGINATION_DEFAULTS.MAX_LIMIT}.`)
    .toInt(),
];

const getUnreadCountValidationRules = [...donationIdParamValidationRules];

const getLatestMessageValidationRules = [...donationIdParamValidationRules];

// Takes no params/query — kept as an explicit empty rule set +
// validateRequest in the routes for consistency with every other
// endpoint's shape (same pattern as admin.validator.js's
// dashboardValidationRules), rather than special-casing this one.
const getUnreadCountForUserValidationRules = [];

module.exports = {
  getMessagesValidationRules,
  getLatestMessageValidationRules,
  getUnreadCountValidationRules,
  getUnreadCountForUserValidationRules,
};
