const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');

/**
 * GET /api/v1/admin/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await adminService.getDashboard();

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Admin dashboard retrieved successfully.',
    data: { dashboard },
  });
});

/**
 * GET /api/v1/admin/users
 */
const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await adminService.listUsers(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Users retrieved successfully.',
    data: { users },
    meta,
  });
});

/**
 * GET /api/v1/admin/users/:id
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await adminService.getUserDetail(req.params.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'User retrieved successfully.',
    data: { user },
  });
});

/**
 * PATCH /api/v1/admin/users/:id/disable
 */
const disableUser = asyncHandler(async (req, res) => {
  const user = await adminService.disableUser(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'User disabled successfully.',
    data: { user },
  });
});

/**
 * PATCH /api/v1/admin/users/:id/enable
 */
const enableUser = asyncHandler(async (req, res) => {
  const user = await adminService.enableUser(req.params.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'User re-enabled successfully.',
    data: { user },
  });
});

/**
 * GET /api/v1/admin/users/:id/activity
 */
const getUserActivity = asyncHandler(async (req, res) => {
  const { user, activity, summary, meta } = await adminService.getUserActivity(req.params.id, req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'User activity retrieved successfully.',
    data: { user, activity, summary },
    meta,
  });
});

/**
 * GET /api/v1/admin/donations
 */
const listDonations = asyncHandler(async (req, res) => {
  const { donations, meta } = await adminService.listDonations(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donations retrieved successfully.',
    data: { donations },
    meta,
  });
});

/**
 * GET /api/v1/admin/donations/:id
 */
const getDonation = asyncHandler(async (req, res) => {
  const donation = await adminService.getDonationDetail(req.params.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation retrieved successfully.',
    data: { donation },
  });
});

/**
 * GET /api/v1/admin/donations/:id/history
 */
const getDonationHistory = asyncHandler(async (req, res) => {
  const { donation, history } = await adminService.getDonationHistory(req.params.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation status history retrieved successfully.',
    data: { donation, history },
  });
});

/**
 * GET /api/v1/admin/volunteers
 */
const listVolunteers = asyncHandler(async (req, res) => {
  const { volunteers, meta } = await adminService.listVolunteers(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Volunteers retrieved successfully.',
    data: { volunteers },
    meta,
  });
});

/**
 * GET /api/v1/admin/volunteers/:id
 */
const getVolunteer = asyncHandler(async (req, res) => {
  const { volunteer, stats, availability, team, currentAssignments } = await adminService.getVolunteerDetail(req.params.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Volunteer retrieved successfully.',
    data: { volunteer, stats, availability, team, currentAssignments },
  });
});

/**
 * GET /api/v1/admin/teams
 */
const listTeams = asyncHandler(async (req, res) => {
  const { teams, meta } = await adminService.listTeams(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Teams retrieved successfully.',
    data: { teams },
    meta,
  });
});

/**
 * GET /api/v1/admin/teams/:id
 */
const getTeam = asyncHandler(async (req, res) => {
  const { team, members, activeMissions, completedMissions, activity } = await adminService.getTeamDetail(req.params.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team retrieved successfully.',
    data: { team, members, activeMissions, completedMissions, activity },
  });
});

/**
 * GET /api/v1/admin/live-operations (Phase 6)
 */
const getLiveOperations = asyncHandler(async (req, res) => {
  const data = await adminService.getLiveOperations();

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Live operations data retrieved successfully.',
    data,
  });
});

/**
 * GET /api/v1/admin/attention-center (Phase 7)
 */
const getAttentionCenter = asyncHandler(async (req, res) => {
  const { items, generatedAt } = await adminService.getAttentionCenter();

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Attention center retrieved successfully.',
    data: { items, generatedAt },
  });
});

/**
 * GET /api/v1/admin/reports
 */
const listReports = asyncHandler(async (req, res) => {
  const { reports, meta } = await adminService.listReports(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Reports retrieved successfully.',
    data: { reports },
    meta,
  });
});

/**
 * GET /api/v1/admin/reports/:id
 */
const getReport = asyncHandler(async (req, res) => {
  const report = await adminService.getReportDetail(req.params.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Report retrieved successfully.',
    data: { report },
  });
});

/**
 * PATCH /api/v1/admin/reports/:id/investigate
 */
const investigateReport = asyncHandler(async (req, res) => {
  const report = await adminService.investigateReport(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Report marked as under investigation.',
    data: { report },
  });
});

/**
 * PATCH /api/v1/admin/reports/:id/resolve
 */
const resolveReport = asyncHandler(async (req, res) => {
  const report = await adminService.resolveReport(req.params.id, req.user.id, req.body.notes);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Report resolved.',
    data: { report },
  });
});

/**
 * PATCH /api/v1/admin/reports/:id/dismiss
 */
const dismissReport = asyncHandler(async (req, res) => {
  const report = await adminService.dismissReport(req.params.id, req.user.id, req.body.notes);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Report dismissed.',
    data: { report },
  });
});

/**
 * POST /api/v1/admin/announcements
 */
const sendAnnouncement = asyncHandler(async (req, res) => {
  const result = await adminService.sendAnnouncement(req.body, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Announcement sent.',
    data: result,
  });
});

/**
 * GET /api/v1/admin/announcements
 */
const listAnnouncementHistory = asyncHandler(async (req, res) => {
  const announcements = await adminService.listAnnouncementHistory();

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Announcement history retrieved successfully.',
    data: { announcements },
  });
});

/**
 * GET /api/v1/admin/area-intelligence
 */
const getAreaIntelligence = asyncHandler(async (req, res) => {
  const { areas, insights, generatedAt } = await adminService.getAreaIntelligence();

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Area intelligence retrieved successfully.',
    data: { areas, insights, generatedAt },
  });
});

module.exports = {
  getDashboard,
  listUsers,
  getUser,
  disableUser,
  enableUser,
  getUserActivity,
  listDonations,
  getDonation,
  getDonationHistory,
  listVolunteers,
  getVolunteer,
  listTeams,
  getTeam,
  getLiveOperations,
  getAttentionCenter,
  listReports,
  getReport,
  investigateReport,
  resolveReport,
  dismissReport,
  sendAnnouncement,
  listAnnouncementHistory,
  getAreaIntelligence,
};
