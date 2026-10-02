const { pool } = require('../config/db');
const { HTTP_STATUS, AUDIT_ACTIONS, NOTIFICATION_TYPES } = require('../constants');
const AppError = require('../utils/AppError');
const supportTicketModel = require('../models/supportTicket.model');
const supportMessageModel = require('../models/supportMessage.model');
const notificationModel = require('../models/notification.model');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { getIO } = require('../sockets/ioInstance');
const socketRegistry = require('../sockets/socketRegistry');

function emitSupportSocket(userIds, payload) {
  const io = getIO();
  if (!io) return;
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  ids.forEach((id) => {
    if (!id) return;
    const socketIds = socketRegistry.getSocketIds(id);
    socketIds.forEach((socketId) => io.to(socketId).emit('support_ticket_event', payload));
  });
}

async function createTicket(userId, { subject, category, priority = 'normal', body, donationId }, { ipAddress, userAgent } = {}) {
  const activeCount = await supportTicketModel.countActiveByUserId(userId);
  if (activeCount >= 5) {
    throw new AppError('You cannot have more than 5 active support tickets at a time.', HTTP_STATUS.BAD_REQUEST);
  }

  let finalPriority = priority;
  if (category === 'safety') {
    finalPriority = 'high';
  }

  let ticketId;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    ticketId = await supportTicketModel.create(connection, {
      userId,
      subject,
      category,
      priority: finalPriority,
      donationId,
    });

    await supportMessageModel.create(connection, {
      ticketId,
      senderId: userId,
      senderRole: 'user',
      message: body,
      isInternal: false,
    });

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  await auditService.record({
    userId,
    action: AUDIT_ACTIONS.SUPPORT_TICKET_CREATED,
    ipAddress,
    userAgent,
    metadata: { ticketId, subject, category, priority: finalPriority },
  });

  emitSupportSocket(userId, { kind: 'ticket_created', ticketId });

  const ticket = await supportTicketModel.findById(ticketId);
  return ticket;
}

async function listUserTickets(userId, query = {}) {
  const { page, limit } = getPaginationParams(query);
  const { group = 'all', search = '' } = query;

  const tickets = await supportTicketModel.findByUserId(userId, { group, page, limit, search });
  const total = await supportTicketModel.countByUserId(userId, { group, search });

  return {
    tickets,
    pagination: buildPaginationMeta(total, page, limit),
  };
}

async function getUserTicketById(userId, ticketId) {
  const ticket = await supportTicketModel.findById(ticketId);
  if (!ticket || ticket.user_id !== userId) {
    throw new AppError('Support ticket not found.', HTTP_STATUS.NOT_FOUND);
  }

  await supportTicketModel.markUserRead(null, ticketId);
  ticket.user_unread = 0;

  const messages = await supportMessageModel.findByTicketId(ticketId, { page: 1, limit: 100, forAdmin: false });
  return { ticket, messages };
}

async function getUserUnreadCount(userId) {
  const unreadCount = await supportTicketModel.getUnreadCountForUser(userId);
  return { unreadCount };
}

