const express = require('express');
const router = express.Router();

const { createReport, listMyReports } = require('../../controllers/report.controller');
const { createReportValidationRules, listMyReportsValidationRules } = require('../../validators/report.validator');
const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');
const { USER_ROLES } = require('../../constants');

// Both donors and volunteers may file reports — further restricted inside
// reportService.createReport to only participants of the named donation.
router.post(
  '/',
  protect,
  authorize(USER_ROLES.DONOR, USER_ROLES.VOLUNTEER),
  createReportValidationRules,
  validateRequest,
  createReport
);

router.get(
  '/my',
  protect,
  authorize(USER_ROLES.DONOR, USER_ROLES.VOLUNTEER),
  listMyReportsValidationRules,
  validateRequest,
  listMyReports
);

module.exports = router;
