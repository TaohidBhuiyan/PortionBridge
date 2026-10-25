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
async function create(connection, {
  userId, type, title, message, relatedId = null,
  incidentId = null, reliefRequestId = null, reliefPledgeId = null, alertEventId = null, severity = null,
}) {
  const [result] = await connection.query(
    `INSERT INTO notifications
       (user_id, type, title, message, related_id, incident_id, relief_request_id, relief_pledge_id, alert_event_id, severity)
     VALUES (:userId, :type, :title, :message, :relatedId, :incidentId, :reliefRequestId, :reliefPledgeId, :alertEventId, :severity)`,
    { userId, type, title, message, relatedId, incidentId, reliefRequestId, reliefPledgeId, alertEventId, severity }
  );
  return result.insertId;
}

/**
 * Columns returned to clients. The incident status / last-update time are read LIVE
 * from disaster_incidents (not copied) so an inbox entry always shows the incident's
 * current state; `severity` is the alert severity at the time the notice was issued.
 * Notifications that do not relate to an incident simply return NULL for these.
 */
const NOTIFICATION_COLUMNS = `
  n.id, n.user_id, n.type, n.title, n.message, n.related_id, n.incident_id, n.relief_request_id,
  n.relief_pledge_id, n.alert_event_id, n.severity, n.is_read, n.created_at,
  di.status AS incident_status, di.updated_at AS incident_updated_at
`;
const NOTIFICATION_FROM = `FROM notifications n LEFT JOIN disaster_incidents di ON di.id = n.incident_id`;

/**
 * Finds a single notification by id — used right after create() to fetch
 * a fully-formed row (with real id/created_at) for real-time delivery.
 * @param {number} id - Notification ID
 * @returns {Promise<Object|null>} Notification object or null if not found
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${NOTIFICATION_COLUMNS} ${NOTIFICATION_FROM}
     WHERE n.id = :id
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
    `SELECT ${NOTIFICATION_COLUMNS} ${NOTIFICATION_FROM}
     WHERE n.user_id = :userId AND n.related_id = :relatedId
     ORDER BY n.created_at DESC, n.id DESC
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
  const conditions = ['n.user_id = :userId'];
  const params = { userId };

  if (status === 'read') {
    conditions.push('n.is_read = 1');
  } else if (status === 'unread') {
    conditions.push('n.is_read = 0');
  }

  if (type) {
    conditions.push('n.type = :type');
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
    `SELECT ${NOTIFICATION_COLUMNS} ${NOTIFICATION_FROM}
     WHERE ${whereClause}
     ORDER BY n.created_at DESC, n.id DESC
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
    `SELECT COUNT(*) AS total FROM notifications n WHERE ${whereClause}`,
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

/**
 * Fan-out insert for one alert event. INSERT IGNORE + the UNIQUE (user_id, alert_event_id)
 * key make this safe to repeat: a user who already has the notice for this event is
 * skipped. Returns the ids of the rows that were actually created by THIS call.
 */
async function insertAlertBatch(userIds, n) {
  if (!userIds.length) return [];
  const [[{ maxId }]] = await pool.query('SELECT COALESCE(MAX(id), 0) AS maxId FROM notifications');
  const params = {
    type: n.type, title: n.title, message: n.message, relatedId: n.relatedId, incidentId: n.incidentId,
    reliefRequestId: n.reliefRequestId ?? null, alertEventId: n.alertEventId, severity: n.severity,
  };
  const values = userIds.map((id, i) => { params[`u${i}`] = id; return `(:u${i}, :type, :title, :message, :relatedId, :incidentId, :reliefRequestId, :alertEventId, :severity)`; });
  await pool.query(
    `INSERT IGNORE INTO notifications
       (user_id, type, title, message, related_id, incident_id, relief_request_id, alert_event_id, severity)
     VALUES ${values.join(', ')}`,
    params
  );
  const idParams = { alertEventId: n.alertEventId, maxId };
  const names = userIds.map((id, i) => { idParams[`u${i}`] = id; return `:u${i}`; });
  const [rows] = await pool.query(
    `SELECT ${NOTIFICATION_COLUMNS} ${NOTIFICATION_FROM}
      WHERE n.alert_event_id = :alertEventId AND n.id > :maxId AND n.user_id IN (${names.join(', ')})`,
    idParams
  );
  return rows;
}

async function countForAlertEvent(alertEventId) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM notifications WHERE alert_event_id = :alertEventId', { alertEventId });
  return Number(rows[0].total);
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
  insertAlertBatch,
  countForAlertEvent,
};
