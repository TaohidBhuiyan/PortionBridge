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

module.exports = {
  createTeamValidationRules,
  updateTeamValidationRules,
  inviteMemberValidationRules,
  teamIdValidationRules,
  invitationIdValidationRules,
  memberIdValidationRules,
};
