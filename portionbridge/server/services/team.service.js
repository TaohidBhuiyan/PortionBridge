const { HTTP_STATUS, TEAM_MEMBER_ROLE, TEAM_INVITATION_STATUS, USER_ROLES, NOTIFICATION_TYPES } = require('../constants');
const AppError = require('../utils/AppError');
const teamModel = require('../models/team.model');
const teamMemberModel = require('../models/teamMember.model');
const teamInvitationModel = require('../models/teamInvitation.model');
const userModel = require('../models/user.model');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const { broadcastTeamActivity } = require('../sockets/ioInstance');

/**
 * Creates a new team.
 * @param {number} userId - User ID of the team creator
 * @param {Object} data - Team data
 * @returns {Promise<Object>} Created team object
 */
async function createTeam(userId, { name, description }) {
  const user = await userModel.findById(userId);
  
  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (user.role !== USER_ROLES.VOLUNTEER) {
    throw new AppError('Only volunteers can create teams.', HTTP_STATUS.FORBIDDEN);
  }

  // Check if user is already leading a team
  const existingTeam = await teamModel.findByLeaderId(userId);
  if (existingTeam) {
    throw new AppError('You are already leading a team.', HTTP_STATUS.CONFLICT);
  }

  // Check if user is already a member of another team
  const existingMembership = await teamMemberModel.findByUserId(userId);
  if (existingMembership) {
    throw new AppError('You are already a member of another team.', HTTP_STATUS.CONFLICT);
  }

  const connection = await require('../config/db').pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Create team
    const teamId = await teamModel.create({ name, description, leaderId: userId });

    // Add creator as leader member
    await teamMemberModel.create({ teamId, userId, role: TEAM_MEMBER_ROLE.LEADER });

    await connection.commit();

    // Log audit
    await auditService.logAudit(userId, 'team_created', { teamId, name });

    return await teamModel.findById(teamId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Gets team details.
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID of the requester
 * @returns {Promise<Object>} Team object with members
 */
async function getTeam(teamId, userId) {
  const team = await teamModel.findById(teamId);
  
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Check if user is a member of the team
  const membership = await teamMemberModel.findByTeamAndUser(teamId, userId);
  if (!membership) {
    throw new AppError('You are not a member of this team.', HTTP_STATUS.FORBIDDEN);
  }

  const members = await teamMemberModel.findByTeamId(teamId);

  return {
    ...team,
    members,
  };
}

/**
 * Updates team information.
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID of the requester
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated team object
 */
async function updateTeam(teamId, userId, data) {
  const team = await teamModel.findById(teamId);
  
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can update team information.', HTTP_STATUS.FORBIDDEN);
  }

  await teamModel.update(teamId, data);

  // Log audit
  await auditService.logAudit(userId, 'team_updated', { teamId, ...data });

  return await teamModel.findById(teamId);
}

/**
 * Deletes a team.
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID of the requester
 * @returns {Promise<void>}
 */
async function deleteTeam(teamId, userId) {
  const team = await teamModel.findById(teamId);
  
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can delete the team.', HTTP_STATUS.FORBIDDEN);
  }

  await teamModel.deleteById(teamId);

  // Log audit
  await auditService.logAudit(userId, 'team_deleted', { teamId });
}

/**
 * Invites a user to join the team.
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID of the inviter
 * @param {Object} data - Invitation data
 * @returns {Promise<Object>} Created invitation
 */
