const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `users` table.
 * No ORM — every query is explicit, parameterized SQL via mysql2 named placeholders.
 * All read queries exclude soft-deleted rows (is_deleted = 0) unless stated otherwise.
 */

const BASE_SAFE_COLUMNS = `
  id, name, email, role, phone, address, profile_photo, provider, google_id, profile_picture,
  is_banned, is_deleted, email_verified, phone_verified, failed_login_attempts, lock_until,
  last_login_at, last_login_ip, last_user_agent, date_of_birth, gender, created_at, updated_at
`;

/**
 * Finds a user by email, including the password hash — used only for login,
 * where the hash is needed for bcrypt comparison. Callers must strip the
 * password field (see utils/helpers.sanitizeUser) before sending a response.
 */
async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ${BASE_SAFE_COLUMNS}, password
     FROM users
     WHERE email = :email AND is_deleted = 0
     LIMIT 1`,
    { email }
  );
  return rows[0] || null;
}

/**
 * Finds a user by ID, excluding the password hash entirely.
 * Safe to return directly in API responses (already excludes the hash).
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${BASE_SAFE_COLUMNS}
     FROM users
     WHERE id = :id AND is_deleted = 0
     LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Checks whether an email is already registered, regardless of soft-delete state,
 * since the UNIQUE constraint on `email` applies to all rows including deleted ones.
 */
async function emailExists(email) {
  const [rows] = await pool.query(
    `SELECT id FROM users WHERE email = :email LIMIT 1`,
    { email }
  );
  return rows.length > 0;
}

/**
 * Inserts a new user row. New accounts always start with email_verified = 0
 * (the column default) — they cannot log in until verified. Returns the
 * newly created user's auto-increment ID.
 */
async function createUser({ name, email, hashedPassword, role, phone, address, profilePhotoPath, provider, googleId, profilePicture, emailVerified }) {
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password, role, phone, address, profile_photo, provider, google_id, profile_picture, email_verified)
     VALUES (:name, :email, :password, :role, :phone, :address, :profilePhotoPath, :provider, :googleId, :profilePicture, :emailVerified)`,
    {
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || null,
      address: address || null,
      profilePhotoPath: profilePhotoPath || null,
      provider: provider || null,
      googleId: googleId || null,
      profilePicture: profilePicture || null,
      emailVerified: emailVerified ? 1 : 0,
    }
  );
  return result.insertId;
}

/**
 * Updates a user's password hash (used by the reset-password flow).
 */
async function updatePassword(userId, hashedPassword) {
  await pool.query(
    `UPDATE users SET password = :password WHERE id = :id`,
    { password: hashedPassword, id: userId }
  );
}

/**
 * Marks the user's email as verified.
 */
async function markEmailVerified(userId) {
  await pool.query(
    `UPDATE users SET email_verified = 1 WHERE id = :id`,
    { id: userId }
  );
}

async function linkGoogleAccount(userId, { googleId, profilePicture, emailVerified }) {
  await pool.query(
    `UPDATE users
     SET provider = COALESCE(provider, 'google'),
         google_id = :googleId,
         profile_picture = COALESCE(profile_picture, :profilePicture),
         email_verified = CASE WHEN :emailVerified THEN 1 ELSE email_verified END
     WHERE id = :id`,
    { id: userId, googleId, profilePicture: profilePicture || null, emailVerified: emailVerified ? 1 : 0 }
  );
}

/**
 * Increments the failed-login counter for a user, and — if the resulting
 * count reaches the configured threshold — sets `lock_until` to lock the
 * account for the configured duration. Returns the updated attempt count
 * and whether the account was just locked, so the caller can log/respond
 * appropriately.
 */
