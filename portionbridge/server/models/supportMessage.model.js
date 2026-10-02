const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for support_messages.
 */

async function create(conn, { ticketId, senderId, senderRole, message, isInternal = false }) {
  const executor = conn || pool;
  const [result] = await executor.query(
    `INSERT INTO support_messages (ticket_id, sender_id, sender_role, message, is_internal)
     VALUES (:ticketId, :senderId, :senderRole, :message, :isInternal)`,
    {
      ticketId,
      senderId,
      senderRole,
      message,
      isInternal: isInternal ? 1 : 0,
    }
  );
  return result.insertId;
}

async function findByTicketId(ticketId, { page = 1, limit = 100, forAdmin = false } = {}) {
  const offset = (page - 1) * limit;
  let where = 'm.ticket_id = :ticketId';
  if (!forAdmin) {
    where += ' AND m.is_internal = 0';
  }

  const [rows] = await pool.query(
    `SELECT m.*,
            u.name AS sender_name,
            u.role AS sender_user_role,
            u.profile_picture AS sender_avatar
     FROM support_messages m
     JOIN users u ON m.sender_id = u.id
     WHERE ${where}
     ORDER BY m.id ASC
     LIMIT :limit OFFSET :offset`,
    { ticketId, limit, offset }
  );
  return rows;
}

async function countByTicketId(ticketId, forAdmin = false) {
  let where = 'ticket_id = :ticketId';
  if (!forAdmin) {
    where += ' AND is_internal = 0';
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM support_messages WHERE ${where}`,
    { ticketId }
  );
  return rows[0]?.total || 0;
}

module.exports = {
  create,
  findByTicketId,
  countByTicketId,
};
