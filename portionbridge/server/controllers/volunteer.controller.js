const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const volunteerService = require('../services/volunteer.service');

/**
 * GET /api/v1/volunteer/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await volunteerService.getDashboard(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Volunteer dashboard retrieved successfully.',
    data: { dashboard },
  });
});

/**
 * GET /api/v1/volunteer/assignments
 * Active assignments (accepted/scheduled) — search, filter, sort, paginate.
 */
const listAssignments = asyncHandler(async (req, res) => {
  const { assignments, meta } = await volunteerService.listAssignments(req.user.id, req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Active assignments retrieved successfully.',
    data: { assignments },
    meta,
  });
});

/**
 * GET /api/v1/volunteer/upcoming
 * Scheduled, future pickups only, ordered by scheduled_at ASC.
 */
const getUpcoming = asyncHandler(async (req, res) => {
  const { assignments, meta } = await volunteerService.getUpcoming(req.user.id, req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Upcoming pickups retrieved successfully.',
    data: { assignments },
    meta,
  });
});

/**
 * GET /api/v1/volunteer/assignments/:id
 */
const getAssignmentDetail = asyncHandler(async (req, res) => {
  const assignment = await volunteerService.getAssignmentDetail(req.user.id, req.params.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Assignment details retrieved successfully.',
    data: { assignment },
  });
});

module.exports = {
  getDashboard,
  listAssignments,
  getUpcoming,
  getAssignmentDetail,
};
