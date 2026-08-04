const express = require('express');
const router = express.Router();

const {
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
} = require('../../controllers/auth.controller');
const { uploadProfilePhotoMiddleware } = require('../../middleware/upload.middleware');

const {
  registerValidationRules,
  loginValidationRules,
  googleLoginValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
  verifyEmailValidationRules,
  resendVerificationValidationRules,
} = require('../../validators/auth.validator');

const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');
const { verifyCsrfToken } = require('../../middleware/csrf.middleware');
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../../middleware/rateLimiter');
const { USER_ROLES } = require('../../constants');

// --- Public routes ---
router.post('/register', registerLimiter, uploadProfilePhotoMiddleware, registerValidationRules, validateRequest, register);
router.post('/verify-email', verifyEmailValidationRules, validateRequest, verifyEmail);
router.post('/resend-verification', resendVerificationValidationRules, validateRequest, resendVerification);
router.post('/login', loginLimiter, loginValidationRules, validateRequest, login);
router.post('/google-login', googleLoginValidationRules, validateRequest, googleLogin);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidationRules, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidationRules, validateRequest, resetPassword);
router.post('/reset-password/:token', resetPasswordValidationRules, validateRequest, resetPassword);

// --- Routes relying on the httpOnly refresh-token cookie: CSRF-protected ---
router.post('/refresh-token', verifyCsrfToken, refreshToken);
router.post('/logout', verifyCsrfToken, logout);
router.post('/logout-all', protect, verifyCsrfToken, logoutAll);

// --- Protected routes (bearer access token only, no cookie/CSRF involved) ---
router.get('/me', protect, getMe);

// --- Role-based authorization demonstration (admin only) ---
router.get('/admin-check', protect, authorize(USER_ROLES.ADMIN), adminOnlyCheck);

module.exports = router;
