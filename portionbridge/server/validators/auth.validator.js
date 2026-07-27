const { body } = require('express-validator');
const { AUTH, USER_ROLES } = require('../constants');
const { PASSWORD_RULES } = require('../utils/password');
const { isCommonWeakPassword } = require('../utils/commonPasswords');

/**
 * express-validator rule chains for every Auth endpoint.
 * Paired with the `validateRequest` middleware, which formats any failures
 * into the standard { success: false, errors: [...] } response shape.
 */

const passwordPolicyChain = (field) =>
  body(field)
    .notEmpty().withMessage(`${field} is required.`)
    .custom((value) => {
      if (value !== value.trim()) {
        throw new Error(`${field} must not contain leading or trailing spaces.`);
      }
      return true;
    })
    .isLength({ min: PASSWORD_RULES.MIN_LENGTH, max: PASSWORD_RULES.MAX_LENGTH })
    .withMessage(`${field} must be between ${PASSWORD_RULES.MIN_LENGTH} and ${PASSWORD_RULES.MAX_LENGTH} characters.`)
    .matches(PASSWORD_RULES.UPPERCASE_REGEX).withMessage(`${field} must contain at least one uppercase letter.`)
    .matches(PASSWORD_RULES.LOWERCASE_REGEX).withMessage(`${field} must contain at least one lowercase letter.`)
    .matches(PASSWORD_RULES.NUMBER_REGEX).withMessage(`${field} must contain at least one number.`)
    .matches(PASSWORD_RULES.SPECIAL_CHAR_REGEX).withMessage(`${field} must contain at least one special character.`)
    .custom((value) => {
      if (isCommonWeakPassword(value)) {
        throw new Error('This password is too common and easily guessed. Please choose a stronger password.');
      }
      return true;
    });

const registerValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),

  passwordPolicyChain('password'),

  body('role')
    .trim()
    .notEmpty().withMessage('Role is required.')
    .isIn(AUTH.PUBLIC_REGISTERABLE_ROLES)
    .withMessage(`Role must be one of: ${AUTH.PUBLIC_REGISTERABLE_ROLES.join(', ')}.`),

  body('phone')
    .optional({ checkFalsy: true })
    .isLength({ min: 7, max: 20 }).withMessage('Phone number must be between 7 and 20 characters.'),

  body('address')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 }).withMessage('Address must not exceed 255 characters.'),
];

const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  body('role')
    .trim()
    .notEmpty().withMessage('Role is required.')
    .isIn([USER_ROLES.DONOR, USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN])
    .withMessage(`Role must be one of: ${USER_ROLES.DONOR}, ${USER_ROLES.VOLUNTEER}, ${USER_ROLES.ADMIN}.`),
];

const forgotPasswordValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),
];

const resetPasswordValidationRules = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required.'),

  passwordPolicyChain('newPassword'),
];

const verifyEmailValidationRules = [
  body('token')
    .trim()
    .notEmpty().withMessage('Verification token is required.'),
];

const resendVerificationValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),
];

module.exports = {
  registerValidationRules,
  loginValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
  verifyEmailValidationRules,
  resendVerificationValidationRules,
};
