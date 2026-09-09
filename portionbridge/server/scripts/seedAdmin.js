require('dotenv').config();

const { pool } = require('../config/db');
const { USER_ROLES } = require('../constants');
const { hashPassword } = require('../utils/password');
const userModel = require('../models/user.model');
const passwordHistoryModel = require('../models/passwordHistory.model');

/**
 * Startup-safe admin account initializer.
 *
 * Creates (or upgrades) exactly one hard-coded Admin account using the
 * project's existing auth stack — same bcrypt hashing (utils/password),
 * same users table / user.model.js data-access layer, same role system
 * (USER_ROLES.ADMIN) already enforced by middleware/auth.middleware.js's
 * authorize('admin'). No separate/duplicate auth logic is introduced.
 *
 * Idempotent, like scripts/migrate.js:
 *   - Email not registered yet -> create the account directly as an
 *     active, email-verified admin (skips the email-verification-link
 *     step, same as how register() only requires it for public signups).
 *   - Email already registered with role='admin' -> no-op.
 *   - Email already registered with a different role -> promote that
 *     existing account to role='admin' in place, so a second run (or a
 *     donor/volunteer account that happens to reuse this email) never
 *     produces a duplicate row.
 *
 * Run with: npm run seed:admin
 */

const ADMIN_NAME = 'Taohid Bhuiyan';
const ADMIN_EMAIL = 'taohid_admin@gmail.com';
const ADMIN_PASSWORD = 'Admin1@Taohid';

async function seedAdmin() {
  const existing = await userModel.findByEmail(ADMIN_EMAIL);

  if (existing) {
    if (existing.role === USER_ROLES.ADMIN) {
      console.log(`[SeedAdmin] ${ADMIN_EMAIL} already exists as admin (id=${existing.id}); nothing to do.`);
      return;
    }

    await userModel.updateRole(existing.id, USER_ROLES.ADMIN);
    console.log(`[SeedAdmin] Existing account (id=${existing.id}, was role="${existing.role}") promoted to role="admin".`);
    return;
  }

  const hashedPassword = await hashPassword(ADMIN_PASSWORD);

  const newUserId = await userModel.createUser({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    hashedPassword,
    role: USER_ROLES.ADMIN,
    phone: null,
    address: null,
    profilePhotoPath: null,
    provider: null,
    googleId: null,
    profilePicture: null,
    // Active/enabled immediately: is_banned/is_deleted default to 0 in the
    // schema, and email_verified is set true here (mirrors the dev-only
    // auto-verify convenience in auth.service.js#register) since this
    // account is created directly by an operator, not through the public
    // self-registration + email-link flow.
    emailVerified: true,
    phoneVerified: false,
  });

  // Mirrors auth.service.js#register, which records every new password
  // hash into password_history for reuse-prevention on future changes.
  await passwordHistoryModel.addPasswordToHistory(newUserId, hashedPassword);

  console.log(`[SeedAdmin] Created admin account (id=${newUserId}), email=${ADMIN_EMAIL}.`);
}

seedAdmin()
  .catch((error) => {
    console.error('[SeedAdmin] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
