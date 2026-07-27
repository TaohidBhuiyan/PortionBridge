/**
 * Custom error class for expected, "operational" errors (invalid credentials,
 * duplicate email, expired token, etc.) that should be shown to the client
 * with a specific status code and message — as opposed to unexpected bugs.
 *
 * Usage:
 *   throw new AppError('Invalid email or password.', 401);
 *
 * The centralized errorHandler middleware reads `err.statusCode` and
 * `err.message` directly, so throwing this from inside an asyncHandler-wrapped
 * controller is automatically caught and formatted into the standard
 * { success: false, message } response shape.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
