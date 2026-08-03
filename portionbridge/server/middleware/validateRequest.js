const fs = require('fs');
const { validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../constants');
const { error } = require('../utils/apiResponse');

/**
 * Bridges express-validator with our standard API response shape.
 * Attach this AFTER an array of express-validator rules on a route:
 *
 *   router.post('/register', registerValidationRules, validateRequest, controllerFn)
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file after validation error:', cleanupError);
      }
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return error(res, {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  next();
}

module.exports = validateRequest;
