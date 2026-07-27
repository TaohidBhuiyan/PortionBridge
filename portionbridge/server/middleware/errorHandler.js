const { HTTP_STATUS } = require('../constants');
const { error } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

/**
 * Centralized error-handling middleware.
 * Any error passed via next(err) anywhere in the app lands here.
 */
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.stack || err.message);

  const isOperational = err instanceof AppError || err.isOperational === true;
  const statusCode = isOperational ? err.statusCode : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = isOperational || process.env.NODE_ENV === 'development'
    ? (err.message || 'Internal Server Error')
    : 'An unexpected error occurred. Please try again later.';

  return error(res, {
    statusCode,
    message,
    errors: process.env.NODE_ENV === 'development' ? { stack: err.stack } : null,
  });
}

/**
 * Handles requests to routes that don't exist.
 */
function notFoundHandler(req, res, next) {
  return error(res, {
    statusCode: HTTP_STATUS.NOT_FOUND,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFoundHandler };
