const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notification.service');

/**
 * GET /api/v1/notifications
 */
const listNotifications = asyncHandler(async (req, res) => {
  const { notifications, meta } = await notificationService.listNotifications(req.user.id, req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Notifications retrieved successfully.',
    data: { notifications },
    meta,
  });
});

/**
 * GET /api/v1/notifications/unread-count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Unread notification count retrieved successfully.',
    data: { unreadCount },
  });
});

/**
 * PATCH /api/v1/notifications/:notificationId/read
 */
const markOneAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markOneAsRead(req.user.id, req.params.notificationId);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Notification marked as read.',
    data: { notification },
  });
});

/**
 * PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const updatedCount = await notificationService.markAllAsRead(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'All notifications marked as read.',
    data: { updatedCount },
  });
});

module.exports = { listNotifications, getUnreadCount, markOneAsRead, markAllAsRead };
