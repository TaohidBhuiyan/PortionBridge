const { param, query } = require('express-validator');
const { NOTIFICATION_TYPES, PAGINATION_DEFAULTS } = require('../constants');

const NOTIFICATION_STATUS_VALUES = ['read', 'unread'];

const listNotificationsValidationRules = [
  query('status')
    .optional()
    .trim()
    .isIn(NOTIFICATION_STATUS_VALUES)
    .withMessage(`status must be one of: ${NOTIFICATION_STATUS_VALUES.join(', ')}.`),

  query('type')
    .optional()
    .trim()
    .isIn(Object.values(NOTIFICATION_TYPES))
    .withMessage(`type must be one of: ${Object.values(NOTIFICATION_TYPES).join(', ')}.`),

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

// Takes no params/query — kept as an explicit empty rule set +
// validateRequest in the routes for consistency with every other
// endpoint's shape (same pattern used for dashboard-style endpoints
// elsewhere in the app).
const getUnreadCountValidationRules = [];

const markOneAsReadValidationRules = [
  param('notificationId').isInt({ min: 1 }).withMessage('A valid notificationId is required.'),
];

const markAllAsReadValidationRules = [];

module.exports = {
  listNotificationsValidationRules,
  getUnreadCountValidationRules,
  markOneAsReadValidationRules,
  markAllAsReadValidationRules,
};
