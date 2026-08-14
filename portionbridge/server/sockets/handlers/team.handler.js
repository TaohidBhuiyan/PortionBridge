const AppError = require('../../utils/AppError');
const { HTTP_STATUS, USER_ROLES } = require('../../constants');
const teamService = require('../../services/team.service');
const notificationService = require('../../services/notification.service');
const { socketSuccess, socketError } = require('../utils/socketResponse');

/**
 * Registers all team-related event handlers for one authenticated socket.
 * Called from sockets/index.js's connection callback.
 * @param {Object} io - Shared Socket.io server instance
 * @param {Object} socket - The authenticated socket (has socket.user)
 */
function registerTeamHandlers(io, socket) {
  /**
   * join_team_room — joins a team's room for real-time team updates
   * Only team members can join their team's room.
   */
  socket.on('join_team_room', async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const teamId = payload?.teamId;
      
      if (!teamId) {
        throw new AppError('Team ID is required.', HTTP_STATUS.BAD_REQUEST);
      }

      // Verify user is a member of this team
      const membership = await teamService.getMyTeam(socket.user.id);
      
      if (!membership || membership.id !== teamId) {
        throw new AppError('You are not a member of this team.', HTTP_STATUS.FORBIDDEN);
      }

      const roomName = `team_${teamId}`;
      const alreadyJoined = socket.rooms.has(roomName);

      if (!alreadyJoined) {
        socket.join(roomName);
      }

      ack(socketSuccess(
        alreadyJoined ? 'Already in team room.' : 'Joined team room.',
        { teamId, roomName }
      ));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });

  /**
   * leave_team_room — leaves a team's room
   */
  socket.on('leave_team_room', (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const teamId = payload?.teamId;
      
      if (!teamId) {
        throw new AppError('Team ID is required.', HTTP_STATUS.BAD_REQUEST);
      }

      const roomName = `team_${teamId}`;
      socket.leave(roomName);

      ack(socketSuccess('Left team room.', { teamId }));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });

  /**
   * send_team_announcement — sends an announcement to all team members
   * Only team leaders can send announcements.
   */
  socket.on('send_team_announcement', async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const { teamId, message } = payload;

      if (!teamId || !message) {
        throw new AppError('Team ID and message are required.', HTTP_STATUS.BAD_REQUEST);
      }

      // Verify user is the team leader
      const team = await teamService.getTeam(teamId, socket.user.id);
      
      if (team.leader_id !== socket.user.id) {
        throw new AppError('Only team leaders can send announcements.', HTTP_STATUS.FORBIDDEN);
      }

      // Send announcement via notification service
      await notificationService.sendTeamAnnouncement(teamId, socket.user.id, message);

      // Broadcast to team room
      const roomName = `team_${teamId}`;
      io.to(roomName).emit('team_announcement', {
        teamId,
        senderId: socket.user.id,
        senderName: socket.user.name,
        message,
        timestamp: new Date().toISOString(),
      });

      ack(socketSuccess('Announcement sent.', { teamId }));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });

  /**
   * team_activity — generic handler for team activity updates
   * Used for member joined/left, leader changed, etc.
   * This is primarily a server-side broadcast event, but clients can
   * request current team state via this handler.
   */
  socket.on('get_team_state', async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const teamId = payload?.teamId;

      if (!teamId) {
        throw new AppError('Team ID is required.', HTTP_STATUS.BAD_REQUEST);
      }

      const team = await teamService.getTeam(teamId, socket.user.id);

      ack(socketSuccess('Team state retrieved.', team));
    } catch (err) {
      ack(socketError(err.message, err.statusCode));
    }
  });
}

module.exports = { registerTeamHandlers };
