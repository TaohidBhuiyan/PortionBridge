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
} = require('../../controllers/team.controller');

const {
  createTeamValidationRules,
  updateTeamValidationRules,
  inviteMemberValidationRules,
  teamIdValidationRules,
  invitationIdValidationRules,
  memberIdValidationRules,
} = require('../../validators/team.validator');

const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');
const { USER_ROLES } = require('../../constants');

// Current user team routes
// PHASE 4 FIX: these three static-path routes (/my, /my/invitations,
// /my/leave) were originally registered AFTER 'GET /:id' and
// 'GET /:id/invitations' below. Since teamIdValidationRules requires :id
// to be a positive integer, a request to GET /team/my or
// GET /team/my/invitations would match the earlier :id-based route first,
// fail that validation (id="my" isn't an integer), and return 400 —
// meaning "My Team" and "My Invitations" were completely unreachable.
// This is the exact same class of bug fixed in donation.routes.js during
// Phase 1: moving the static routes above the dynamic ones fixes it, with
// no change to any handler's logic or authorization.
router.get(
  '/my/invitations',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  getMyInvitations
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

// Current user team routes moved to the top of this file — see the
// PHASE 4 FIX comment there for why.

module.exports = router;