async function inviteMember(teamId, userId, { invitedUserId, invitedEmail }) {
  const team = await teamModel.findById(teamId);
  
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can invite members.', HTTP_STATUS.FORBIDDEN);
  }

  // Determine the user to invite
  let targetUserId = invitedUserId;
  let targetEmail = invitedEmail;

  if (invitedEmail && !invitedUserId) {
    // Look up user by email
    const targetUser = await userModel.findByEmail(invitedEmail);
    if (!targetUser) {
      throw new AppError('User with this email not found.', HTTP_STATUS.NOT_FOUND);
    }
    targetUserId = targetUser.id;
    targetEmail = targetUser.email;
  } else if (invitedUserId) {
    // Look up user by ID
    const targetUser = await userModel.findById(invitedUserId);
    if (!targetUser) {
      throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
    }
    targetEmail = targetUser.email;
  }

  // Check if target user is a volunteer
  const targetUser = await userModel.findById(targetUserId);
  if (targetUser.role !== USER_ROLES.VOLUNTEER) {
    throw new AppError('Only volunteers can be invited to teams.', HTTP_STATUS.FORBIDDEN);
  }

  // Check if user is already in a team
  const existingMembership = await teamMemberModel.findByUserId(targetUserId);
  if (existingMembership) {
    throw new AppError('This user is already a member of a team.', HTTP_STATUS.CONFLICT);
  }

  // Check if there's already a pending invitation
  const existingInvitation = await teamInvitationModel.findPendingByTeamAndUser(teamId, targetUserId);
  if (existingInvitation) {
    throw new AppError('This user already has a pending invitation to this team.', HTTP_STATUS.CONFLICT);
  }

  // Create invitation (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitationId = await teamInvitationModel.create({
    teamId,
    invitedBy: userId,
    invitedUserId: targetUserId,
    invitedEmail: targetEmail,
    expiresAt,
  });

  // Send notification to invitee
  await notificationService.createNotification(targetUserId, {
    type: NOTIFICATION_TYPES.TEAM_INVITATION_RECEIVED,
    title: 'Team Invitation',
    message: `You have been invited to join the team "${team.name}".`,
    relatedId: invitationId,
  });

  // Log audit
  await auditService.logAudit(userId, 'team_invitation_sent', { teamId, invitedUserId: targetUserId });

  return await teamInvitationModel.findById(invitationId);
}

/**
 * Lists pending invitations for a team.
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID of the requester
 * @returns {Promise<Array>} Array of pending invitations
 */
async function listTeamInvitations(teamId, userId) {
  const team = await teamModel.findById(teamId);
  
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can view team invitations.', HTTP_STATUS.FORBIDDEN);
  }

  return await teamInvitationModel.findPendingByTeamId(teamId);
}

/**
 * Cancels a team invitation.
 * @param {number} teamId - Team ID
 * @param {number} invitationId - Invitation ID
 * @param {number} userId - User ID of the requester
 * @returns {Promise<void>}
 */
async function cancelInvitation(teamId, invitationId, userId) {
  const team = await teamModel.findById(teamId);
  
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can cancel invitations.', HTTP_STATUS.FORBIDDEN);
  }

  const invitation = await teamInvitationModel.findById(invitationId);
  if (!invitation) {
    throw new AppError('Invitation not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (invitation.team_id !== teamId) {
    throw new AppError('Invitation does not belong to this team.', HTTP_STATUS.FORBIDDEN);
  }

  await teamInvitationModel.deleteById(invitationId);

  // Log audit
  await auditService.logAudit(userId, 'team_invitation_cancelled', { teamId, invitationId });
}

/**
 * Accepts a team invitation.
 * @param {number} invitationId - Invitation ID
 * @param {number} userId - User ID of the invitee
 * @returns {Promise<Object>} Team object
 */
