const { pool } = require('../config/db');
const { HTTP_STATUS, DONATION_STATUS, NOTIFICATION_TYPES } = require('../constants');
const AppError = require('../utils/AppError');
const chatMessageModel = require('../models/chatMessage.model');
const donationModel = require('../models/donation.model');
const notificationModel = require('../models/notification.model');
const notificationService = require('./notification.service');

/**
 * App-level cap on message length. chat_messages.message is a TEXT column
 * (up to 65,535 chars at the DB level) — this is a sane UX/abuse limit,
 * not a schema constraint.
 */
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Validates and normalizes a raw donationId, from either a socket payload
 * or an already-validated REST route param. This is the SOLE
 * implementation of "what counts as a valid donationId" for the chat
 * feature — previously this exact check was duplicated across three
 * handlers in chat.handler.js plus a fourth copy inside this file's old
 * message-payload validator. Every entry point now goes through here,
 * either directly or transitively via authorizeRoomAccess.
 * @param {*} rawDonationId - Raw value from a socket payload or route param
 * @returns {number} The validated, normalized donation ID
 * @throws {AppError} 400 if not a positive integer
 */
function validateDonationId(rawDonationId) {
  const donationId = Number(rawDonationId);
  if (!Number.isInteger(donationId) || donationId <= 0) {
    throw new AppError('A valid donationId is required.', HTTP_STATUS.BAD_REQUEST);
  }
  return donationId;
}

/**
 * Validates and normalizes a chat message's text content. Kept separate
 * from validateDonationId — message content and destination are unrelated
 * concerns, so each gets exactly one validator.
 * @param {*} message - Raw message text from the client payload
 * @returns {string} Normalized (trimmed) message text
 * @throws {AppError} 400 on any invalid input
 */
function validateMessage(message) {
  if (typeof message !== 'string' || message.trim().length === 0) {
    throw new AppError('Message cannot be empty.', HTTP_STATUS.BAD_REQUEST);
  }

  const trimmed = message.trim();
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(`Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`, HTTP_STATUS.BAD_REQUEST);
  }

  return trimmed;
}

/**
 * Verifies a user may access a donation's chat: the donationId must be a
 * valid positive integer, the donation must exist and not be soft-deleted
 * (donationModel.findById already excludes those), must have progressed
 * past 'pending' (a volunteer must be assigned), and the requester must
 * be either the donor or the assigned volunteer.
 *
 * This is the SOLE source of truth for chat authorization AND donationId
 * validation, reused by every per-donation entry point: join_room/leave-read
 * (via markConversationRead), send_message, history, latest message, and
 * per-conversation unread count.
 * @param {*} rawDonationId - Donation ID (validated inside)
 * @param {number} userId - ID of the user requesting access
 * @returns {Promise<Object>} The donation object
 * @throws {AppError} 400 invalid id, 404 not found/deleted, 409 no volunteer assigned yet, 403 not a participant
 */
