const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for support_tickets.
 */

async function create(conn, { userId, subject, category, priority = 'normal', donationId = null }) {
  const executor = conn || pool;
  const [result] = await executor.query(
    `INSERT INTO support_tickets (user_id, subject, category, priority, status, donation_id, user_unread, admin_unread, last_message_at)
     VALUES (:userId, :subject, :category, :priority, 'open', :donationId, 0, 1, NOW())`,
    { userId, subject, category, priority, donationId: donationId || null }
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT t.*,
            u.name AS user_name, u.email AS user_email, u.role AS user_role, u.profile_picture AS user_avatar,
            a.name AS assigned_admin_name, a.email AS assigned_admin_email,
            d.title AS donation_title
     FROM support_tickets t
     JOIN users u ON t.user_id = u.id
     LEFT JOIN users a ON t.assigned_admin_id = a.id
     LEFT JOIN donation_requests d ON t.donation_id = d.id
     WHERE t.id = :id
     LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

async function findByUserId(userId, { group = 'all', page = 1, limit = 10, search = '' }) {
  const offset = (page - 1) * limit;
  let where = 't.user_id = :userId';
  const params = { userId, limit, offset };

  if (group === 'active') {
    where += " AND t.status IN ('open', 'in_progress', 'awaiting_user')";
  } else if (group === 'resolved') {
    where += " AND t.status IN ('resolved', 'closed')";
  }

  if (search && search.trim()) {
    where += ' AND (t.subject LIKE :search OR t.id = :searchId)';
    params.search = `%${search.trim()}%`;
    params.searchId = parseInt(search.trim(), 10) || 0;
  }

  const [rows] = await pool.query(
    `SELECT t.*,
            (SELECT message FROM support_messages WHERE ticket_id = t.id AND is_internal = 0 ORDER BY id DESC LIMIT 1) AS last_message
     FROM support_tickets t
     WHERE ${where}
     ORDER BY t.last_message_at DESC
     LIMIT :limit OFFSET :offset`,
    params
  );
  return rows;
}

async function countByUserId(userId, { group = 'all', search = '' }) {
  let where = 't.user_id = :userId';
  const params = { userId };

  if (group === 'active') {
    where += " AND t.status IN ('open', 'in_progress', 'awaiting_user')";
  } else if (group === 'resolved') {
    where += " AND t.status IN ('resolved', 'closed')";
  }

  if (search && search.trim()) {
    where += ' AND (t.subject LIKE :search OR t.id = :searchId)';
    params.search = `%${search.trim()}%`;
    params.searchId = parseInt(search.trim(), 10) || 0;
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM support_tickets t WHERE ${where}`,
    params
  );
  return rows[0]?.total || 0;
}

async function countActiveByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM support_tickets
     WHERE user_id = :userId AND status IN ('open', 'in_progress', 'awaiting_user')`,
    { userId }
  );
  return rows[0]?.total || 0;
}

async function findForAdmin({ status, category, priority, assigned, search, page = 1, limit = 10, adminId }) {
  const offset = (page - 1) * limit;
  const whereClauses = ['1=1'];
  const params = { limit, offset };

  if (status) {
    whereClauses.push('t.status = :status');
    params.status = status;
  }

  if (category) {
    whereClauses.push('t.category = :category');
    params.category = category;
  }

  if (priority) {
    whereClauses.push('t.priority = :priority');
    params.priority = priority;
  }

  if (assigned === 'me') {
    whereClauses.push('t.assigned_admin_id = :adminId');
    params.adminId = adminId;
  } else if (assigned === 'unassigned') {
    whereClauses.push('t.assigned_admin_id IS NULL');
  }

  if (search && search.trim()) {
    whereClauses.push('(t.subject LIKE :search OR u.name LIKE :search OR u.email LIKE :search OR t.id = :searchId)');
    params.search = `%${search.trim()}%`;
    params.searchId = parseInt(search.trim(), 10) || 0;
  }

  const where = whereClauses.join(' AND ');

  const [rows] = await pool.query(
    `SELECT t.*,
            u.name AS user_name, u.email AS user_email, u.role AS user_role, u.profile_picture AS user_avatar,
            a.name AS assigned_admin_name,
            (SELECT message FROM support_messages WHERE ticket_id = t.id ORDER BY id DESC LIMIT 1) AS last_message
     FROM support_tickets t
     JOIN users u ON t.user_id = u.id
     LEFT JOIN users a ON t.assigned_admin_id = a.id
     WHERE ${where}
     ORDER BY
       CASE WHEN t.status = 'open' THEN 1 WHEN t.status = 'in_progress' THEN 2 WHEN t.status = 'awaiting_user' THEN 3 ELSE 4 END,
       CASE WHEN t.priority = 'urgent' THEN 1 WHEN t.priority = 'high' THEN 2 WHEN t.priority = 'normal' THEN 3 ELSE 4 END,
       t.last_message_at DESC
     LIMIT :limit OFFSET :offset`,
    params
  );
  return rows;
}

async function countForAdmin({ status, category, priority, assigned, search, adminId }) {
  const whereClauses = ['1=1'];
  const params = {};

  if (status) {
    whereClauses.push('t.status = :status');
    params.status = status;
  }

  if (category) {
    whereClauses.push('t.category = :category');
    params.category = category;
  }

  if (priority) {
    whereClauses.push('t.priority = :priority');
    params.priority = priority;
  }

  if (assigned === 'me') {
    whereClauses.push('t.assigned_admin_id = :adminId');
    params.adminId = adminId;
  } else if (assigned === 'unassigned') {
    whereClauses.push('t.assigned_admin_id IS NULL');
  }

  if (search && search.trim()) {
    whereClauses.push('(t.subject LIKE :search OR u.name LIKE :search OR u.email LIKE :search OR t.id = :searchId)');
    params.search = `%${search.trim()}%`;
    params.searchId = parseInt(search.trim(), 10) || 0;
  }

  const where = whereClauses.join(' AND ');

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM support_tickets t
     JOIN users u ON t.user_id = u.id
     WHERE ${where}`,
    params
  );
  return rows[0]?.total || 0;
}

async function updateTicket(conn, id, fields) {
  const executor = conn || pool;
  const updates = [];
  const params = { id };

  if (fields.status !== undefined) {
    updates.push('status = :status');
    params.status = fields.status;
    if (fields.status === 'resolved') {
      updates.push('resolved_at = NOW()');
    } else if (fields.status === 'closed') {
      updates.push('closed_at = NOW()');
    } else if (['open', 'in_progress', 'awaiting_user'].includes(fields.status)) {
      updates.push('resolved_at = NULL, closed_at = NULL');
    }
  }

  if (fields.priority !== undefined) {
    updates.push('priority = :priority');
    params.priority = fields.priority;
  }

  if (fields.assignedAdminId !== undefined) {
    updates.push('assigned_admin_id = :assignedAdminId');
    params.assignedAdminId = fields.assignedAdminId || null;
  }

  if (fields.userUnread !== undefined) {
    updates.push('user_unread = :userUnread');
    params.userUnread = fields.userUnread ? 1 : 0;
  }

  if (fields.adminUnread !== undefined) {
    updates.push('admin_unread = :adminUnread');
    params.adminUnread = fields.adminUnread ? 1 : 0;
  }

  if (fields.touchLastMessage) {
    updates.push('last_message_at = NOW()');
  }

  if (updates.length === 0) return;

  await executor.query(
    `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = :id`,
    params
  );
}

async function getUnreadCountForUser(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM support_tickets WHERE user_id = :userId AND user_unread = 1`,
    { userId }
  );
  return rows[0]?.total || 0;
}

async function getAdminStats(adminId) {
  const [rows] = await pool.query(
    `SELECT
       SUM(CASE WHEN status IN ('open', 'in_progress', 'awaiting_user') THEN 1 ELSE 0 END) AS totalOpen,
       SUM(CASE WHEN assigned_admin_id IS NULL AND status IN ('open', 'in_progress', 'awaiting_user') THEN 1 ELSE 0 END) AS totalUnassigned,
       SUM(CASE WHEN assigned_admin_id = :adminId AND status IN ('open', 'in_progress', 'awaiting_user') THEN 1 ELSE 0 END) AS totalAssignedToMe,
       SUM(CASE WHEN priority IN ('high', 'urgent') AND status IN ('open', 'in_progress', 'awaiting_user') THEN 1 ELSE 0 END) AS totalHighPriority,
       SUM(CASE WHEN admin_unread = 1 THEN 1 ELSE 0 END) AS totalUnread
     FROM support_tickets`,
    { adminId: adminId || 0 }
  );
  return {
    open: Number(rows[0]?.totalOpen || 0),
    unassigned: Number(rows[0]?.totalUnassigned || 0),
    mine: Number(rows[0]?.totalAssignedToMe || 0),
    highPriority: Number(rows[0]?.totalHighPriority || 0),
    unread: Number(rows[0]?.totalUnread || 0),
  };
}

async function markUserRead(conn, id) {
  const executor = conn || pool;
  await executor.query(
    `UPDATE support_tickets SET user_unread = 0 WHERE id = :id`,
    { id }
  );
}

async function markAdminRead(conn, id) {
  const executor = conn || pool;
  await executor.query(
    `UPDATE support_tickets SET admin_unread = 0 WHERE id = :id`,
    { id }
  );
}

module.exports = {
  create,
  findById,
  findByUserId,
  countByUserId,
  countActiveByUserId,
  findForAdmin,
  countForAdmin,
  updateTicket,
  getUnreadCountForUser,
  getAdminStats,
  markUserRead,
  markAdminRead,
};
