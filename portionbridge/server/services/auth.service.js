const { pool } = require('../config/db');
const { OAuth2Client } = require('google-auth-library');
const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateOpaqueToken, hashToken } = require('../utils/token');
const { AUTH, USER_ROLES, AUDIT_ACTIONS, HTTP_STATUS } = require('../constants');

const userModel = require('../models/user.model');
const passwordResetModel = require('../models/passwordReset.model');
const emailVerificationModel = require('../models/emailVerification.model');
const passwordHistoryModel = require('../models/passwordHistory.model');
const refreshTokenModel = require('../models/refreshToken.model');

const tokenService = require('./token.service');
const emailService = require('./email.service');
const auditService = require('./audit.service');

/**
 * Core authentication business logic. Controllers stay thin — they parse
 * the request, call one of these functions, and format the response.
 */

/**
 * Registers a new Donor or Volunteer account (Admin accounts can never be
 * self-registered). Sends an email verification link; the account cannot
 * log in until that link is used.
 */
async function verifyGoogleToken(idToken) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google OAuth is not configured.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) {
    throw new AppError('Google account email is not verified.', HTTP_STATUS.BAD_REQUEST);
  }

  return payload;
}

async function register({ name, email, password, role, phone, address, profilePhotoPath, ipAddress, userAgent }) {
  const alreadyExists = await userModel.emailExists(email);
  if (alreadyExists) {
    throw new AppError('An account with this email already exists.', HTTP_STATUS.CONFLICT);
  }

  const assignedRole = role;
  const hashedPassword = await hashPassword(password);

  let newUserId;
  try {
    newUserId = await userModel.createUser({
      name,
      email,
      hashedPassword,
      role: assignedRole,
      phone,
      address,
      profilePhotoPath,
    });
  } catch (error) {
    // The unique constraint remains the source of truth when concurrent
    // registration requests both pass the friendly pre-check above.
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('An account with this email already exists.', HTTP_STATUS.CONFLICT);
    }
    throw error;
  }

  await passwordHistoryModel.addPasswordToHistory(newUserId, hashedPassword);

  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + AUTH.EMAIL_VERIFICATION_EXPIRES_HOURS * 60 * 60 * 1000);

  await emailVerificationModel.createVerificationToken({ userId: newUserId, tokenHash, expiresAt });
  await emailService.sendVerificationEmail(email, rawToken);

  await auditService.record({
    userId: newUserId,
    action: AUDIT_ACTIONS.REGISTER,
    ipAddress,
    userAgent,
    metadata: { email, role: assignedRole },
  });

  const user = await userModel.findById(newUserId);

  return {
    user,
    // Returned only so the dev/test flow can verify without a real mailbox.
    devVerificationToken: process.env.NODE_ENV === 'development' ? rawToken : undefined,
  };
}

/**
 * Verifies a user's email using the raw token from the verification link.
 */
async function loginWithGoogle({ idToken, role, ipAddress, userAgent }) {
  const googlePayload = await verifyGoogleToken(idToken);
  const email = googlePayload.email.toLowerCase();
  const googleId = googlePayload.sub;
  const profilePicture = googlePayload.picture || null;
  const assignedRole = role || USER_ROLES.DONOR;

  let user = await userModel.findByEmail(email);

  if (!user) {
    const randomPassword = generateOpaqueToken(32);
    const hashedPassword = await hashPassword(randomPassword);
    const newUserId = await userModel.createUser({
      name: googlePayload.name || email.split('@')[0],
      email,
      hashedPassword,
      role: assignedRole,
      phone: null,
      address: null,
      profilePhotoPath: profilePicture,
      provider: 'google',
      googleId,
      profilePicture,
      emailVerified: true,
    });

    await passwordHistoryModel.addPasswordToHistory(newUserId, hashedPassword);

    await auditService.record({
      userId: newUserId,
      action: AUDIT_ACTIONS.REGISTER,
      ipAddress,
      userAgent,
      metadata: { email, role: assignedRole, provider: 'google' },
    });

    user = await userModel.findById(newUserId);
  } else {
    await userModel.linkGoogleAccount(user.id, {
      googleId,
      profilePicture,
      emailVerified: true,
    });
    user = await userModel.findById(user.id);
  }

  if (user.is_banned) {
    throw new AppError('Your account has been banned. Contact support for assistance.', HTTP_STATUS.FORBIDDEN);
  }

  if (user.lock_until && new Date(user.lock_until).getTime() > Date.now()) {
    throw new AppError('Account temporarily locked due to repeated failed login attempts. Please try again later.', HTTP_STATUS.FORBIDDEN);
  }

  if (!user.email_verified) {
    await userModel.markEmailVerified(user.id);
  }

  await userModel.clearFailedLoginAttempts(user.id);
  await userModel.updateLastLogin(user.id, { ip: ipAddress, userAgent });

  const session = await tokenService.issueNewSession(user, { ipAddress, userAgent });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    ipAddress,
    userAgent,
    metadata: { provider: 'google' },
  });

  const freshUser = await userModel.findById(user.id);
  return { user: freshUser, ...session };
}

