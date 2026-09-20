const { HTTP_STATUS, TEAM_MEMBER_ROLE, TEAM_INVITATION_STATUS, USER_ROLES, NOTIFICATION_TYPES, DONATION_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const teamModel = require('../models/team.model');
const teamMemberModel = require('../models/teamMember.model');
const teamInvitationModel = require('../models/teamInvitation.model');
const teamJoinRequestModel = require('../models/teamJoinRequest.model');
const userModel = require('../models/user.model');
const donationModel = require('../models/donation.model');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const { broadcastTeamActivity, getIO } = require('../sockets/ioInstance');

// Donation statuses that represent a mission still in progress for
// whoever it's assigned to — used by removeMember/leaveTeam below to
// block a member from disappearing out from under an active pickup they
// were actually doing (Phase 3: neither check existed before, so removing
// or leaving mid-mission silently orphaned the assignment — the donation
// kept assigned_member_id pointing at someone no longer on the team, with
// no volunteer able to act on it).
const ACTIVE_DONATION_STATUSES = [
  DONATION_STATUS.ACCEPTED,
  DONATION_STATUS.SCHEDULED,
  DONATION_STATUS.ON_THE_WAY,
  DONATION_STATUS.PICKED_UP,
];

/**
 * Throws if the given user currently has any team donation assigned to
 * them (as assigned_member_id) that's still in progress. Used before
 * removing or letting a member leave a team.
 * @param {number} userId
 * @param {string} [action] - 'removed' or 'leave', for the error wording
 * @returns {Promise<void>}
 */
async function assertNoActiveAssignment(userId, action = 'removed') {
  const assignments = await donationModel.findByAssignedMember(userId);
  const active = assignments.filter((d) => ACTIVE_DONATION_STATUSES.includes(d.status));
  if (active.length > 0) {
    const verb = action === 'leave' ? 'leave the team' : 'be removed from the team';
    throw new AppError(
      `This member has ${active.length} active donation assignment${active.length > 1 ? 's' : ''} in progress and can't ${verb} yet. Reassign or wait for completion first.`,
      HTTP_STATUS.CONFLICT
    );
  }
}

async function assertNoActiveTeamAssignment(teamId) {
  const assignments = await donationModel.findByTeamId(teamId);
  const active = assignments.filter((d) => ACTIVE_DONATION_STATUSES.includes(d.status));
  if (active.length > 0) {
    throw new AppError(
      `This team has ${active.length} active donation${active.length > 1 ? 's' : ''} in progress and can't be deleted yet. Wait for completion first.`,
      HTTP_STATUS.CONFLICT
    );
  }
}

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
    const teamId = await teamModel.create({ name, description, leaderId: userId }, connection);

    // Add creator as leader member
    await teamMemberModel.create({ teamId, userId, role: TEAM_MEMBER_ROLE.LEADER }, connection);

    await connection.commit();

    // Log audit
    await auditService.record({ userId, action: 'team_created', metadata: { teamId, name } });

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
  await auditService.record({ userId, action: 'team_updated', metadata: { teamId, ...data } });

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

  // Block deletion if team has active donations
  await assertNoActiveTeamAssignment(teamId);

  await teamModel.deleteById(teamId);

  // Log audit
  await auditService.record({ userId, action: 'team_deleted', metadata: { teamId } });
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
  await auditService.record({ userId, action: 'team_invitation_sent', metadata: { teamId, invitedUserId: targetUserId } });

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
  await auditService.record({ userId, action: 'team_invitation_cancelled', metadata: { teamId, invitationId } });
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
    await teamInvitationModel.updateStatus(invitationId, TEAM_INVITATION_STATUS.ACCEPTED, new Date(), connection);

    // Add user to team as member
    await teamMemberModel.create({
      teamId: invitation.team_id,
      userId,
      role: TEAM_MEMBER_ROLE.MEMBER,
    }, connection);

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
      broadcastTeamActivity(invitation.team_id, 'member_joined', {
        userId,
        userName: (await userModel.findById(userId)).name,
      });
    }

    // Log audit
    await auditService.record({ userId, action: 'team_invitation_accepted', metadata: { teamId: invitation.team_id, invitationId } });

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
  await auditService.record({ userId, action: 'team_invitation_declined', metadata: { teamId: invitation.team_id, invitationId } });
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

  // Phase 3: Block removal if the member has active team assignments
  await assertNoActiveAssignment(memberId, 'removed');

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
    broadcastTeamActivity(teamId, 'member_removed', {
      userId: memberId,
      userName: (await userModel.findById(memberId)).name,
    });
  }

  // Log audit
  await auditService.record({ userId, action: 'team_member_removed', metadata: { teamId, removedUserId: memberId } });
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
    await teamMemberModel.updateRoleByUserId(userId, TEAM_MEMBER_ROLE.MEMBER, connection);

    // Promote new member to leader
    await teamMemberModel.updateRoleByUserId(memberId, TEAM_MEMBER_ROLE.LEADER, connection);

    // Update team leader
    await teamModel.updateLeader(teamId, memberId, connection);

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
      broadcastTeamActivity(teamId, 'leader_changed', {
        oldLeaderId: userId,
        newLeaderId: memberId,
        newLeaderName: (await userModel.findById(memberId)).name,
      });
    }

    // Log audit
    await auditService.record({ userId, action: 'team_leadership_transferred', metadata: { teamId, newLeaderId: memberId } });

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
    await teamMemberModel.updateRoleByUserId(userId, TEAM_MEMBER_ROLE.MEMBER, connection);

    // Promote new member to leader
    await teamMemberModel.updateRoleByUserId(memberId, TEAM_MEMBER_ROLE.LEADER, connection);

    // Update team leader
    await teamModel.updateLeader(teamId, memberId, connection);

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
      broadcastTeamActivity(teamId, 'leader_changed', {
        oldLeaderId: userId,
        newLeaderId: memberId,
        newLeaderName: (await userModel.findById(memberId)).name,
      });
    }

    // Log audit
    await auditService.record({ userId, action: 'team_leadership_transferred', metadata: { teamId, newLeaderId: memberId } });

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

  // Phase 3: Block leaving if the member has active team assignments
  await assertNoActiveAssignment(userId, 'leave');

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
    broadcastTeamActivity(team.id, 'member_left', {
      userId,
      userName: (await userModel.findById(userId)).name,
    });
  }

  // Log audit
  await auditService.record({ userId, action: 'team_left', metadata: { teamId: team.id } });
}

