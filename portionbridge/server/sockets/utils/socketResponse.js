/**
 * Plain response-shape helpers for Socket.io acknowledgement callbacks —
 * the socket-layer equivalent of utils/apiResponse.js's success()/error(),
 * adapted since sockets have no `res` object to write to. Keeping the same
 * { success, message, data } shape means client-side code can handle REST
 * and socket responses with the same mental model.
 */

/**
 * @param {string} message - Human-readable success message
 * @param {*} [data] - Payload data
 * @returns {{ success: true, message: string, data: * }}
 */
function socketSuccess(message, data = null) {
  return { success: true, message, data };
}

/**
 * @param {string} message - Human-readable error message
 * @param {number} [statusCode] - HTTP-style status code carried as semantic
 *   metadata only (sockets have no actual HTTP response) — lets the client
 *   distinguish e.g. 403 vs 404 vs 400 the same way it would for a REST call.
 * @returns {{ success: false, message: string, statusCode: number|null }}
 */
function socketError(message, statusCode = null) {
  return { success: false, message, statusCode };
}

module.exports = { socketSuccess, socketError };
