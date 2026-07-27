const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const chatService = require('../services/chat.service');

const getMessages = asyncHandler(async (req, res) => {
  const { messages, meta } = await chatService.getMessages(req.params.donationId, req.user.id, req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Chat messages retrieved successfully.',
    data: { messages },
    meta,
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await chatService.getUnreadCount(req.params.donationId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Unread message count retrieved successfully.',
    data: { unreadCount },
  });
});

/**
 * GET /api/v1/chat/:donationId/latest
 * Most recent message for a conversation preview, without loading full history.
 */
const getLatestMessage = asyncHandler(async (req, res) => {
  const message = await chatService.getLatestMessage(req.params.donationId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Latest chat message retrieved successfully.',
    data: { message },
  });
});

/**
 * GET /api/v1/chat/unread-count
 * Total unread messages across every donation chat the authenticated
 * user participates in (badge-style total, not a per-conversation breakdown).
 */
const getUnreadCountForUser = asyncHandler(async (req, res) => {
  const unreadCount = await chatService.getUnreadCountForUser(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Unread message count retrieved successfully.',
    data: { unreadCount },
  });
});

module.exports = { getMessages, getLatestMessage, getUnreadCount, getUnreadCountForUser };
