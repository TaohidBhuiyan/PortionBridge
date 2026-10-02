const { body, query } = require('express-validator');
const { PAGINATION_DEFAULTS } = require('../constants');

const CATEGORIES = ['account', 'donation', 'pickup', 'technical', 'safety', 'feedback', 'other'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const STATUSES = ['open', 'in_progress', 'awaiting_user', 'resolved', 'closed'];

const createTicketValidationRules = [
  body('subject')
    .trim()
    .notEmpty().withMessage('subject is required.')
    .isLength({ max: 150 }).withMessage('subject must not exceed 150 characters.'),

  body('category')
    .trim()
    .notEmpty().withMessage('category is required.')
    .isIn(CATEGORIES).withMessage(`category must be one of: ${CATEGORIES.join(', ')}.`),

  body('priority')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(', ')}.`),

  body('body')
    .trim()
    .notEmpty().withMessage('body message is required.')
    .isLength({ max: 5000 }).withMessage('message must not exceed 5000 characters.'),

  body('donationId')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('donationId must be a positive integer.')
    .toInt(),
];

const listTicketsValidationRules = [
  query('group')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['all', 'active', 'resolved']).withMessage('group must be one of: all, active, resolved.'),

  query('search')
    .optional({ checkFalsy: true })
    .trim(),

  query('page')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('page must be a positive integer.')
    .toInt(),

  query('limit')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: PAGINATION_DEFAULTS.MAX_LIMIT })
    .withMessage(`limit must be between 1 and ${PAGINATION_DEFAULTS.MAX_LIMIT}.`)
    .toInt(),
];

const postMessageValidationRules = [
  body('body')
    .trim()
    .notEmpty().withMessage('body message is required.')
    .isLength({ max: 5000 }).withMessage('message must not exceed 5000 characters.'),
];

const updateStatusValidationRules = [
  body('status')
    .trim()
    .notEmpty().withMessage('status is required.')
    .isIn(['open', 'closed']).withMessage('Users can only set status to "open" or "closed".'),
];

const adminListTicketsValidationRules = [
  query('status')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}.`),

  query('category')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(CATEGORIES).withMessage(`category must be one of: ${CATEGORIES.join(', ')}.`),

  query('priority')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(', ')}.`),

  query('assigned')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['all', 'me', 'unassigned']).withMessage('assigned must be one of: all, me, unassigned.'),

  query('search')
    .optional({ checkFalsy: true })
    .trim(),

  query('page')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('page must be a positive integer.')
    .toInt(),

  query('limit')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: PAGINATION_DEFAULTS.MAX_LIMIT })
    .withMessage(`limit must be between 1 and ${PAGINATION_DEFAULTS.MAX_LIMIT}.`)
    .toInt(),
];

const adminPostMessageValidationRules = [
  body('body')
    .trim()
    .notEmpty().withMessage('body message is required.')
    .isLength({ max: 5000 }).withMessage('message must not exceed 5000 characters.'),

  body('isInternal')
    .optional()
    .isBoolean().withMessage('isInternal must be a boolean.')
    .toBoolean(),

  body('status')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}.`),
];

const adminUpdateTicketValidationRules = [
  body('status')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}.`),

  body('priority')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(', ')}.`),

  body('assignedAdminId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => val === null || (Number.isInteger(val) && val > 0))
    .withMessage('assignedAdminId must be null or a positive integer.'),
];

module.exports = {
  createTicketValidationRules,
  listTicketsValidationRules,
  postMessageValidationRules,
  updateStatusValidationRules,
  adminListTicketsValidationRules,
  adminPostMessageValidationRules,
  adminUpdateTicketValidationRules,
};
