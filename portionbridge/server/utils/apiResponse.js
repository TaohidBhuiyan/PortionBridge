const { HTTP_STATUS } = require('../constants');

/**
 * Centralized response helper.
 * Guarantees every API response (success or error) follows the same shape,
 * so the frontend can rely on a consistent contract.
 */

function success(res, { statusCode = HTTP_STATUS.OK, message = 'Success', data = null, meta = null } = {}) {
  const body = {
    success: true,
    message,
    data,
  };

  if (meta) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
}

function error(res, { statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message = 'Something went wrong', errors = null } = {}) {
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
}

module.exports = { success, error };
