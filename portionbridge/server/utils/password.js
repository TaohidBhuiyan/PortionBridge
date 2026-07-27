const bcrypt = require('bcrypt');
const { isCommonWeakPassword } = require('./commonPasswords');

const SALT_ROUNDS = 12;

const PASSWORD_RULES = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 64,
  UPPERCASE_REGEX: /[A-Z]/,
  LOWERCASE_REGEX: /[a-z]/,
  NUMBER_REGEX: /[0-9]/,
  SPECIAL_CHAR_REGEX: /[^A-Za-z0-9]/,
};

/**
 * Validates a plaintext password against the PortionBridge password policy:
 *  - 12 to 64 characters
 *  - at least one uppercase letter
 *  - at least one lowercase letter
 *  - at least one number
 *  - at least one special character
 *  - no leading or trailing spaces
 *  - must not be a known common/weak password
 *
 * Returns { valid: boolean, message: string } so callers (and the frontend,
 * via the API's validation error response) get a clear, specific reason for
 * failure rather than a generic "invalid password".
 */
function validatePasswordPolicy(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return { valid: false, message: 'Password is required.' };
  }

  if (password !== password.trim()) {
    return { valid: false, message: 'Password must not contain leading or trailing spaces.' };
  }

  if (password.length < PASSWORD_RULES.MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters long.`,
    };
  }

  if (password.length > PASSWORD_RULES.MAX_LENGTH) {
    return {
      valid: false,
      message: `Password must not exceed ${PASSWORD_RULES.MAX_LENGTH} characters.`,
    };
  }

  if (!PASSWORD_RULES.UPPERCASE_REGEX.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }

  if (!PASSWORD_RULES.LOWERCASE_REGEX.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }

  if (!PASSWORD_RULES.NUMBER_REGEX.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }

  if (!PASSWORD_RULES.SPECIAL_CHAR_REGEX.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }

  if (isCommonWeakPassword(password)) {
    return {
      valid: false,
      message: 'This password is too common and easily guessed. Please choose a stronger, more unique password.',
    };
  }

  return { valid: true, message: 'Password meets all requirements.' };
}

/**
 * Hashes a plaintext password using bcrypt. Never store plaintext passwords.
 */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 */
async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = { validatePasswordPolicy, hashPassword, comparePassword, PASSWORD_RULES, SALT_ROUNDS };
