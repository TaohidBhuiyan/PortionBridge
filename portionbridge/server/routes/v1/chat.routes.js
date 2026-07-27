const express = require('express');
const router = express.Router();

const {
  getMessages,
  getLatestMessage,
  getUnreadCount,
  getUnreadCountForUser,
} = require('../../controllers/chat.controller');

const {
  getMessagesValidationRules,
  getLatestMessageValidationRules,
  getUnreadCountValidationRules,
  getUnreadCountForUserValidationRules,
} = require('../../validators/chat.validator');

const validateRequest = require('../../middleware/validateRequest');
const { protect } = require('../../middleware/auth.middleware');

// No authorize(role) anywhere in this file — chat access is
// participant-based (donor or assigned volunteer for a SPECIFIC
// donation), not role-based, and that check lives inside
// chatService.authorizeRoomAccess(). The one exception is the global
// unread-count route below, whose own query already scopes results to
// donations the requester actually participates in.

// Static path registered before the :donationId routes below, matching
// the existing codebase convention — not required for correctness here
// (different path-segment counts never actually collide in Express),
// but kept consistent with donation.routes.js's static-before-param ordering.
router.get(
  '/unread-count',
  protect,
  getUnreadCountForUserValidationRules,
  validateRequest,
  getUnreadCountForUser
);

router.get(
  '/:donationId/messages',
  protect,
  getMessagesValidationRules,
  validateRequest,
  getMessages
);

router.get(
  '/:donationId/latest',
  protect,
  getLatestMessageValidationRules,
  validateRequest,
  getLatestMessage
);

router.get(
  '/:donationId/unread-count',
  protect,
  getUnreadCountValidationRules,
  validateRequest,
  getUnreadCount
);

module.exports = router;
