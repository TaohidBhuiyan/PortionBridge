const express = require('express');
const router = express.Router();

const {
  createTicket,
  listMyTickets,
  getUnreadCount,
  getTicket,
  postMessage,
  updateStatus,
} = require('../../controllers/support.controller');
const {
  createTicketValidationRules,
  listTicketsValidationRules,
  postMessageValidationRules,
  updateStatusValidationRules,
} = require('../../validators/support.validator');
const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');
const { supportCreateLimiter, supportMessageLimiter } = require('../../middleware/rateLimiter');

router.post(
  '/tickets',
  protect,
  authorize('donor', 'volunteer'),
  supportCreateLimiter,
  createTicketValidationRules,
  validateRequest,
  createTicket
);

router.get(
  '/tickets',
  protect,
  authorize('donor', 'volunteer'),
  listTicketsValidationRules,
  validateRequest,
  listMyTickets
);

router.get(
  '/tickets/unread-count',
  protect,
  authorize('donor', 'volunteer'),
  getUnreadCount
);

router.get(
  '/tickets/:id',
  protect,
  authorize('donor', 'volunteer'),
  getTicket
);

router.post(
  '/tickets/:id/messages',
  protect,
  authorize('donor', 'volunteer'),
  supportMessageLimiter,
  postMessageValidationRules,
  validateRequest,
  postMessage
);

router.patch(
  '/tickets/:id/status',
  protect,
  authorize('donor', 'volunteer'),
  updateStatusValidationRules,
  validateRequest,
  updateStatus
);

module.exports = router;
