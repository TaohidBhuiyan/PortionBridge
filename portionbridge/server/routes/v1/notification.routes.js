const express = require('express');
const router = express.Router();

const {
  listNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
} = require('../../controllers/notification.controller');

const {
  listNotificationsValidationRules,
  getUnreadCountValidationRules,
  markOneAsReadValidationRules,
  markAllAsReadValidationRules,
} = require('../../validators/notification.validator');

const validateRequest = require('../../middleware/validateRequest');
const { protect } = require('../../middleware/auth.middleware');

// No authorize(role) anywhere in this file — every query/update here is
// already scoped to req.user.id, so there's no separate role dimension
// to restrict; ownership IS the authorization rule.

// Static paths registered before the :notificationId route, matching the
// existing codebase convention.
router.get(
  '/unread-count',
  protect,
  getUnreadCountValidationRules,
  validateRequest,
  getUnreadCount
);

router.patch(
  '/read-all',
  protect,
  markAllAsReadValidationRules,
  validateRequest,
  markAllAsRead
);

router.get(
  '/',
  protect,
  listNotificationsValidationRules,
  validateRequest,
  listNotifications
);

router.patch(
  '/:notificationId/read',
  protect,
  markOneAsReadValidationRules,
  validateRequest,
  markOneAsRead
);

module.exports = router;
