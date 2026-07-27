const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getClientIp, getUserAgent } = require('../utils/helpers');
const reportService = require('../services/report.service');

/**
 * POST /api/v1/reports
 */
const createReport = asyncHandler(async (req, res) => {
  const { donationId, reportedUserId, reason, details } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const report = await reportService.createReport(req.user.id, {
    donationId,
    reportedUserId,
    reason,
    details,
    ipAddress,
    userAgent,
  });

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Report submitted successfully.',
    data: { report },
  });
});

/**
 * GET /api/v1/reports/my
 */
const listMyReports = asyncHandler(async (req, res) => {
  const { reports, meta } = await reportService.listMyReports(req.user.id, req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Your reports retrieved successfully.',
    data: { reports },
    meta,
  });
});

module.exports = { createReport, listMyReports };
