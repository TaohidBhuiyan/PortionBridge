const express = require('express');
const router = express.Router();

const {
  getDashboard,
  listAssignments,
  getUpcoming,
  getAssignmentDetail,
} = require('../../controllers/volunteer.controller');

const {
  dashboardValidationRules,
  assignmentsListValidationRules,
  upcomingValidationRules,
  assignmentDetailValidationRules,
} = require('../../validators/volunteer.validator');

const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');
const { USER_ROLES } = require('../../constants');

// Every route here is volunteer-only — donors and admins are 403'd by authorize().

// --- Static paths first — must be registered before ':id' so they're ---
// --- never shadowed by the param route (same reasoning as donation.routes.js) ---
router.get(
  '/dashboard',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  dashboardValidationRules,
  validateRequest,
  getDashboard
);

router.get(
  '/upcoming',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  upcomingValidationRules,
  validateRequest,
  getUpcoming
);

router.get(
  '/assignments',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  assignmentsListValidationRules,
  validateRequest,
  listAssignments
);

router.get(
  '/assignments/:id',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  assignmentDetailValidationRules,
  validateRequest,
  getAssignmentDetail
);

module.exports = router;