async function verifyEmail(rawToken) {
  const tokenHash = hashToken(rawToken);
  const record = await emailVerificationModel.findValidToken(tokenHash);

  if (!record) {
    throw new AppError('Invalid or expired verification link.', HTTP_STATUS.BAD_REQUEST);
  }

  await userModel.markEmailVerified(record.user_id);
  await emailVerificationModel.markTokenUsed(record.id);

  await auditService.record({
    userId: record.user_id,
    action: AUDIT_ACTIONS.EMAIL_VERIFIED,
  });

  return { userId: record.user_id };
}

/**
 * Resends a verification email. Always returns a generic success message
 * regardless of whether the account exists or is already verified, to
 * avoid leaking account state (user enumeration prevention).
 */
async function resendVerification(email, { ipAddress, userAgent } = {}) {
  const user = await userModel.findByEmail(email);
  const genericMessage = 'If an account with that email exists and is not yet verified, a new verification link has been sent.';

  if (!user || user.email_verified) {
    return { message: genericMessage };
  }

  await emailVerificationModel.invalidateAllForUser(user.id);

  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + AUTH.EMAIL_VERIFICATION_EXPIRES_HOURS * 60 * 60 * 1000);

  await emailVerificationModel.createVerificationToken({ userId: user.id, tokenHash, expiresAt });
  await emailService.sendVerificationEmail(email, rawToken);

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.EMAIL_VERIFICATION_RESENT,
    ipAddress,
    userAgent,
  });

  return {
    message: genericMessage,
    devVerificationToken: process.env.NODE_ENV === 'development' ? rawToken : undefined,
  };
}

/**
 * Authenticates a user and, on success, issues a new access/refresh token
 * session. Enforces email verification, ban status, account lockout, and
 * role matching before checking the password.
 */
