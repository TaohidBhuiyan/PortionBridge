const AppError = require('../../utils/AppError');
const { HTTP_STATUS } = require('../../constants');
const chatService = require('../../services/chat.service');
const { socketSuccess, socketError } = require('../utils/socketResponse');
const { getDonationRoomName } = require('../rooms');

/**
 * Registers all chat-related event handlers for one authenticated socket.
 * Called from sockets/index.js's connection callback.
 *
 * Handlers are deliberately thin: parse the ack callback, delegate all
 * validation and business logic to chat.service.js, and translate the
 * result/error into a socket acknowledgement. donationId validation lives
 * SOLELY in chatService.validateDonationId — no handler re-implements
 * that check; each handler either receives an already-validated donation
 * back from a service call, or calls the shared validator directly when
 * it needs the normalized id before any service call happens.
 * @param {Object} io - Shared Socket.io server instance
 * @param {Object} socket - The authenticated socket (has socket.user)
 */
function registerChatHandlers(io, socket) {
  /**
   * join_room — the ONLY way a socket is added to a donation's chat room.
   * chatService.markConversationRead validates the donationId AND
   * authorizes access AND marks unread messages read, all in one call.
   * Idempotent, and leaves any other donation_* room first since the UI
   * only supports one active conversation.
   */
  socket.on('join_room', async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const { donation, markedReadCount } = await chatService.markConversationRead(
        payload?.donationId,
        socket.user.id
      );

      const roomName = getDonationRoomName(donation.id);
      const alreadyJoined = socket.rooms.has(roomName);

      if (!alreadyJoined) {
        for (const joinedRoom of socket.rooms) {
          if (joinedRoom !== socket.id && joinedRoom.startsWith('donation_')) {
            socket.leave(joinedRoom);
          }
        }
        socket.join(roomName);
      }

      if (markedReadCount > 0) {
        io.to(roomName).emit('messages_read', { donationId: donation.id, readBy: socket.user.id });
      }

      ack(socketSuccess(
        alreadyJoined ? 'Already in this chat room.' : 'Joined chat room.',
        { donationId: donation.id, roomName }
      ));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });

  /**
   * leave_room — removes the socket from a donation's room. No
   * authorization needed to leave (worst case is a harmless no-op), but
   * still validates the id shape via the same shared validator used
   * everywhere else in this feature.
   */
  socket.on('leave_room', (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const donationId = chatService.validateDonationId(payload?.donationId);
      socket.leave(getDonationRoomName(donationId));
      ack(socketSuccess('Left chat room.', { donationId }));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });

  /**
   * send_message — persists a message (chatService.sendMessage validates
   * both donationId and message content, and re-authorizes independently)
   * and broadcasts the SAVED DATABASE ROW to everyone in the room,
   * including the sender.
   *
   * `socket.rooms.has(roomName)` below is a convenience/early-exit check
   * only — NOT the security boundary; chatService.sendMessage validates
   * and authorizes on its own regardless of this check's outcome.
   */
  socket.on('send_message', async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const donationId = chatService.validateDonationId(payload?.donationId);
      const roomName = getDonationRoomName(donationId);

      if (!socket.rooms.has(roomName)) {
        throw new AppError('You must join this chat room before sending messages.', HTTP_STATUS.FORBIDDEN);
      }

      const savedMessage = await chatService.sendMessage({
        donationId,
        senderId: socket.user.id,
        message: payload?.message,
      });

      io.to(roomName).emit('new_message', savedMessage);

      ack(socketSuccess('Message sent.', savedMessage));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });
}

module.exports = { registerChatHandlers };