async function addUserMessage(userId, ticketId, { body }, { ipAddress, userAgent } = {}) {
  const ticket = await supportTicketModel.findById(ticketId);
  if (!ticket || ticket.user_id !== userId) {
    throw new AppError('Support ticket not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (ticket.status === 'closed') {
    throw new AppError('This support ticket is closed and cannot receive new replies.', HTTP_STATUS.BAD_REQUEST);
  }

  let newStatus = ticket.status;
  if (ticket.status === 'resolved' || ticket.status === 'awaiting_user') {
    newStatus = 'in_progress';
  }

  const connection = await pool.getConnection();
  let messageId;
  try {
    await connection.beginTransaction();

    messageId = await supportMessageModel.create(connection, {
      ticketId,
      senderId: userId,
      senderRole: 'user',
      message: body,
      isInternal: false,
    });

    await supportTicketModel.updateTicket(connection, ticketId, {
      status: newStatus,
      adminUnread: true,
      touchLastMessage: true,
    });

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  await auditService.record({
    userId,
    action: AUDIT_ACTIONS.SUPPORT_TICKET_REPLIED,
    ipAddress,
    userAgent,
    metadata: { ticketId, messageId, senderRole: 'user' },
  });

  if (ticket.assigned_admin_id) {
    try {
      const notifId = await notificationModel.create({
        userId: ticket.assigned_admin_id,
        type: NOTIFICATION_TYPES.SUPPORT_TICKET_USER_REPLY,
        title: `New reply on Support Ticket #${ticketId}`,
        message: `${ticket.user_name} replied to ticket: "${ticket.subject}"`,
        relatedId: ticketId,
      });
      await notificationService.deliver(ticket.assigned_admin_id, notifId);
    } catch (err) {
      console.error('[Support Service] Failed to notify assigned admin:', err.message);
    }
  }

  emitSupportSocket(userId, { kind: 'message', ticketId });
  if (ticket.assigned_admin_id) {
    emitSupportSocket(ticket.assigned_admin_id, { kind: 'message', ticketId });
  }

  const messages = await supportMessageModel.findByTicketId(ticketId, { page: 1, limit: 100, forAdmin: false });
  const updatedTicket = await supportTicketModel.findById(ticketId);
  return { ticket: updatedTicket, messages };
}

async function updateUserTicketStatus(userId, ticketId, { status }, { ipAddress, userAgent } = {}) {
  const ticket = await supportTicketModel.findById(ticketId);
  if (!ticket || ticket.user_id !== userId) {
    throw new AppError('Support ticket not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (ticket.status === 'closed') {
    throw new AppError('Closed tickets cannot be modified. Please open a new ticket.', HTTP_STATUS.BAD_REQUEST);
  }

  if (status === 'open' && ticket.status !== 'resolved') {
    throw new AppError('You can only reopen resolved tickets.', HTTP_STATUS.BAD_REQUEST);
  }

  if (status !== 'closed' && status !== 'open') {
    throw new AppError('Invalid status update requested.', HTTP_STATUS.BAD_REQUEST);
  }

  await supportTicketModel.updateTicket(null, ticketId, {
    status,
    adminUnread: true,
  });

  await auditService.record({
    userId,
    action: AUDIT_ACTIONS.SUPPORT_TICKET_UPDATED,
    ipAddress,
    userAgent,
    metadata: { ticketId, oldStatus: ticket.status, newStatus: status },
  });

  emitSupportSocket(userId, { kind: 'status_updated', ticketId, status });
  if (ticket.assigned_admin_id) {
    emitSupportSocket(ticket.assigned_admin_id, { kind: 'status_updated', ticketId, status });
  }

  return supportTicketModel.findById(ticketId);
}

// --- Admin Service Methods ---

async function getAdminStats(adminId) {
  return supportTicketModel.getAdminStats(adminId);
}

async function listAdminTickets(adminId, query = {}) {
  const { page, limit } = getPaginationParams(query);
  const { status, category, priority, assigned, search } = query;

  const tickets = await supportTicketModel.findForAdmin({
    status,
    category,
    priority,
    assigned,
    search,
    page,
    limit,
    adminId,
  });

  const total = await supportTicketModel.countForAdmin({
    status,
    category,
    priority,
    assigned,
    search,
    adminId,
  });

  return {
    tickets,
    pagination: buildPaginationMeta(total, page, limit),
  };
}

async function getAdminTicketById(adminId, ticketId) {
  const ticket = await supportTicketModel.findById(ticketId);
  if (!ticket) {
    throw new AppError('Support ticket not found.', HTTP_STATUS.NOT_FOUND);
  }

  await supportTicketModel.markAdminRead(null, ticketId);
  ticket.admin_unread = 0;

  const messages = await supportMessageModel.findByTicketId(ticketId, { page: 1, limit: 100, forAdmin: true });
  return { ticket, messages };
}

async function addAdminMessage(adminId, ticketId, { body, isInternal = false, status }, { ipAddress, userAgent } = {}) {
  const ticket = await supportTicketModel.findById(ticketId);
  if (!ticket) {
    throw new AppError('Support ticket not found.', HTTP_STATUS.NOT_FOUND);
  }

  let newStatus = status || ticket.status;
  if (!isInternal && !status && ['open', 'awaiting_user'].includes(ticket.status)) {
    newStatus = 'in_progress';
  }

  const assignedAdminId = ticket.assigned_admin_id || adminId;

  const connection = await pool.getConnection();
  let messageId;
  try {
    await connection.beginTransaction();

    messageId = await supportMessageModel.create(connection, {
      ticketId,
      senderId: adminId,
      senderRole: 'admin',
      message: body,
      isInternal,
    });

    const updateFields = {
      assignedAdminId,
    };

    if (newStatus !== ticket.status) {
      updateFields.status = newStatus;
    }

    if (!isInternal) {
      updateFields.userUnread = true;
      updateFields.adminUnread = false;
      updateFields.touchLastMessage = true;
    }

    await supportTicketModel.updateTicket(connection, ticketId, updateFields);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  await auditService.record({
    userId: adminId,
    action: AUDIT_ACTIONS.SUPPORT_TICKET_REPLIED,
    ipAddress,
    userAgent,
    metadata: { ticketId, messageId, isInternal, senderRole: 'admin' },
  });

  if (!isInternal) {
    try {
      const notifId = await notificationModel.create({
        userId: ticket.user_id,
        type: NOTIFICATION_TYPES.SUPPORT_TICKET_REPLY,
        title: `Reply on Support Ticket #${ticketId}`,
        message: `Admin replied to your ticket: "${ticket.subject}"`,
        relatedId: ticketId,
      });
      await notificationService.deliver(ticket.user_id, notifId);
    } catch (err) {
      console.error('[Support Service] Failed to notify user of admin reply:', err.message);
    }

    emitSupportSocket(ticket.user_id, { kind: 'message', ticketId });
  }

  emitSupportSocket(adminId, { kind: 'message', ticketId });

  const messages = await supportMessageModel.findByTicketId(ticketId, { page: 1, limit: 100, forAdmin: true });
  const updatedTicket = await supportTicketModel.findById(ticketId);
  return { ticket: updatedTicket, messages };
}

async function updateAdminTicket(adminId, ticketId, { status, priority, assignedAdminId }, { ipAddress, userAgent } = {}) {
  const ticket = await supportTicketModel.findById(ticketId);
  if (!ticket) {
    throw new AppError('Support ticket not found.', HTTP_STATUS.NOT_FOUND);
  }

  const updateFields = {};
  if (status !== undefined) updateFields.status = status;
  if (priority !== undefined) updateFields.priority = priority;
  if (assignedAdminId !== undefined) updateFields.assignedAdminId = assignedAdminId;

  await supportTicketModel.updateTicket(null, ticketId, updateFields);

  await auditService.record({
    userId: adminId,
    action: AUDIT_ACTIONS.SUPPORT_TICKET_UPDATED,
    ipAddress,
    userAgent,
    metadata: { ticketId, changes: { status, priority, assignedAdminId } },
  });

  if (status !== undefined && status !== ticket.status) {
    try {
      const notifId = await notificationModel.create({
        userId: ticket.user_id,
        type: NOTIFICATION_TYPES.SUPPORT_TICKET_STATUS,
        title: `Support Ticket #${ticketId} status updated`,
        message: `Your ticket status was changed to "${status.replace('_', ' ')}".`,
        relatedId: ticketId,
      });
      await notificationService.deliver(ticket.user_id, notifId);
    } catch (err) {
      console.error('[Support Service] Failed to notify user of status update:', err.message);
    }

    emitSupportSocket(ticket.user_id, { kind: 'status_updated', ticketId, status });
  }

  emitSupportSocket(adminId, { kind: 'ticket_updated', ticketId });

  return supportTicketModel.findById(ticketId);
}

module.exports = {
  createTicket,
  listUserTickets,
  getUserTicketById,
  getUserUnreadCount,
  addUserMessage,
  updateUserTicketStatus,
  getAdminStats,
  listAdminTickets,
  getAdminTicketById,
  addAdminMessage,
  updateAdminTicket,
};
