const { HTTP_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const { pool } = require('../config/db');
const notificationModel = require('../models/notification.model');
const teamMemberModel = require('../models/teamMember.model');
const { getIO } = require('../sockets/ioInstance');
const socketRegistry = require('../sockets/socketRegistry');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

/**
 * Emits a Socket.io event to every active socket belonging to a user
 * (all open tabs/devices receive it). If the user has no active sockets
 * (offline) or the socket server hasn't been initialized, this is a
 * silent no-op — the notification is already safely persisted in MySQL
 * and will be available through the REST API (Module 5) whenever the
 * user next connects.
 * @param {number} userId - Recipient's user ID
 * @param {string} event - Socket.io event name
 * @param {*} payload - Event payload
 */
function emitToUser(userId, event, payload) {
  const io = getIO();
  if (!io) return;

  const socketIds = socketRegistry.getSocketIds(userId);
  socketIds.forEach((socketId) => io.to(socketId).emit(event, payload));
}

/**
 * Delivers an already-persisted notification to a user in real time, and
 * separately pushes their updated unread count. NEVER inserts anything —
 * every caller has already created the notification row itself (via a DB
 * trigger or an explicit notificationModel.create call) before reaching
 * this function; the actual insert is caller-specific business logic
 * (which user, what type/title/message) that this generic delivery layer
 * has no business duplicating.
 *
 * Deliberately fire-and-forget from the caller's perspective: a failure
 * here (e.g. a transient error on the count query) must never bubble up
 * and fail the write that triggered it — the notification is already
 * safely in MySQL regardless.
 * @param {number} recipientUserId - Who should receive this notification
 * @param {Object} notification - The full, already-persisted notification row
 * @returns {Promise<void>}
 */
async function deliver(recipientUserId, notification) {
  try {
    emitToUser(recipientUserId, 'notification', notification);

    const unreadCount = await notificationModel.countUnreadByUserId(recipientUserId);
    emitToUser(recipientUserId, 'notification_count_updated', { unreadCount });
  } catch (err) {
    console.error('[Notification Service] Failed to deliver real-time notification:', err.message);
  }
}

/**
 * Fetches a just-inserted notification by id and delivers it. Convenience
 * wrapper for the common "I just called notificationModel.create and have
 * the insertId, now push it live" shape used by donation.service.js,
 * rating.service.js, and chat.service.js.
 * @param {number} recipientUserId - Who should receive this notification
 * @param {number} notificationId - Insert ID from notificationModel.create
 * @returns {Promise<void>}
 */
async function deliverById(recipientUserId, notificationId) {
  const notification = await notificationModel.findById(notificationId);
  if (!notification) return;
  await deliver(recipientUserId, notification);
}

/**
 * Fetches the most recent notification for a (user, relatedId) pair and
 * delivers it. Used specifically for TRIGGER-created notifications
 * (donation accepted/completed), where there's no application-level
 * insertId to fetch by directly — see notificationModel.findLatestForUserAndRelated
 * for why this is safe rather than fragile.
 * @param {number} recipientUserId - Who should receive this notification
 * @param {number} relatedId - The related entity's id (e.g. donation id)
 * @returns {Promise<void>}
 */
async function deliverLatestForRelated(recipientUserId, relatedId) {
  const notification = await notificationModel.findLatestForUserAndRelated(recipientUserId, relatedId);
  if (!notification) return;
  await deliver(recipientUserId, notification);
}

/**
 * Gets a user's current unread notification count. Thin passthrough so
 * socket handlers never call the model layer directly.
 * @param {number} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadCount(userId) {
  return notificationModel.countUnreadByUserId(userId);
}

/**
 * Lists a user's own notifications, newest first, with optional
 * read-status/type filters and pagination. Pure orchestration — all SQL
 * lives in the model.
 * @param {number} userId - Requesting user's ID
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing notifications array and pagination meta
 */
async function listNotifications(userId, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { status, type } = query;
  const filters = { userId, status, type };

  const [notifications, totalItems] = await Promise.all([
    notificationModel.findByUserId({ ...filters, limit, offset }),
    notificationModel.countByUserId(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { notifications, meta };
}

/**
 * Marks a single notification as read, verifying ownership first.
 * Idempotent: an already-read notification is left as-is rather than
 * erroring — the caller always gets the same success shape back.
 * @param {number} userId - Requesting user's ID
 * @param {number} notificationId - Notification ID to mark read
 * @returns {Promise<Object>} The notification, reflecting is_read = 1
 * @throws {AppError} 404 not found, 403 not owned by this user
 */
async function markOneAsRead(userId, notificationId) {
  const notification = await notificationModel.findById(notificationId);

  if (!notification) {
    throw new AppError('Notification not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (notification.user_id !== userId) {
    throw new AppError('You are not allowed to modify this notification.', HTTP_STATUS.FORBIDDEN);
  }

  if (!notification.is_read) {
    await notificationModel.markAsRead(notificationId);
  }

  const unreadCount = await notificationModel.countUnreadByUserId(userId);

  // Only ever emitted to the acting user's own sockets — never a broadcast.
  emitToUser(userId, 'notification_read', { notificationId });
  emitToUser(userId, 'notification_count_updated', { unreadCount });

  return { ...notification, is_read: 1 };
}

/**
 * Marks every unread notification for a user as read in one statement.
 * @param {number} userId - Requesting user's ID
 * @returns {Promise<number>} Number of notifications actually updated
 */
async function markAllAsRead(userId) {
  const updatedCount = await notificationModel.markAllAsReadForUser(userId);

  emitToUser(userId, 'notifications_read', { updatedCount });
  emitToUser(userId, 'notification_count_updated', { unreadCount: 0 });

  return updatedCount;
}

/**
 * Broadcasts a notification to all members of a team.
 * @param {number} teamId - Team ID
 * @param {Object} notificationData - Notification data (type, title, message, relatedId)
 * @param {number} excludeUserId - Optional user ID to exclude from broadcast
 * @returns {Promise<void>}
 */
async function broadcastToTeam(teamId, notificationData, excludeUserId = null) {
  try {
    const members = await teamMemberModel.findByTeamId(teamId);

    for (const member of members) {
      if (excludeUserId && member.user_id === excludeUserId) {
        continue;
      }

      await createNotification(member.user_id, notificationData);
    }
  } catch (err) {
    console.error('[Notification Service] Failed to broadcast to team:', err.message);
  }
}

/**
 * Creates and delivers a notification for a user.
 * @param {number} userId - Recipient user ID
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.type - Notification type
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {number} notificationData.relatedId - Related entity ID
 * @returns {Promise<number>} Notification ID
 */
async function createNotification(userId, { type, title, message, relatedId }) {
  const notificationId = await notificationModel.create(pool, {
    userId,
    type,
    title,
    message,
    relatedId,
  });

  await deliverById(userId, notificationId);
  return notificationId;
}

/**
 * Sends a team announcement to all team members.
 * @param {number} teamId - Team ID
 * @param {number} senderId - Sender's user ID
 * @param {string} message - Announcement message
 * @returns {Promise<void>}
 */
async function sendTeamAnnouncement(teamId, senderId, message) {
  try {
    const members = await teamMemberModel.findByTeamId(teamId);

    for (const member of members) {
      if (member.user_id === senderId) {
        continue;
      }

      await createNotification(member.user_id, {
        type: 'team_announcement',
        title: 'Team Announcement',
        message,
        relatedId: teamId,
      });
    }
  } catch (err) {
    console.error('[Notification Service] Failed to send team announcement:', err.message);
  }
}

module.exports = {
  deliver,
  deliverById,
  deliverLatestForRelated,
  getUnreadCount,
  listNotifications,
  markOneAsRead,
  markAllAsRead,
  broadcastToTeam,
  createNotification,
  sendTeamAnnouncement,
};
