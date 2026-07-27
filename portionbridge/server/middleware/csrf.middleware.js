const { AUTH, HTTP_STATUS } = require('../constants');
const { error } = require('../utils/apiResponse');
const { generateCsrfToken, timingSafeEqualHex } = require('../utils/token');

/**
 * CSRF protection using the double-submit cookie pattern.
 *
 * Why this is needed: the refresh token is stored in an httpOnly cookie so
 * that client-side JavaScript can never read it (mitigating XSS token
 * theft). But that means the browser will automatically attach it to any
 * cross-site request too, unless something else proves the request
 * actually originated from our own frontend. The fix: a SECOND cookie
 * (`csrfToken`) that is NOT httpOnly, so our frontend's JavaScript can read
 * it and echo it back in a custom request header. A malicious third-party
 * site can trigger the browser to send the cookie automatically, but it
 * cannot read the cookie's value to also set the matching header — so the
 * two won't match on a forged cross-site request.
 *
 * `issueCsrfCookie` is called whenever a new refresh-token cookie is set
 * (login, register, refresh). `verifyCsrfToken` is applied to endpoints
 * that rely on the refresh-token cookie (refresh-token, logout, logout-all).
 */

function issueCsrfCookie(res) {
  const csrfToken = generateCsrfToken();

  res.cookie(AUTH.CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // must be readable by frontend JS to echo back in the header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: AUTH.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  });

  return csrfToken;
}

function verifyCsrfToken(req, res, next) {
  const cookieToken = req.cookies[AUTH.CSRF_COOKIE_NAME];
  const headerToken = req.headers[AUTH.CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken) {
    return error(res, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      message: 'CSRF token missing. Request rejected.',
    });
  }

  if (!timingSafeEqualHex(cookieToken, headerToken)) {
    return error(res, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      message: 'CSRF token mismatch. Request rejected.',
    });
  }

  next();
}

module.exports = { issueCsrfCookie, verifyCsrfToken };