async function authorizeRoomAccess(rawDonationId, userId) {
  const donationId = validateDonationId(rawDonationId);
  const donation = await donationModel.findById(donationId);

  if (!donation) {
    throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (donation.status === DONATION_STATUS.PENDING || !donation.volunteer_id) {
    throw new AppError(
      'Chat is only available once a volunteer has accepted this donation request.',
      HTTP_STATUS.CONFLICT
    );
  }

  const isParticipant = donation.donor_id === userId || donation.volunteer_id === userId;
  if (!isParticipant) {
    throw new AppError('You are not authorized to access this donation\'s chat.', HTTP_STATUS.FORBIDDEN);
  }

  return donation;
}


/**
 * Persists a chat message, notifies the OTHER participant, and returns the
 * message with sender info attached, ready to broadcast as-is. senderId
 * always comes from the authenticated socket — never the client payload.
 * @param {Object} params
 * @param {*} params.donationId - Donation ID (validated inside via authorizeRoomAccess)
 * @param {number} params.senderId - Authenticated sender's user id
 * @param {*} params.message - Raw message text (validated inside)
 * @returns {Promise<Object>} The saved message, with sender info attached
 */
async function sendMessage({ donationId, senderId, message }) {
  const cleanMessage = validateMessage(message);
  const donation = await authorizeRoomAccess(donationId, senderId);

  const insertId = await chatMessageModel.create({
    donationRequestId: donation.id,
    senderId,
    message: cleanMessage,
  });

  const savedMessage = await chatMessageModel.findByIdWithSender(insertId);

  const recipientId = donation.donor_id === senderId ? donation.volunteer_id : donation.donor_id;

  if (recipientId) {
    const notificationId = await notificationModel.create(pool, {
      userId: recipientId,
      type: NOTIFICATION_TYPES.NEW_MESSAGE,
      title: 'New message',
      message: `${savedMessage.sender_name} sent you a new message about donation request #${donation.id}.`,
      relatedId: donation.id,
    });

    await notificationService.deliverById(recipientId, notificationId);
  }

  return savedMessage;
}

/**
 * Fetches a donation's chat history, oldest-first, with pagination.
 * @param {*} donationId - Donation ID (validated inside)
 * @param {number} requesterId - ID of the user requesting history
 * @param {Object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=50]
 * @returns {Promise<Object>} Object with messages array and pagination meta
 */
async function getMessages(donationId, requesterId, { page = 1, limit = 50 } = {}) {
  const donation = await authorizeRoomAccess(donationId, requesterId);

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [messages, totalItems] = await Promise.all([
    chatMessageModel.findByDonationId(donation.id, { limit: safeLimit, offset }),
    chatMessageModel.countByDonationId(donation.id),
  ]);

  return {
    messages,
    meta: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages: Math.ceil(totalItems / safeLimit) || 1,
    },
  };
}

/**
 * Gets the single most recent message for a donation's chat, if any.
 * @param {*} donationId - Donation ID (validated inside)
 * @param {number} requesterId - ID of the requesting user
 * @returns {Promise<Object|null>} Most recent message with sender info, or null if no messages yet
 */
async function getLatestMessage(donationId, requesterId) {
  const donation = await authorizeRoomAccess(donationId, requesterId);
  return chatMessageModel.findLatestByDonationId(donation.id);
}

/**
 * Gets the count of unread messages (from the other participant) in one
 * donation's chat, for the requesting user.
 * @param {*} donationId - Donation ID (validated inside)
 * @param {number} requesterId - ID of the user checking their unread count
 * @returns {Promise<number>} Count of unread messages
 */
async function getUnreadCount(donationId, requesterId) {
  const donation = await authorizeRoomAccess(donationId, requesterId);
  return chatMessageModel.countUnread(donation.id, requesterId);
}

/**
 * Gets the total unread message count across every donation chat this
 * user participates in. No authorizeRoomAccess call needed — the model
 * query's own join condition (donor_id/volunteer_id = userId) is what
 * scopes this correctly; there's no single donationId to authorize
 * against.
 * @param {number} userId - ID of the requesting user
 * @returns {Promise<number>} Total unread message count across all chats
 */
async function getUnreadCountForUser(userId) {
  return chatMessageModel.countUnreadForUser(userId);
}

/**
 * Marks every message the OTHER participant sent in a donation's chat as
 * read, from this reader's perspective, and returns the donation alongside
 * how many rows changed — so join_room can use donation.id for room-naming
 * without a second, separate validateDonationId call.
 * @param {*} donationId - Donation ID (validated inside)
 * @param {number} readerId - ID of the user whose read receipt this represents
 * @returns {Promise<{ donation: Object, markedReadCount: number }>}
 */
async function markConversationRead(donationId, readerId) {
  const donation = await authorizeRoomAccess(donationId, readerId);
  const markedReadCount = await chatMessageModel.markAsReadByOtherSender(donation.id, readerId);
  return { donation, markedReadCount };
}

module.exports = {
  validateDonationId,
  authorizeRoomAccess,
  sendMessage,
  getMessages,
  getLatestMessage,
  getUnreadCount,
  getUnreadCountForUser,
  markConversationRead,
};
