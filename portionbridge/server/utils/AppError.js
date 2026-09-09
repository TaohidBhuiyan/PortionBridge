/**
 * Custom error class for expected, "operational" errors (invalid credentials,
 * duplicate email, expired token, etc.) that should be shown to the client
 * with a specific status code and message — as opposed to unexpected bugs.
 *
 * Usage:
 *   throw new AppError('Invalid email or password.', 401);
 *
 * An optional third argument adds a machine-readable `code` to the response
 * (e.g. 'EMAIL_NOT_VERIFIED') for the rare case where the frontend needs to
 * branch on more than just the status code/message text — most callers
 * don't need this and can omit it entirely.
 *
 * The centralized errorHandler middleware reads `err.statusCode`, `err.message`,
 * and `err.code` directly, so throwing this from inside an asyncHandler-wrapped
 * controller is automatically caught and formatted into the standard
 * { success: false, message, code? } response shape.
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
