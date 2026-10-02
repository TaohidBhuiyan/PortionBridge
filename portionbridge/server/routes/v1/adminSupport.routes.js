const express = require('express');
const router = express.Router();

const {
  getStats,
  listTickets,
  getAdminTicket,
  postAdminMessage,
  updateTicket,
} = require('../../controllers/support.controller');
const {
  adminListTicketsValidationRules,
  adminPostMessageValidationRules,
  adminUpdateTicketValidationRules,
} = require('../../validators/support.validator');
const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');

router.get(
  '/stats',
  protect,
  authorize('admin'),
  getStats
);

router.get(
  '/tickets',
  protect,
  authorize('admin'),
  adminListTicketsValidationRules,
  validateRequest,
  listTickets
);

router.get(
  '/tickets/:id',
  protect,
  authorize('admin'),
  getAdminTicket
);

router.post(
  '/tickets/:id/messages',
  protect,
  authorize('admin'),
  adminPostMessageValidationRules,
  validateRequest,
  postAdminMessage
);

router.patch(
  '/tickets/:id',
  protect,
  authorize('admin'),
  adminUpdateTicketValidationRules,
  validateRequest,
  updateTicket
);

module.exports = router;