/**
 * Searches teams for volunteer discovery.
 * @param {Object} query - Query params (search, page, limit)
 * @returns {Promise<Object>} Search results with pagination meta
 */
async function searchTeams(query = {}) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  const search = query.search ? String(query.search).trim() : null;

  const teams = await teamModel.searchTeams({ search, limit, offset });
  return { teams, page, limit };
}

/**
 * Sends a join request to a team.
 * @param {number} userId - Requesting volunteer ID
 * @param {Object} data - { teamId, message }
 * @returns {Promise<Object>} Created request
 */
async function sendJoinRequest(userId, { teamId, message }) {
  const user = await userModel.findById(userId);
  if (!user || user.role !== USER_ROLES.VOLUNTEER) {
    throw new AppError('Only volunteers can send team join requests.', HTTP_STATUS.FORBIDDEN);
  }

  // Check if volunteer already in a team
  const isMember = await teamMemberModel.isUserInTeam(userId);
  if (isMember) {
    throw new AppError('You are already a member of a team.', HTTP_STATUS.CONFLICT);
  }

  const team = await teamModel.findById(teamId);
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Check if there is already a pending request
  const existingPending = await teamJoinRequestModel.findPendingByTeamAndUser(teamId, userId);
  if (existingPending) {
    throw new AppError('You already have a pending join request for this team.', HTTP_STATUS.CONFLICT);
  }

  // Create join request
  const requestId = await teamJoinRequestModel.create({
    teamId,
    userId,
    message,
  });

  // Send notification to team leader
  await notificationService.createNotification(team.leader_id, {
    type: NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_RECEIVED,
    title: 'New Team Join Request',
    message: `${user.name} has requested to join your team "${team.name}".`,
    relatedId: teamId,
  });

  // Audit log
  await auditService.record({ userId, action: 'team_join_request_sent', metadata: { teamId, requestId } });

  return await teamJoinRequestModel.findById(requestId);
}

/**
 * Lists join requests sent by the current volunteer.
 * @param {number} userId - Volunteer user ID
 * @returns {Promise<Array>} List of requests with team details
 */
async function getMyJoinRequests(userId) {
  return await teamJoinRequestModel.findByUserId(userId);
}

/**
 * Cancels a pending join request sent by current volunteer.
 * @param {number} userId - Volunteer user ID
 * @param {number} requestId - Request ID
 * @returns {Promise<void>}
 */