async function registerFailedLoginAttempt(userId, maxAttempts, lockDurationMinutes) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT failed_login_attempts, lock_until
       FROM users
       WHERE id = :id
       FOR UPDATE`,
      { id: userId }
    );

    const user = rows[0];
    if (!user) {
      return { attempts: 0, justLocked: false };
    }

    const attempts = Number(user.failed_login_attempts) + 1;
    const justLocked = attempts >= maxAttempts;

    await connection.query(
      `UPDATE users
       SET failed_login_attempts = :attempts,
           lock_until = CASE
             WHEN :justLocked THEN DATE_ADD(NOW(), INTERVAL :lockMinutes MINUTE)
             ELSE lock_until
           END
       WHERE id = :id`,
      { attempts, justLocked, lockMinutes: lockDurationMinutes, id: userId }
    );

    await connection.commit();
    return { attempts, justLocked };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Resets the failed-login counter and clears any active lock — called after
 * a successful login.
 */
async function clearFailedLoginAttempts(userId) {
  await pool.query(
    `UPDATE users SET failed_login_attempts = 0, lock_until = NULL WHERE id = :id`,
    { id: userId }
  );
}

/**
 * Records login metadata (timestamp, IP, user agent) after a successful login.
 */
async function updateLastLogin(userId, { ip, userAgent }) {
  await pool.query(
    `UPDATE users
     SET last_login_at = NOW(), last_login_ip = :ip, last_user_agent = :userAgent
     WHERE id = :id`,
    { ip: ip || null, userAgent: userAgent || null, id: userId }
  );
}

/**
 * Updates a user's profile photo path.
 * @param {number} userId - User ID
 * @param {string} photoPath - Path to the uploaded photo relative to uploads directory
 */
async function updateProfilePhoto(userId, photoPath) {
  await pool.query(
    `UPDATE users SET profile_photo = :photoPath WHERE id = :id`,
    { photoPath, id: userId }
  );
}

/**
 * Updates a user's profile information.
 * @param {number} userId - User ID
 * @param {Object} fields - Fields to update
 * @returns {Promise<void>}
 */
async function updateProfile(userId, fields) {
  const setClauses = [];
  const params = { id: userId };

  const fieldMap = {
    name: 'name',
    phone: 'phone',
    address: 'address',
    dateOfBirth: 'date_of_birth',
    gender: 'gender',
  };

  Object.keys(fields).forEach((camelKey) => {
    if (fields[camelKey] !== undefined && fieldMap[camelKey]) {
      const snakeKey = fieldMap[camelKey];
      setClauses.push(`${snakeKey} = :${camelKey}`);
      params[camelKey] = fields[camelKey];
    }
  });

  if (setClauses.length === 0) return;

  await pool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = :id`, params);
}

/**
 * Updates a user's email address.
 * @param {number} userId - User ID
 * @param {string} newEmail - New email address
 * @returns {Promise<void>}
 */
async function updateEmail(userId, newEmail) {
  await pool.query(
    `UPDATE users SET email = :newEmail, email_verified = 0 WHERE id = :id`,
    { newEmail, id: userId }
  );
}

/**
 * Updates a user's phone number.
 * @param {number} userId - User ID
 * @param {string} newPhone - New phone number
 * @returns {Promise<void>}
 */
async function updatePhone(userId, newPhone) {
  await pool.query(
    `UPDATE users SET phone = :newPhone, phone_verified = 0 WHERE id = :id`,
    { newPhone, id: userId }
  );
}

/**
 * Marks a user's phone as verified.
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function markPhoneVerified(userId) {
  await pool.query(
    `UPDATE users SET phone_verified = 1 WHERE id = :id`,
    { id: userId }
  );
}

module.exports = {
  findByEmail,
  findById,
  emailExists,
  createUser,
  updatePassword,
  markEmailVerified,
  linkGoogleAccount,
  registerFailedLoginAttempt,
  clearFailedLoginAttempts,
  updateLastLogin,
  updateProfilePhoto,
  updateProfile,
  updateEmail,
  updatePhone,
  markPhoneVerified,
};
