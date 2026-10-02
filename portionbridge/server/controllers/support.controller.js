const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getClientIp, getUserAgent } = require('../utils/helpers');
const supportService = require('../services/support.service');

// --- User Controllers ---

const createTicket = asyncHandler(async (req, res) => {
  const { subject, category, priority, body, donationId } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const ticket = await supportService.createTicket(
    req.user.id,
    { subject, category, priority, body, donationId },
    { ipAddress, userAgent }
  );

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Support ticket created successfully.',
    data: { ticket },
  });
});

const listMyTickets = asyncHandler(async (req, res) => {
  const { tickets, pagination } = await supportService.listUserTickets(req.user.id, req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Support tickets retrieved successfully.',
    data: { tickets },
    meta: { pagination },
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const { unreadCount } = await supportService.getUserUnreadCount(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Unread ticket count retrieved successfully.',
    data: { unreadCount },
  });
});

const getTicket = asyncHandler(async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { ticket, messages } = await supportService.getUserTicketById(req.user.id, ticketId);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Support ticket details retrieved successfully.',
    data: { ticket, messages },
  });
});

const postMessage = asyncHandler(async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { body } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { ticket, messages } = await supportService.addUserMessage(
    req.user.id,
    ticketId,
    { body },
    { ipAddress, userAgent }
  );

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Message sent successfully.',
    data: { ticket, messages },
  });
});

const updateStatus = asyncHandler(async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { status } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const ticket = await supportService.updateUserTicketStatus(
    req.user.id,
    ticketId,
    { status },
    { ipAddress, userAgent }
  );

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Ticket status updated successfully.',
    data: { ticket },
  });
});

// --- Admin Controllers ---

const getStats = asyncHandler(async (req, res) => {
  const stats = await supportService.getAdminStats(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Support stats retrieved successfully.',
    data: { stats },
  });
});

const listTickets = asyncHandler(async (req, res) => {
  const { tickets, pagination } = await supportService.listAdminTickets(req.user.id, req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Admin support tickets retrieved successfully.',
    data: { tickets },
    meta: { pagination },
  });
});

const getAdminTicket = asyncHandler(async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { ticket, messages } = await supportService.getAdminTicketById(req.user.id, ticketId);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Admin support ticket retrieved successfully.',
    data: { ticket, messages },
  });
});

const postAdminMessage = asyncHandler(async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { body, isInternal, status } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { ticket, messages } = await supportService.addAdminMessage(
    req.user.id,
    ticketId,
    { body, isInternal: Boolean(isInternal), status },
    { ipAddress, userAgent }
  );

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Admin response sent successfully.',
    data: { ticket, messages },
  });
});

const updateTicket = asyncHandler(async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { status, priority, assignedAdminId } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const ticket = await supportService.updateAdminTicket(
    req.user.id,
    ticketId,
    { status, priority, assignedAdminId },
    { ipAddress, userAgent }
  );

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Ticket updated successfully.',
    data: { ticket },
  });
});

module.exports = {
  createTicket,
  listMyTickets,
  getUnreadCount,
  getTicket,
  postMessage,
  updateStatus,
  getStats,
  listTickets,
  getAdminTicket,
  postAdminMessage,
  updateTicket,
};
