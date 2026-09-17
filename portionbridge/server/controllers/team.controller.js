const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const teamService = require('../services/team.service');

/**
 * POST /api/v1/teams
 * Create a new team
 */
const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.user.id, req.body);

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Team created successfully.',
    data: { team },
  });
});

/**
 * GET /api/v1/teams/:id
 * Get team details
 */
const getTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getTeam(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team retrieved successfully.',
    data: { team },
  });
});

/**
 * PATCH /api/v1/teams/:id
 * Update team information
 */
const updateTeam = asyncHandler(async (req, res) => {
  const team = await teamService.updateTeam(req.params.id, req.user.id, req.body);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team updated successfully.',
    data: { team },
  });
});

/**
 * DELETE /api/v1/teams/:id
 * Delete a team
 */
const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.deleteTeam(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team deleted successfully.',
  });
});

/**
 * GET /api/v1/teams/:id/members
 * List team members
 */
const listMembers = asyncHandler(async (req, res) => {
  const team = await teamService.getTeam(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team members retrieved successfully.',
    data: { members: team.members },
  });
});

/**
 * POST /api/v1/teams/:id/invite
 * Invite a member to the team
 */
const inviteMember = asyncHandler(async (req, res) => {
  const invitation = await teamService.inviteMember(req.params.id, req.user.id, req.body);

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Invitation sent successfully.',
    data: { invitation },
  });
});

/**
 * GET /api/v1/teams/:id/invitations
 * List pending invitations for a team
 */
const listTeamInvitations = asyncHandler(async (req, res) => {
  const invitations = await teamService.listTeamInvitations(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team invitations retrieved successfully.',
    data: { invitations },
  });
});

/**
 * DELETE /api/v1/teams/:id/invitations/:invitationId
 * Cancel a team invitation
 */
const cancelInvitation = asyncHandler(async (req, res) => {
  await teamService.cancelInvitation(req.params.id, req.params.invitationId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Invitation cancelled successfully.',
  });
});

/**
 * DELETE /api/v1/teams/:id/members/:memberId
 * Remove a member from the team
 */
const removeMember = asyncHandler(async (req, res) => {
  await teamService.removeMember(req.params.id, req.params.memberId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Member removed successfully.',
  });
});

/**
 * PATCH /api/v1/teams/:id/members/:memberId/promote
 * Promote a member to leader
 */
const promoteMember = asyncHandler(async (req, res) => {
  await teamService.promoteMember(req.params.id, req.params.memberId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Member promoted to leader successfully.',
  });
});

/**
 * PATCH /api/v1/teams/:id/members/:memberId/transfer
 * Transfer leadership to a member
 */
const transferLeadership = asyncHandler(async (req, res) => {
  await teamService.transferLeadership(req.params.id, req.params.memberId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Leadership transferred successfully.',
  });
});

/**
 * POST /api/v1/team-invitations/:id/accept
 * Accept a team invitation
 */
const acceptInvitation = asyncHandler(async (req, res) => {
  const team = await teamService.acceptInvitation(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Invitation accepted successfully.',
    data: { team },
  });
});

/**
 * POST /api/v1/team-invitations/:id/decline
 * Decline a team invitation
 */
const declineInvitation = asyncHandler(async (req, res) => {
  await teamService.declineInvitation(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Invitation declined successfully.',
  });
});

/**
 * GET /api/v1/team/invitations
 * Get pending invitations for current user
 */
const getMyInvitations = asyncHandler(async (req, res) => {
  const invitations = await teamService.getMyInvitations(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Your invitations retrieved successfully.',
    data: { invitations },
  });
});

/**
 * GET /api/v1/team
 * Get current user's team information
 */
const getMyTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getMyTeam(req.user.id);

  if (!team) {
    return success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'You are not a member of any team.',
      data: { team: null },
    });
  }

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Your team retrieved successfully.',
    data: { team },
  });
});

/**
 * DELETE /api/v1/team/members/me
 * Leave the current team
 */
const leaveTeam = asyncHandler(async (req, res) => {
  await teamService.leaveTeam(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'You have left the team successfully.',
  });
});

/**
 * GET /api/v1/teams/search
 * Search teams for discovery
 */
const searchTeams = asyncHandler(async (req, res) => {
  const result = await teamService.searchTeams(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Teams retrieved successfully.',
    data: result,
  });
});

/**
 * POST /api/v1/teams/join-requests
 * Send a team join request
 */
const sendJoinRequest = asyncHandler(async (req, res) => {
  const request = await teamService.sendJoinRequest(req.user.id, req.body);

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Join request sent successfully.',
    data: { request },
  });
});

/**
 * GET /api/v1/teams/my/join-requests
 * Get join requests sent by current volunteer
 */
const getMyJoinRequests = asyncHandler(async (req, res) => {
  const requests = await teamService.getMyJoinRequests(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Your join requests retrieved successfully.',
    data: { requests },
  });
});

/**
 * DELETE /api/v1/teams/my/join-requests/:requestId
 * Cancel a pending join request
 */
const cancelJoinRequest = asyncHandler(async (req, res) => {
  await teamService.cancelJoinRequest(req.user.id, req.params.requestId);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Join request cancelled successfully.',
  });
});

/**
 * GET /api/v1/teams/:id/join-requests
 * List pending join requests for a team (leader only)
 */
const listTeamJoinRequests = asyncHandler(async (req, res) => {
  const requests = await teamService.listTeamJoinRequests(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team join requests retrieved successfully.',
    data: { requests },
  });
});

/**
 * POST /api/v1/teams/:id/join-requests/:requestId/accept
 * Accept a join request (leader only)
 */
const acceptJoinRequest = asyncHandler(async (req, res) => {
  const member = await teamService.acceptJoinRequest(req.params.id, req.params.requestId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Join request accepted successfully.',
    data: { member },
  });
});

/**
 * POST /api/v1/teams/:id/join-requests/:requestId/reject
 * Reject a join request (leader only)
 */
const rejectJoinRequest = asyncHandler(async (req, res) => {
  await teamService.rejectJoinRequest(req.params.id, req.params.requestId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Join request rejected successfully.',
  });
});

module.exports = {
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  listMembers,
  inviteMember,
  listTeamInvitations,
  cancelInvitation,
  removeMember,
  promoteMember,
  transferLeadership,
  acceptInvitation,
  declineInvitation,
  getMyInvitations,
  getMyTeam,
  leaveTeam,
  searchTeams,
  sendJoinRequest,
  getMyJoinRequests,
  cancelJoinRequest,
  listTeamJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
};

