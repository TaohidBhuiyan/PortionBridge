const { body, param } = require('express-validator');

/**
 * Validation rules for creating a team
 */
const createTeamValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Team name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Team name must be between 2 and 100 characters.')
    .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Team name can only contain letters, numbers, spaces, hyphens, and underscores.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.'),
];

/**
 * Validation rules for updating a team
 */
const updateTeamValidationRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Team name must be between 2 and 100 characters.')
    .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Team name can only contain letters, numbers, spaces, hyphens, and underscores.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.'),

  // Team base location — self-service "set our address" (leader-only,
  // enforced in teamService.updateTeam). latitude/longitude must arrive
  // together; coverageRadius/baseAddress are independent optional extras.
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90.')
    .toFloat(),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180.')
    .toFloat()
    .custom((value, { req }) => {
      const hasLat = req.body.latitude !== undefined;
      if (hasLat !== (value !== undefined)) {
        throw new Error('latitude and longitude must be provided together.');
      }
      return true;
    }),

  body('coverageRadius')
    .optional()
    .isFloat({ min: 1, max: 50 }).withMessage('coverageRadius must be between 1 and 50 km.')
    .toFloat(),

  body('baseAddress')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('baseAddress must not exceed 255 characters.'),
];

/**
 * Validation rules for inviting a member
 */
const inviteMemberValidationRules = [
  body('invitedUserId')
    .optional()
    .isInt({ min: 1 }).withMessage('invitedUserId must be a positive integer.'),

  body('invitedEmail')
    .optional()
    .trim()
    .isEmail().withMessage('invitedEmail must be a valid email address.')
    .isLength({ max: 150 }).withMessage('invitedEmail must not exceed 150 characters.'),

  body()
    .custom((value, { req }) => {
      if (!req.body.invitedUserId && !req.body.invitedEmail) {
        throw new Error('Either invitedUserId or invitedEmail must be provided.');
      }
      return true;
    }),
];

/**
 * Validation rules for team ID parameter
 */
const teamIdValidationRules = [
  param('id').isInt({ min: 1 }).withMessage('A valid team id is required.'),
];

/**
 * Validation rules for invitation ID parameter
 */
const invitationIdValidationRules = [
  param('id').isInt({ min: 1 }).withMessage('A valid invitation id is required.'),
];

/**
 * Validation rules for member ID parameter
 */
const memberIdValidationRules = [
  param('memberId').isInt({ min: 1 }).withMessage('A valid member id is required.'),
];

/**
 * Validation rules for sending a join request
 */
const sendJoinRequestValidationRules = [
  body('teamId')
    .isInt({ min: 1 }).withMessage('A valid teamId is required.'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Message must not exceed 255 characters.'),
];

/**
 * Validation rules for request ID parameter
 */
const requestIdValidationRules = [
  param('requestId').isInt({ min: 1 }).withMessage('A valid requestId is required.'),
];

module.exports = {
  createTeamValidationRules,
  updateTeamValidationRules,
  inviteMemberValidationRules,
  teamIdValidationRules,
  invitationIdValidationRules,
  memberIdValidationRules,
  sendJoinRequestValidationRules,
  requestIdValidationRules,
};

