const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `notifications` table.
 *
 * Most notifications (donation accepted, donation completed) are created
 * automatically by the trg_donation_status_update DB trigger. Others
 * (on-the-way, picked-up, ratings, pickup-scheduled, new chat messages)
 * are inserted explicitly by application code. This model is reused for
 * both — `create` is called directly with either a transaction connection
 * or `pool` itself (both expose the same `.query()` interface).
 */

/**
 * Inserts a new notification for a user.
 * @param {Object} connection - Active transaction connection, or `pool` for a standalone insert
 * @param {Object} params
 * @param {number} params.userId - Recipient user ID
 * @param {string} params.type - One of NOTIFICATION_TYPES in constants/index.js
 * @param {string} params.title - Short notification title
 * @param {string} params.message - Notification body
 * @param {number|null} [params.relatedId] - Related donation/entity ID
 * @returns {Promise<number>} Insert ID of the new notification
 */
async function create(connection, { userId, type, title, message, relatedId = null }) {
  const [result] = await connection.query(
    `INSERT INTO notifications (user_id, type, title, message, related_id)
     VALUES (:userId, :type, :title, :message, :relatedId)`,
    { userId, type, title, message, relatedId }
  );
  return result.insertId;
}

/**
 * Finds a single notification by id — used right after create() to fetch
 * a fully-formed row (with real id/created_at) for real-time delivery.
 * @param {number} id - Notification ID
 * @returns {Promise<Object|null>} Notification object or null if not found
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, user_id, type, title, message, related_id, is_read, created_at
     FROM notifications
     WHERE id = :id
     LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Finds the most recent notification for a (user, related entity) pair.
 * Used when a DB TRIGGER — not application code — is what actually
 * inserted the row, so there's no insertId available to fetch by
 * directly. Safe to treat as "the" notification just created because the
 * caller's own row lock on the related entity (e.g. SELECT ... FOR UPDATE
 * on the donation) already guarantees no concurrent write could have
 * raced another notification for that same (user, donation) pair into
 * existence first.
 * @param {number} userId - Recipient user ID
 * @param {number} relatedId - The related entity's id (e.g. donation id)
 * @returns {Promise<Object|null>} Most recent matching notification, or null
 */
async function findLatestForUserAndRelated(userId, relatedId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, type, title, message, related_id, is_read, created_at
     FROM notifications
     WHERE user_id = :userId AND related_id = :relatedId
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    { userId, relatedId }
  );
  return rows[0] || null;
}

/**
 * Count of unread notifications for a user — powers the
 * notification_count_updated socket event and the get_unread_count sync event.
 * @param {number} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
async function countUnreadByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications WHERE user_id = :userId AND is_read = 0`,
    { userId }
  );
  return rows[0].total;
}

/**
 * Builds the shared WHERE clause + params for a user's notification list.
 * `status` is a derived filter (not a raw column check), matching the
 * same 'active'/'banned'/'deleted' pattern already used for admin user
 * filtering elsewhere in the app.
 * @param {Object} filters
 * @param {number} filters.userId - Owner's user ID
 * @param {string} [filters.status] - 'read' | 'unread'
 * @param {string} [filters.type] - Notification type filter
 * @returns {Object} Object containing whereClause string and params object
 */
function buildNotificationFilter({ userId, status, type }) {
  const conditions = ['user_id = :userId'];
  const params = { userId };

  if (status === 'read') {
    conditions.push('is_read = 1');
  } else if (status === 'unread') {
    conditions.push('is_read = 0');
  }

  if (type) {
    conditions.push('type = :type');
    params.type = type;
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Lists a user's notifications, newest first, with optional read-status
 * and type filters, and pagination.
 * @param {Object} options
 * @param {number} options.userId - Owner's user ID
 * @param {string} [options.status] - 'read' | 'unread'
 * @param {string} [options.type] - Notification type filter
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of notification objects
 */
async function findByUserId({ userId, status, type, limit, offset }) {
  const { whereClause, params } = buildNotificationFilter({ userId, status, type });

  const [rows] = await pool.query(
    `SELECT id, user_id, type, title, message, related_id, is_read, created_at
     FROM notifications
     WHERE ${whereClause}
     ORDER BY created_at DESC, id DESC
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

/**
 * Total count matching the same filters as findByUserId. Powers pagination meta.
 * @param {Object} filters - Filter options (same as buildNotificationFilter)
 * @returns {Promise<number>} Total count of matching notifications
 */
async function countByUserId({ userId, status, type }) {
  const { whereClause, params } = buildNotificationFilter({ userId, status, type });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications WHERE ${whereClause}`,
    params
  );
  return rows[0].total;
}

/**
 * Marks a single notification as read. Idempotent by nature — running
 * this on an already-read row just sets is_read = 1 to 1, a harmless no-op.
 * @param {number} id - Notification ID
 * @returns {Promise<void>}
 */
async function markAsRead(id) {
  await pool.query(`UPDATE notifications SET is_read = 1 WHERE id = :id`, { id });
}

/**
 * Marks every unread notification for a user as read in one statement.
 * @param {number} userId - Owner's user ID
 * @returns {Promise<number>} Number of rows actually updated
 */
async function markAllAsReadForUser(userId) {
  const [result] = await pool.query(
    `UPDATE notifications SET is_read = 1 WHERE user_id = :userId AND is_read = 0`,
    { userId }
  );
  return result.affectedRows;
}

module.exports = {
  create,
  findById,
  findLatestForUserAndRelated,
  countUnreadByUserId,
  findByUserId,
  countByUserId,
  markAsRead,
  markAllAsReadForUser,
};
