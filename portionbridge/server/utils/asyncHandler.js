/**
 * Wraps an async Express route/controller so any thrown error or
 * rejected promise is automatically forwarded to next(err),
 * instead of requiring a try/catch block in every controller.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