async function acceptInvitation(invitationId, userId) {
  const invitation = await teamInvitationModel.findById(invitationId);
  
  if (!invitation) {
    throw new AppError('Invitation not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (invitation.invited_user_id !== userId) {
    throw new AppError('You are not authorized to accept this invitation.', HTTP_STATUS.FORBIDDEN);
  }

  if (invitation.status !== TEAM_INVITATION_STATUS.PENDING) {
    throw new AppError('This invitation has already been responded to.', HTTP_STATUS.CONFLICT);
  }

  if (new Date(invitation.expires_at) < new Date()) {
    throw new AppError('This invitation has expired.', HTTP_STATUS.CONFLICT);
  }

  // Check if user is already in a team
  const existingMembership = await teamMemberModel.findByUserId(userId);
  if (existingMembership) {
    throw new AppError('You are already a member of a team.', HTTP_STATUS.CONFLICT);
  }

  const connection = await require('../config/db').pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Update invitation status
    await teamInvitationModel.updateStatus(invitationId, TEAM_INVITATION_STATUS.ACCEPTED, new Date());

    // Add user to team as member
    await teamMemberModel.create({
      teamId: invitation.team_id,
      userId,
      role: TEAM_MEMBER_ROLE.MEMBER,
    });

    await connection.commit();

    // Notify team leader
    const team = await teamModel.findById(invitation.team_id);
    await notificationService.createNotification(team.leader_id, {
      type: NOTIFICATION_TYPES.TEAM_INVITATION_ACCEPTED,
      title: 'Invitation Accepted',
      message: 'A member has accepted your team invitation.',
      relatedId: invitation.team_id,
    });

    // Broadcast team activity
    const io = getIO();
    if (io) {
      broadcastTeamActivity(io, invitation.team_id, 'member_joined', {
        userId,
        userName: (await userModel.findById(userId)).name,
      });
    }

    // Log audit
    await auditService.logAudit(userId, 'team_invitation_accepted', { teamId: invitation.team_id, invitationId });

    return await getTeam(invitation.team_id, userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Declines a team invitation.
 * @param {number} invitationId - Invitation ID
 * @param {number} userId - User ID of the invitee
 * @returns {Promise<void>}
 */
async function declineInvitation(invitationId, userId) {
  const invitation = await teamInvitationModel.findById(invitationId);
  
  if (!invitation) {
    throw new AppError('Invitation not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (invitation.invited_user_id !== userId) {
    throw new AppError('You are not authorized to decline this invitation.', HTTP_STATUS.FORBIDDEN);
  }

  if (invitation.status !== TEAM_INVITATION_STATUS.PENDING) {
    throw new AppError('This invitation has already been responded to.', HTTP_STATUS.CONFLICT);
  }

  await teamInvitationModel.updateStatus(invitationId, TEAM_INVITATION_STATUS.DECLINED, new Date());

  // Log audit
  await auditService.logAudit(userId, 'team_invitation_declined', { teamId: invitation.team_id, invitationId });
}

/**
 * Lists pending invitations for the current user.
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of pending invitations
 */
async function getMyInvitations(userId) {
  return await teamInvitationModel.findPendingByUserId(userId);
}

/**
 * Gets the current user's team information.
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Team object or null if not in a team
 */
async function getMyTeam(userId) {
  const membership = await teamMemberModel.findByUserId(userId);
  
  if (!membership) {
    return null;
  }

  return await getTeam(membership.team_id, userId);
}

/**
 * Removes a member from the team.
 * @param {number} teamId - Team ID
 * @param {number} memberId - Team member ID
 * @param {number} userId - User ID of the requester (leader)
 * @returns {Promise<void>}
 */
async function removeMember(teamId, memberId, userId) {
  const team = await teamModel.findById(teamId);
  
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can remove members.', HTTP_STATUS.FORBIDDEN);
  }

  const member = await teamMemberModel.findByTeamAndUser(teamId, memberId);
  if (!member) {
    throw new AppError('Member not found in this team.', HTTP_STATUS.NOT_FOUND);
  }

  if (member.user_id === userId) {
    throw new AppError('You cannot remove yourself from the team. Use the leave team function instead.', HTTP_STATUS.FORBIDDEN);
  }

  if (member.role === TEAM_MEMBER_ROLE.LEADER) {
    throw new AppError('Cannot remove the team leader. Transfer leadership first.', HTTP_STATUS.FORBIDDEN);
  }

  await teamMemberModel.deleteByUserId(memberId);

  // Notify the removed member
  await notificationService.createNotification(memberId, {
    type: NOTIFICATION_TYPES.TEAM_MEMBER_REMOVED,
    title: 'Removed from Team',
    message: `You have been removed from the team "${team.name}".`,
    relatedId: teamId,
  });

  // PHASE 5: Broadcast team activity for real-time updates
  const io = getIO();
  if (io) {
    broadcastTeamActivity(io, teamId, 'member_removed', {
      userId: memberId,
      userName: (await userModel.findById(memberId)).name,
    });
  }

  // Log audit
  await auditService.logAudit(userId, 'team_member_removed', { teamId, removedUserId: memberId });
}

/**
 * Promotes a member to leader.
 * @param {number} teamId - Team ID
 * @param {number} memberId - Team member ID to promote
 * @param {number} userId - User ID of the requester (current leader)
 * @returns {Promise<void>}
 */
async function promoteMember(teamId, memberId, userId) {
  const team = await teamModel.findById(teamId);
  
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can promote members.', HTTP_STATUS.FORBIDDEN);
  }

  const member = await teamMemberModel.findByTeamAndUser(teamId, memberId);
  if (!member) {
    throw new AppError('Member not found in this team.', HTTP_STATUS.NOT_FOUND);
  }

  if (member.role === TEAM_MEMBER_ROLE.LEADER) {
    throw new AppError('This member is already the team leader.', HTTP_STATUS.CONFLICT);
  }

  const connection = await require('../config/db').pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Demote current leader to member
    await teamMemberModel.updateRoleByUserId(userId, TEAM_MEMBER_ROLE.MEMBER);

    // Promote new member to leader
    await teamMemberModel.updateRoleByUserId(memberId, TEAM_MEMBER_ROLE.LEADER);

    // Update team leader
    await teamModel.updateLeader(teamId, memberId);

    await connection.commit();

    // Notify the promoted member
    await notificationService.createNotification(memberId, {
      type: NOTIFICATION_TYPES.TEAM_MEMBER_PROMOTED,
      title: 'Promoted to Team Leader',
      message: `You have been promoted to team leader for "${team.name}".`,
      relatedId: teamId,
    });

    // Broadcast team activity
    const io = getIO();
    if (io) {
      broadcastTeamActivity(io, teamId, 'leader_changed', {
        oldLeaderId: userId,
        newLeaderId: memberId,
        newLeaderName: (await userModel.findById(memberId)).name,
      });
    }

    // Log audit
    await auditService.logAudit(userId, 'team_leadership_transferred', { teamId, newLeaderId: memberId });

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Transfers leadership to another member.
 * @param {number} teamId - Team ID
 * @param {number} memberId - Team member ID to transfer to
 * @param {number} userId - User ID of the requester (current leader)
 * @returns {Promise<void>}
 */
async function transferLeadership(teamId, memberId, userId) {
  const team = await teamModel.findById(teamId);
  
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can transfer leadership.', HTTP_STATUS.FORBIDDEN);
  }

  const member = await teamMemberModel.findByTeamAndUser(teamId, memberId);
  if (!member) {
    throw new AppError('Member not found in this team.', HTTP_STATUS.NOT_FOUND);
  }

  if (member.role === TEAM_MEMBER_ROLE.LEADER) {
    throw new AppError('This member is already the team leader.', HTTP_STATUS.CONFLICT);
  }

  const connection = await require('../config/db').pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Demote current leader to member
    await teamMemberModel.updateRoleByUserId(userId, TEAM_MEMBER_ROLE.MEMBER);

    // Promote new member to leader
    await teamMemberModel.updateRoleByUserId(memberId, TEAM_MEMBER_ROLE.LEADER);

    // Update team leader
    await teamModel.updateLeader(teamId, memberId);

    await connection.commit();

    // Notify the new leader
    await notificationService.createNotification(memberId, {
      type: NOTIFICATION_TYPES.TEAM_LEADERSHIP_TRANSFERRED,
      title: 'Leadership Transferred',
      message: `Team leadership has been transferred to you for "${team.name}".`,
      relatedId: teamId,
    });

    // Broadcast team activity
    const io = getIO();
    if (io) {
      broadcastTeamActivity(io, teamId, 'leader_changed', {
        oldLeaderId: userId,
        newLeaderId: memberId,
        newLeaderName: (await userModel.findById(memberId)).name,
      });
    }

    // Log audit
    await auditService.logAudit(userId, 'team_leadership_transferred', { teamId, newLeaderId: memberId });

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Leaves the team.
 * @param {number} userId - User ID of the member leaving
 * @returns {Promise<void>}
 */
async function leaveTeam(userId) {
  const membership = await teamMemberModel.findByUserId(userId);
  
  if (!membership) {
    throw new AppError('You are not a member of any team.', HTTP_STATUS.NOT_FOUND);
  }

  if (membership.role === TEAM_MEMBER_ROLE.LEADER) {
    throw new AppError('Team leaders cannot leave the team. Transfer leadership first.', HTTP_STATUS.FORBIDDEN);
  }

  const team = await teamModel.findById(membership.team_id);

  await teamMemberModel.deleteByUserId(userId);

  // Notify team leader
  await notificationService.createNotification(team.leader_id, {
    type: NOTIFICATION_TYPES.TEAM_MEMBER_LEFT,
    title: 'Member Left Team',
    message: 'A member has left your team.',
    relatedId: team.id,
  });

  // Broadcast team activity
  const io = getIO();
  if (io) {
    broadcastTeamActivity(io, team.id, 'member_left', {
      userId,
      userName: (await userModel.findById(userId)).name,
    });
  }

  // Log audit
  await auditService.logAudit(userId, 'team_left', { teamId: team.id });
}

module.exports = {
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  inviteMember,
  listTeamInvitations,
  cancelInvitation,
  acceptInvitation,
  declineInvitation,
  getMyInvitations,
  getMyTeam,
  removeMember,
  promoteMember,
  transferLeadership,
  leaveTeam,
};