async function cancelJoinRequest(userId, requestId) {
  const request = await teamJoinRequestModel.findById(requestId);
  if (!request) {
    throw new AppError('Join request not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (request.user_id !== userId) {
    throw new AppError('You are not authorized to cancel this request.', HTTP_STATUS.FORBIDDEN);
  }

  if (request.status !== 'pending') {
    throw new AppError('Only pending join requests can be cancelled.', HTTP_STATUS.CONFLICT);
  }

  await teamJoinRequestModel.updateStatus(requestId, 'cancelled', new Date());
}

/**
 * Lists pending join requests for a team (leader only).
 * @param {number} teamId - Team ID
 * @param {number} userId - Leader user ID
 * @returns {Promise<Array>} Array of pending join requests
 */
async function listTeamJoinRequests(teamId, userId) {
  const team = await teamModel.findById(teamId);
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can view team join requests.', HTTP_STATUS.FORBIDDEN);
  }

  return await teamJoinRequestModel.findPendingByTeamId(teamId);
}

/**
 * Accepts a join request (leader only).
 * @param {number} teamId - Team ID
 * @param {number} requestId - Request ID
 * @param {number} userId - Leader user ID
 * @returns {Promise<Object>} Added team member
 */
async function acceptJoinRequest(teamId, requestId, userId) {
  const team = await teamModel.findById(teamId);
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can accept join requests.', HTTP_STATUS.FORBIDDEN);
  }

  const request = await teamJoinRequestModel.findById(requestId);
  if (!request || request.team_id !== teamId) {
    throw new AppError('Join request not found for this team.', HTTP_STATUS.NOT_FOUND);
  }

  if (request.status !== 'pending') {
    throw new AppError('This join request is no longer pending.', HTTP_STATUS.CONFLICT);
  }

  // Check if volunteer is already in a team
  const targetUserInTeam = await teamMemberModel.isUserInTeam(request.user_id);
  if (targetUserInTeam) {
    await teamJoinRequestModel.updateStatus(requestId, 'rejected', new Date());
    throw new AppError('This volunteer has already joined another team.', HTTP_STATUS.CONFLICT);
  }

  const connection = await require('../config/db').pool.getConnection();

  try {
    await connection.beginTransaction();

    // Update request status
    await teamJoinRequestModel.updateStatus(requestId, 'accepted', new Date(), connection);

    // Add volunteer to team_members
    await teamMemberModel.create({
      teamId,
      userId: request.user_id,
      role: TEAM_MEMBER_ROLE.MEMBER,
    }, connection);

    await connection.commit();

    // Notify requesting volunteer
    const targetUser = await userModel.findById(request.user_id);
    await notificationService.createNotification(request.user_id, {
      type: NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_ACCEPTED,
      title: 'Join Request Accepted',
      message: `Your request to join team "${team.name}" was accepted!`,
      relatedId: teamId,
    });

    // Broadcast team activity
    const io = getIO();
    if (io) {
      broadcastTeamActivity(teamId, 'member_joined', {
        userId: request.user_id,
        userName: targetUser.name,
      });
    }

    await auditService.record({ userId, action: 'team_join_request_accepted', metadata: { teamId, requestId, volunteerId: request.user_id } });

    return await teamMemberModel.findByTeamAndUser(teamId, request.user_id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Rejects a join request (leader only).
 * @param {number} teamId - Team ID
 * @param {number} requestId - Request ID
 * @param {number} userId - Leader user ID
 * @returns {Promise<void>}
 */
async function rejectJoinRequest(teamId, requestId, userId) {
  const team = await teamModel.findById(teamId);
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only the team leader can reject join requests.', HTTP_STATUS.FORBIDDEN);
  }

  const request = await teamJoinRequestModel.findById(requestId);
  if (!request || request.team_id !== teamId) {
    throw new AppError('Join request not found for this team.', HTTP_STATUS.NOT_FOUND);
  }

  if (request.status !== 'pending') {
    throw new AppError('This join request is no longer pending.', HTTP_STATUS.CONFLICT);
  }

  await teamJoinRequestModel.updateStatus(requestId, 'rejected', new Date());

  // Notify requesting volunteer
  await notificationService.createNotification(request.user_id, {
    type: NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_REJECTED,
    title: 'Join Request Update',
    message: `Your request to join team "${team.name}" was declined.`,
    relatedId: teamId,
  });

  await auditService.record({ userId, action: 'team_join_request_rejected', metadata: { teamId, requestId, volunteerId: request.user_id } });
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
  searchTeams,
  sendJoinRequest,
  getMyJoinRequests,
  cancelJoinRequest,
  listTeamJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
};