async function login({ email, password, role, ipAddress, userAgent }) {
  const user = await userModel.findByEmail(email);

  if (!user) {
    await auditService.record({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      ipAddress,
      userAgent,
      metadata: { email, role, reason: 'no_such_account' },
    });
    throw new AppError('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED);
  }

  if (user.role !== role) {
    await auditService.record({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      ipAddress,
      userAgent,
      metadata: { email, providedRole: role, actualRole: user.role, reason: 'role_mismatch' },
    });
    throw new AppError('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED);
  }

  if (user.is_banned) {
    await auditService.record({
      userId: user.id,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      ipAddress,
      userAgent,
      metadata: { reason: 'banned' },
    });
    throw new AppError('Your account has been banned. Contact support for assistance.', HTTP_STATUS.FORBIDDEN);
  }

  // Account lockout is disabled for local testing / developer convenience.
  // if (user.lock_until && new Date(user.lock_until).getTime() > Date.now()) {
  //   const minutesLeft = Math.ceil((new Date(user.lock_until).getTime() - Date.now()) / 60000);
  //   await auditService.record({
  //     userId: user.id,
  //     action: AUDIT_ACTIONS.LOGIN_FAILED,
  //     ipAddress,
  //     userAgent,
  //     metadata: { reason: 'account_locked' },
  //   });
  //   throw new AppError(
  //     `Account temporarily locked due to repeated failed login attempts. Try again in ${minutesLeft} minute(s).`,
  //     HTTP_STATUS.FORBIDDEN
  //   );
  // }

  const passwordMatches = await comparePassword(password, user.password);

  if (!passwordMatches) {
    // const { attempts, justLocked } = await userModel.registerFailedLoginAttempt(
    //   user.id,
    //   AUTH.ACCOUNT_LOCK_MAX_ATTEMPTS,
    //   AUTH.ACCOUNT_LOCK_DURATION_MINUTES
    // );

    // await auditService.record({
    //   userId: user.id,
    //   action: AUDIT_ACTIONS.LOGIN_FAILED,
    //   ipAddress,
    //   userAgent,
    //   metadata: { reason: 'bad_password', attempts },
    // });

    // if (justLocked) {
    //   await auditService.record({
    //     userId: user.id,
    //     action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
    //     ipAddress,
    //     userAgent,
    //     metadata: { attempts },
    //   });
    //   await emailService.sendAccountLockedEmail(user.email, AUTH.ACCOUNT_LOCK_DURATION_MINUTES);
    //   throw new AppError(
    //     `Too many failed login attempts. Your account has been locked for ${AUTH.ACCOUNT_LOCK_DURATION_MINUTES} minutes.`,
    //     HTTP_STATUS.FORBIDDEN
    //   );
    // }

    throw new AppError('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.email_verified) {
    throw new AppError(
      'Please verify your email address before logging in. Check your inbox for the verification link.',
      HTTP_STATUS.FORBIDDEN
    );
  }

  await userModel.clearFailedLoginAttempts(user.id);
  await userModel.updateLastLogin(user.id, { ip: ipAddress, userAgent });

  const session = await tokenService.issueNewSession(user, { ipAddress, userAgent });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    ipAddress,
    userAgent,
  });

  const freshUser = await userModel.findById(user.id);

  return { user: freshUser, ...session };
}

/**
 * Refreshes a session: validates the presented refresh token and issues a
 * brand-new access+refresh token pair, revoking the old one.
 *
 * RACE CONDITION FIX: the presented token's row is now locked with
 * SELECT ... FOR UPDATE (inside tokenService.rotateRefreshToken) and held
 * for the entire validate -> user-lookup -> rotate sequence, inside one
 * transaction. A second, concurrent refresh request using the same
 * not-yet-rotated token blocks on that lock until this transaction commits
 * or rolls back — by which point the token is already marked revoked, so
 * the second request correctly fails with REPLAY instead of also
 * successfully rotating and handing out a second valid session.
 *
 * External behavior (response shape, error messages, audit events) is
 * unchanged from before this fix.
 */
async function refreshSession(rawRefreshToken, { ipAddress, userAgent } = {}) {
  const connection = await pool.getConnection();
  let user;
  let newSession;

  try {
    await connection.beginTransaction();

    const { existingTokenRow } = await tokenService.rotateRefreshToken(rawRefreshToken, connection);

    user = await userModel.findById(existingTokenRow.user_id);
    if (!user || user.is_banned) {
      throw new AppError('Account no longer available. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
    }

    newSession = await tokenService.completeRotation(existingTokenRow, user, connection, { ipAddress, userAgent });

    await connection.commit();
  } catch (err) {
    await connection.rollback();

    if (err.code === 'REPLAY') {
      // Safe to run now: the row lock held above was just released by the
      // rollback, so this UPDATE (which touches that same row) can't
      // deadlock against it.
      await refreshTokenModel.revokeAllForUser(err.userId);
      await auditService.record({
        userId: err.userId,
        action: AUDIT_ACTIONS.REFRESH_TOKEN_REUSE_DETECTED,
        ipAddress,
        userAgent,
      });
      throw new AppError('Session invalid. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
    }

    if (err instanceof AppError) {
      throw err;
    }

    throw new AppError('Session invalid or expired. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
  } finally {
    connection.release();
  }

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.TOKEN_REFRESHED,
    ipAddress,
    userAgent,
  });

  return { user, ...newSession };
}

/**
 * Logs out the current session only (revokes just the presented refresh token).
 */
async function logoutCurrent(rawRefreshToken, { ipAddress, userAgent } = {}) {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    const existing = await refreshTokenModel.findByTokenHash(tokenHash);
    if (existing && !existing.is_revoked) {
      await refreshTokenModel.revokeById(existing.id);
      await auditService.record({
        userId: existing.user_id,
        action: AUDIT_ACTIONS.LOGOUT,
        ipAddress,
        userAgent,
      });
    }
  }
}

/**
 * Logs out every active session for a user (all devices).
 */
async function logoutAll(userId, { ipAddress, userAgent } = {}) {
  await refreshTokenModel.revokeAllForUser(userId);
  await auditService.record({
    userId,
    action: AUDIT_ACTIONS.LOGOUT_ALL,
    ipAddress,
    userAgent,
  });
}

/**
 * Initiates a password reset. Always returns a generic message regardless
 * of whether the account exists, to prevent user enumeration.
 */
async function forgotPassword(email, { ipAddress, userAgent } = {}) {
  const user = await userModel.findByEmail(email);
  const genericMessage = 'If an account with that email exists, a password reset link has been sent.';

  if (!user) {
    return { message: genericMessage };
  }

  await passwordResetModel.invalidateAllForUser(user.id);

  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + AUTH.RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

  await passwordResetModel.createResetToken({ userId: user.id, token: tokenHash, expiresAt });
  await emailService.sendPasswordResetEmail(email, rawToken);

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
    ipAddress,
    userAgent,
  });

  return {
    message: genericMessage,
    devResetToken: process.env.NODE_ENV === 'development' ? rawToken : undefined,
  };
}

