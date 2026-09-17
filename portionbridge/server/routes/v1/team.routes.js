const express = require('express');
const router = express.Router();

const {
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
} = require('../../controllers/team.controller');

const {
  createTeamValidationRules,
  updateTeamValidationRules,
  inviteMemberValidationRules,
  teamIdValidationRules,
  invitationIdValidationRules,
  memberIdValidationRules,
  sendJoinRequestValidationRules,
  requestIdValidationRules,
} = require('../../validators/team.validator');

const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');
const { USER_ROLES } = require('../../constants');

// Static / discovery & current user routes — MUST be above dynamic /:id parameter routes
router.get(
  '/search',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  searchTeams
);

router.get(
  '/my/invitations',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  getMyInvitations
);

router.get(
  '/my/join-requests',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  getMyJoinRequests
);

router.post(
  '/join-requests',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  sendJoinRequestValidationRules,
  validateRequest,
  sendJoinRequest
);

router.delete(
  '/my/join-requests/:requestId',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  requestIdValidationRules,
  validateRequest,
  cancelJoinRequest
);

router.get(
  '/my',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  getMyTeam
);

router.delete(
  '/my/leave',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  leaveTeam
);

// Team management routes (leader only)
router.post(
  '/',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  createTeamValidationRules,
  validateRequest,
  createTeam
);

router.get(
  '/:id',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  validateRequest,
  getTeam
);

router.patch(
  '/:id',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  updateTeamValidationRules,
  validateRequest,
  updateTeam
);

router.delete(
  '/:id',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  validateRequest,
  deleteTeam
);

router.get(
  '/:id/members',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  validateRequest,
  listMembers
);

// Team invitation routes (leader only)
router.post(
  '/:id/invite',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  inviteMemberValidationRules,
  validateRequest,
  inviteMember
);

router.get(
  '/:id/invitations',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  validateRequest,
  listTeamInvitations
);

router.delete(
  '/:id/invitations/:invitationId',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  invitationIdValidationRules,
  validateRequest,
  cancelInvitation
);

// Team join request management routes (leader only)
router.get(
  '/:id/join-requests',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  validateRequest,
  listTeamJoinRequests
);

router.post(
  '/:id/join-requests/:requestId/accept',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  requestIdValidationRules,
  validateRequest,
  acceptJoinRequest
);

router.post(
  '/:id/join-requests/:requestId/reject',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  requestIdValidationRules,
  validateRequest,
  rejectJoinRequest
);

// Team member management routes (leader only)
router.delete(
  '/:id/members/:memberId',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  memberIdValidationRules,
  validateRequest,
  removeMember
);

router.patch(
  '/:id/members/:memberId/promote',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  memberIdValidationRules,
  validateRequest,
  promoteMember
);

router.patch(
  '/:id/members/:memberId/transfer',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  teamIdValidationRules,
  memberIdValidationRules,
  validateRequest,
  transferLeadership
);

// Invitation response routes (all team members)
router.post(
  '/invitations/:id/accept',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  invitationIdValidationRules,
  validateRequest,
  acceptInvitation
);

router.post(
  '/invitations/:id/decline',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  invitationIdValidationRules,
  validateRequest,
  declineInvitation
);

module.exports = router;
