const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `notification_settings` table.
 * Provides CRUD operations for notification preferences for all user types.
 */

const BASE_COLUMNS = `
  id, user_id, email_notifications, sms_notifications, push_notifications,
  donation_updates, pickup_updates, chat_notifications, created_at, updated_at
`;

/**
 * Creates or updates notification settings for a user.
 * Uses INSERT ... ON DUPLICATE KEY UPDATE for upsert behavior.
 * @param {Object} data - Notification settings data
 * @param {number} data.userId - ID of the user
 * @param {boolean} data.emailNotifications - Email notifications enabled
 * @param {boolean} data.smsNotifications - SMS notifications enabled
 * @param {boolean} data.pushNotifications - Push notifications enabled
 * @param {boolean} data.donationUpdates - Donation updates enabled
 * @param {boolean} data.pickupUpdates - Pickup updates enabled
 * @param {boolean} data.chatNotifications - Chat notifications enabled
 * @returns {Promise<number>} The insert ID or existing ID
 */
async function upsert({
  userId,
  emailNotifications,
  smsNotifications,
  pushNotifications,
  donationUpdates,
  pickupUpdates,
  chatNotifications,
}) {
  const [result] = await pool.query(
    `INSERT INTO notification_settings
       (user_id, email_notifications, sms_notifications, push_notifications,
        donation_updates, pickup_updates, chat_notifications)
     VALUES (:userId, :emailNotifications, :smsNotifications, :pushNotifications,
             :donationUpdates, :pickupUpdates, :chatNotifications)
     ON DUPLICATE KEY UPDATE
       email_notifications = VALUES(email_notifications),
       sms_notifications = VALUES(sms_notifications),
       push_notifications = VALUES(push_notifications),
       donation_updates = VALUES(donation_updates),
       pickup_updates = VALUES(pickup_updates),
       chat_notifications = VALUES(chat_notifications)`,
    {
      userId,
      emailNotifications: emailNotifications !== undefined ? (emailNotifications ? 1 : 0) : 1,
      smsNotifications: smsNotifications !== undefined ? (smsNotifications ? 1 : 0) : 0,
      pushNotifications: pushNotifications !== undefined ? (pushNotifications ? 1 : 0) : 1,
      donationUpdates: donationUpdates !== undefined ? (donationUpdates ? 1 : 0) : 1,
      pickupUpdates: pickupUpdates !== undefined ? (pickupUpdates ? 1 : 0) : 1,
      chatNotifications: chatNotifications !== undefined ? (chatNotifications ? 1 : 0) : 1,
    }
  );
  return result.insertId || result.affectedRows > 0 ? userId : null;
}

/**
 * Finds notification settings by user ID.
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Notification settings object or null if not found
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM notification_settings WHERE user_id = :userId LIMIT 1`,
    { userId }
  );
  return rows[0] || null;
}

/**
 * Updates specific fields of notification settings.
 * @param {number} userId - User ID
 * @param {Object} fields - Fields to update
 * @returns {Promise<void>}
 */
async function updateByUserId(userId, fields) {
  const setClauses = [];
  const params = { userId };

  const fieldMap = {
    emailNotifications: 'email_notifications',
    smsNotifications: 'sms_notifications',
    pushNotifications: 'push_notifications',
    donationUpdates: 'donation_updates',
    pickupUpdates: 'pickup_updates',
    chatNotifications: 'chat_notifications',
  };

  Object.keys(fields).forEach((camelKey) => {
    if (fields[camelKey] !== undefined && fieldMap[camelKey]) {
      const snakeKey = fieldMap[camelKey];
      setClauses.push(`${snakeKey} = :${camelKey}`);
      params[camelKey] = fields[camelKey] === true ? 1 : fields[camelKey] === false ? 0 : fields[camelKey];
    }
  });

  if (setClauses.length === 0) return;

  await pool.query(
    `UPDATE notification_settings SET ${setClauses.join(', ')} WHERE user_id = :userId`,
    params
  );
}

/**
 * Deletes notification settings for a user.
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteByUserId(userId) {
  await pool.query(`DELETE FROM notification_settings WHERE user_id = :userId`, { userId });
}

module.exports = {
  upsert,
  findByUserId,
  updateByUserId,
  deleteByUserId,
};