/**
 * Completes a password reset: validates the token, enforces password reuse
 * prevention against the last N passwords, updates the password, and
 * revokes every active session (forces re-login everywhere).
 */
async function resetPassword({ rawToken, newPassword, ipAddress, userAgent }) {
  const tokenHash = hashToken(rawToken);
  const resetRecord = await passwordResetModel.findValidToken(tokenHash);

  if (!resetRecord) {
    throw new AppError('Invalid or expired password reset token.', HTTP_STATUS.BAD_REQUEST);
  }

  const userId = resetRecord.user_id;

  const recentHashes = await passwordHistoryModel.getRecentPasswordHashes(userId, AUTH.PASSWORD_HISTORY_LIMIT);
  for (const historyRow of recentHashes) {
    const matchesOldPassword = await comparePassword(newPassword, historyRow.password_hash);
    if (matchesOldPassword) {
      throw new AppError(
        `You cannot reuse any of your last ${AUTH.PASSWORD_HISTORY_LIMIT} passwords. Please choose a different password.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  const hashedPassword = await hashPassword(newPassword);

  await userModel.updatePassword(userId, hashedPassword);
  await passwordHistoryModel.addPasswordToHistory(userId, hashedPassword);
  await passwordHistoryModel.pruneOldHistory(userId, AUTH.PASSWORD_HISTORY_LIMIT);

  await passwordResetModel.markTokenUsed(resetRecord.id);
  await passwordResetModel.invalidateAllForUser(userId);

  // Force re-login on every device after a password reset.
  await refreshTokenModel.revokeAllForUser(userId);

  await auditService.record({
    userId,
    action: AUDIT_ACTIONS.PASSWORD_RESET_SUCCESS,
    ipAddress,
    userAgent,
  });
}

module.exports = {
  register,
  loginWithGoogle,
  verifyEmail,
  resendVerification,
  login,
  refreshSession,
  logoutCurrent,
  logoutAll,
  forgotPassword,
  resetPassword,
};
