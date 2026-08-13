const fs = require('fs');
const path = require('path');
const { HTTP_STATUS, AUTH } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sanitizeUser, getClientIp, getUserAgent } = require('../utils/helpers');
const uploadService = require('../services/upload.service');
const authService = require('../services/auth.service');
const { issueCsrfCookie } = require('../middleware/csrf.middleware');

/**
 * Cookie options for the refresh token. Scoped to the entire API (not just
 * /auth) so that other protected routes' 401 handling can trigger a client-
 * side refresh call without path mismatches. `secure` is enabled
 * automatically in production (requires HTTPS); disabled in local dev over
 * plain HTTP.
 */
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: AUTH.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  };
}

/**
 * Sets the refresh token cookie and a matching CSRF cookie together,
 * since every place that issues a refresh token also needs CSRF protection
 * active for the cookie-dependent endpoints (refresh, logout, logout-all).
 */
function attachSessionCookies(res, rawRefreshToken) {
  res.cookie(AUTH.REFRESH_COOKIE_NAME, rawRefreshToken, refreshCookieOptions());
  issueCsrfCookie(res);
}

function clearSessionCookies(res) {
  res.clearCookie(AUTH.REFRESH_COOKIE_NAME, refreshCookieOptions());
  res.clearCookie(AUTH.CSRF_COOKIE_NAME, { path: '/' });
}

/**
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, address } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const profilePhotoPath = req.file
    ? `profiles/${path.basename(req.file.filename || req.file.path)}`
    : null;

  try {
    const { user, devVerificationToken } = await authService.register({
      name,
      email,
      password,
      role,
      phone,
      address,
      profilePhotoPath,
      ipAddress,
      userAgent,
    });

    return success(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Account created successfully. Please check your email to verify your account before logging in.',
      data: {
        user: sanitizeUser(user),
        ...(devVerificationToken && { devVerificationToken }),
      },
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to remove uploaded file after registration failure:', cleanupError);
      }
    }
    throw error;
  }
});

/**
 * POST /api/v1/auth/verify-email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  await authService.verifyEmail(token);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Email verified successfully. You can now log in.',
  });
});

/**
 * POST /api/v1/auth/resend-verification
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { message, devVerificationToken } = await authService.resendVerification(email, { ipAddress, userAgent });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message,
    data: devVerificationToken ? { devVerificationToken } : null,
  });
});

/**
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { user, accessToken, rawRefreshToken } = await authService.login({
    email,
    password,
    ipAddress,
    userAgent,
  });

  attachSessionCookies(res, rawRefreshToken);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Logged in successfully.',
    data: {
      user: sanitizeUser(user),
      accessToken,
    },
  });
});

/**
 * POST /api/v1/auth/google-login
 */
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { user, accessToken, rawRefreshToken } = await authService.loginWithGoogle({
    idToken,
    ipAddress,
    userAgent,
  });

  attachSessionCookies(res, rawRefreshToken);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Logged in successfully.',
    data: {
      user: sanitizeUser(user),
      accessToken,
    },
  });
});

/**
 * POST /api/v1/auth/refresh-token
 * Requires CSRF verification (see routes file) since it depends on the
 * httpOnly refresh-token cookie being sent automatically by the browser.
 */
const refreshToken = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies[AUTH.REFRESH_COOKIE_NAME];
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  if (!rawRefreshToken) {
    throw new AppError('No refresh token provided. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
  }

  const { user, accessToken, rawRefreshToken: newRawRefreshToken } = await authService.refreshSession(
    rawRefreshToken,
    { ipAddress, userAgent }
  );

  attachSessionCookies(res, newRawRefreshToken);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Access token refreshed successfully.',
    data: {
      user: sanitizeUser(user),
      accessToken,
    },
  });
});

/**
 * POST /api/v1/auth/logout
 * Logs out the current device/session only.
 */
const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies[AUTH.REFRESH_COOKIE_NAME];
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  await authService.logoutCurrent(rawRefreshToken, { ipAddress, userAgent });
  clearSessionCookies(res);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Logged out successfully.',
  });
});

/**
 * POST /api/v1/auth/logout-all
 * Logs out every active session/device for the authenticated user.
 */
const logoutAll = asyncHandler(async (req, res) => {
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  await authService.logoutAll(req.user.id, { ipAddress, userAgent });
  clearSessionCookies(res);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Logged out of all devices successfully.',
  });
});

/**
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { message, devResetToken } = await authService.forgotPassword(email, { ipAddress, userAgent });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message,
    data: devResetToken ? { devResetToken } : null,
  });
});

/**
 * POST /api/v1/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const token = req.params.token || req.body.token;
  const { newPassword } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  await authService.resetPassword({ rawToken: token, newPassword, ipAddress, userAgent });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Password has been reset successfully. Please log in again with your new password.',
  });
});

/**
 * GET /api/v1/auth/me
 * Protected route — returns the authenticated user's own profile.
 */
const getMe = asyncHandler(async (req, res) => {
  const userModel = require('../models/user.model');
  const user = await userModel.findById(req.user.id);

  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Profile retrieved successfully.',
    data: { user: sanitizeUser(user) },
  });
});

/**
 * GET /api/v1/auth/admin-check
 * Demonstrates role-based authorization — accessible only to 'admin' accounts.
 */
const adminOnlyCheck = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Access granted. You are authenticated as an admin.',
    data: { user: req.user },
  });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  googleLogin,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
  adminOnlyCheck,
};
