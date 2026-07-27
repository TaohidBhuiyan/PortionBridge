const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `chat_messages` table.
 */

const MESSAGE_COLUMNS_WITH_SENDER = `
  cm.id, cm.donation_request_id, cm.sender_id, cm.message, cm.is_read, cm.created_at,
  u.name AS sender_name, u.role AS sender_role
`;

/**
 * Inserts a new chat message.
 * @param {Object} data
 * @param {number} data.donationRequestId - Donation the message belongs to
 * @param {number} data.senderId - Authenticated sender's user id
 * @param {string} data.message - Message text
 * @returns {Promise<number>} Insert ID of the new message
 */
async function create({ donationRequestId, senderId, message }) {
  const [result] = await pool.query(
    `INSERT INTO chat_messages (donation_request_id, sender_id, message)
     VALUES (:donationRequestId, :senderId, :message)`,
    { donationRequestId, senderId, message }
  );
  return result.insertId;
}

/**
 * Finds a single message by id, joined with the sender's name/role — used
 * right after create() to return a fully-formed payload (with real id and
 * created_at) for the socket broadcast, without a second write round trip.
 * @param {number} id - Message ID
 * @returns {Promise<Object|null>} Message object with sender info, or null
 */
async function findByIdWithSender(id) {
  const [rows] = await pool.query(
    `SELECT ${MESSAGE_COLUMNS_WITH_SENDER}
     FROM chat_messages cm
     JOIN users u ON u.id = cm.sender_id
     WHERE cm.id = :id
     LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Chronological (oldest-first) message history for a donation, with
 * pagination. Oldest-first matches how a chat thread reads top-to-bottom.
 * Shared by chat.service.js#getMessages now, and by Module 3's REST
 * history endpoint later — one query, two callers.
 * @param {number} donationRequestId - Donation ID
 * @param {Object} options
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of message objects with sender info
 */
async function findByDonationId(donationRequestId, { limit, offset }) {
  const [rows] = await pool.query(
    `SELECT ${MESSAGE_COLUMNS_WITH_SENDER}
     FROM chat_messages cm
     JOIN users u ON u.id = cm.sender_id
     WHERE cm.donation_request_id = :donationRequestId
     ORDER BY cm.created_at ASC, cm.id ASC
     LIMIT :limit OFFSET :offset`,
    { donationRequestId, limit, offset }
  );
  return rows;
}

/**
 * Total message count for a donation. Powers pagination meta.
 * @param {number} donationRequestId - Donation ID
 * @returns {Promise<number>} Total count of messages
 */
async function countByDonationId(donationRequestId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM chat_messages WHERE donation_request_id = :donationRequestId`,
    { donationRequestId }
  );
  return rows[0].total;
}

/**
 * Most recent message for a donation, if any. Not wired into any endpoint
 * in this module — provided as ready-to-use infrastructure for a future
 * "recent conversations" preview list.
 * @param {number} donationRequestId - Donation ID
 * @returns {Promise<Object|null>} Most recent message with sender info, or null
 */
async function findLatestByDonationId(donationRequestId) {
  const [rows] = await pool.query(
    `SELECT ${MESSAGE_COLUMNS_WITH_SENDER}
     FROM chat_messages cm
     JOIN users u ON u.id = cm.sender_id
     WHERE cm.donation_request_id = :donationRequestId
     ORDER BY cm.created_at DESC, cm.id DESC
     LIMIT 1`,
    { donationRequestId }
  );
  return rows[0] || null;
}

/**
 * Count of unread messages in a donation's chat from the OTHER party's
 * perspective — messages not sent by `userId` and not yet marked read.
 * Powers the per-conversation unread-count endpoint.
 * @param {number} donationRequestId - Donation ID
 * @param {number} userId - ID of the user checking their unread count
 * @returns {Promise<number>} Count of unread messages
 */
async function countUnread(donationRequestId, userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM chat_messages
     WHERE donation_request_id = :donationRequestId
       AND sender_id <> :userId
       AND is_read = 0`,
    { donationRequestId, userId }
  );
  return rows[0].total;
}

/**
 * Total unread message count across EVERY donation chat this user
 * participates in (as donor or assigned volunteer), excluding soft-deleted
 * donations. Powers a single "unread messages" badge total, distinct from
 * countUnread's per-conversation breakdown.
 *
 * The join condition itself IS the authorization boundary here — a user
 * can only ever be counted against donations where they're the donor or
 * the assigned volunteer, so there's no separate access check needed at
 * the service layer for this one query (unlike every other chat function,
 * which authorizes against a single donationId first).
 * @param {number} userId - ID of the user
 * @returns {Promise<number>} Total unread message count across all chats
 */
async function countUnreadForUser(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM chat_messages cm
     JOIN donation_requests dr ON dr.id = cm.donation_request_id
     WHERE (dr.donor_id = :userId OR dr.volunteer_id = :userId)
       AND dr.is_deleted = 0
       AND cm.sender_id <> :userId
       AND cm.is_read = 0`,
    { userId }
  );
  return rows[0].total;
}

/**
 * Marks every unread message in a donation's chat as read, EXCLUDING
 * messages sent by `readerId` themselves. Since each donation chat is
 * strictly 1:1 (donor <-> assigned volunteer), "not sent by me" is
 * exactly "sent by the other participant" — no need to look up who that
 * other person actually is.
 * @param {number} donationRequestId - Donation ID
 * @param {number} readerId - ID of the user whose read receipt this represents
 * @returns {Promise<number>} Number of messages actually marked as read
 */
async function markAsReadByOtherSender(donationRequestId, readerId) {
  const [result] = await pool.query(
    `UPDATE chat_messages
     SET is_read = 1
     WHERE donation_request_id = :donationRequestId
       AND sender_id <> :readerId
       AND is_read = 0`,
    { donationRequestId, readerId }
  );
  return result.affectedRows;
}

module.exports = {
  create,
  findByIdWithSender,
  findByDonationId,
  countByDonationId,
  findLatestByDonationId,
  countUnread,
  countUnreadForUser,
  markAsReadByOtherSender,
};
