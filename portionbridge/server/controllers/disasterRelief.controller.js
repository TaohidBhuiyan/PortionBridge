const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { getClientIp, getUserAgent } = require('../utils/helpers');
const { HTTP_STATUS } = require('../constants');
const incidentService = require('../services/disasterIncident.service');
const requestService = require('../services/reliefRequest.service');
const pledgeService = require('../services/reliefPledge.service');
const taskService = require('../services/reliefTask.service');
const reviewService = require('../services/reliefReview.service');

const ctxOf = (req) => ({ ipAddress: getClientIp(req), userAgent: getUserAgent(req) });

// ---- Incidents -------------------------------------------------------------

const reportIncident = asyncHandler(async (req, res) => {
  const incident = await incidentService.reportIncident(req.user, req.body, ctxOf(req));
  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Incident reported. It will be visible once an administrator verifies it.',
    data: { incident },
  });
});

const listIncidents = asyncHandler(async (req, res) => {
  const { incidents, meta } = await incidentService.listIncidents(req.query, req.user);
  return success(res, { message: 'Incidents retrieved successfully.', data: { incidents }, meta });
});

const getIncident = asyncHandler(async (req, res) => {
  const incident = await incidentService.getIncident(req.params.id, req.user);
  return success(res, { message: 'Incident retrieved successfully.', data: { incident } });
});

const updateIncident = asyncHandler(async (req, res) => {
  const incident = await incidentService.updateIncident(req.params.id, req.user, req.body, ctxOf(req));
  return success(res, { message: 'Incident updated successfully.', data: { incident } });
});

const changeIncidentStatus = asyncHandler(async (req, res) => {
  const incident = await incidentService.changeStatus(req.params.id, req.user, req.body, ctxOf(req));
  return success(res, { message: 'Incident status updated successfully.', data: { incident } });
});

// ---- Relief requests -------------------------------------------------------

const createRequest = asyncHandler(async (req, res) => {
  const request = await requestService.createRequest(req.user, req.params.incidentId, req.body, ctxOf(req));
  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Relief request submitted for review.',
    data: { request },
  });
});

const listRequests = asyncHandler(async (req, res) => {
  const { requests, meta } = await requestService.listRequests({ incidentId: req.params.incidentId }, req.query, req.user);
  return success(res, { message: 'Relief requests retrieved successfully.', data: { requests }, meta });
});

const getRequest = asyncHandler(async (req, res) => {
  const request = await requestService.getRequest(req.params.id, req.user);
  return success(res, { message: 'Relief request retrieved successfully.', data: { request } });
});

const getRequestSummary = asyncHandler(async (req, res) => {
  const summary = await requestService.getFulfillmentSummary(req.params.id, req.user);
  return success(res, { message: 'Fulfillment summary retrieved successfully.', data: { summary } });
});

const updateRequest = asyncHandler(async (req, res) => {
  const request = await requestService.updateRequest(req.params.id, req.user, req.body, ctxOf(req));
  return success(res, { message: 'Relief request updated successfully.', data: { request } });
});

const changeRequestStatus = asyncHandler(async (req, res) => {
  const request = await requestService.changeRequestStatus(req.params.id, req.user, req.body, ctxOf(req));
  return success(res, { message: 'Relief request status updated successfully.', data: { request } });
});

const listRequestPledges = asyncHandler(async (req, res) => {
  const { pledges, meta } = await pledgeService.listRequestPledges(req.params.id, req.query);
  return success(res, { message: 'Pledges retrieved successfully.', data: { pledges }, meta });
});

// ---- Items -----------------------------------------------------------------

const addItem = asyncHandler(async (req, res) => {
  const item = await requestService.addItem(req.params.id, req.user, req.body, ctxOf(req));
  return success(res, { statusCode: HTTP_STATUS.CREATED, message: 'Item added successfully.', data: { item } });
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await requestService.updateItem(req.params.id, req.params.itemId, req.user, req.body, ctxOf(req));
  return success(res, { message: 'Item updated successfully.', data: { item } });
});

const removeItem = asyncHandler(async (req, res) => {
  const result = await requestService.removeItem(req.params.id, req.params.itemId, req.user, ctxOf(req), req.body && req.body.reason);
  return success(res, { message: 'Item removed successfully.', data: result });
});

// ---- Pledges ---------------------------------------------------------------

const createPledge = asyncHandler(async (req, res) => {
  const result = await pledgeService.createPledge(req.user, req.params.itemId, req.body, {
    idempotencyKey: req.headers['idempotency-key'] || null,
    ctx: ctxOf(req),
  });
  return success(res, {
    statusCode: result.idempotentReplay ? HTTP_STATUS.OK : HTTP_STATUS.CREATED,
    message: result.idempotentReplay ? 'Pledge already recorded (idempotent replay).' : 'Pledge recorded successfully.',
    data: result,
  });
});

const listMyPledges = asyncHandler(async (req, res) => {
  const { pledges, meta } = await pledgeService.listMyPledges(req.user, req.query);
  return success(res, { message: 'Pledges retrieved successfully.', data: { pledges }, meta });
});

const getPledge = asyncHandler(async (req, res) => {
  const data = await pledgeService.getPledge(req.user, req.params.id);
  return success(res, { message: 'Pledge retrieved successfully.', data });
});

const updatePledge = asyncHandler(async (req, res) => {
  const data = await pledgeService.updatePledge(req.user, req.params.id, req.body, ctxOf(req));
  return success(res, { message: 'Pledge updated successfully.', data });
});

const cancelPledge = asyncHandler(async (req, res) => {
  const data = await pledgeService.cancelPledge(req.user, req.params.id, req.body, ctxOf(req));
  return success(res, { message: 'Pledge cancelled successfully.', data });
});

const recordCollection = asyncHandler(async (req, res) => {
  const data = await pledgeService.recordCollection(req.user, req.params.id, req.body, ctxOf(req));
  return success(res, { message: 'Collection recorded successfully.', data });
});

const recordDelivery = asyncHandler(async (req, res) => {
  const data = await pledgeService.recordDelivery(req.user, req.params.id, req.body, ctxOf(req));
  return success(res, { message: 'Delivery recorded successfully.', data });
});

const closePledgePartial = asyncHandler(async (req, res) => {
  const data = await pledgeService.closePledgePartial(req.user, req.params.id, ctxOf(req));
  return success(res, { message: 'Pledge closed as partially fulfilled.', data });
});

// ---- Volunteer tasks -------------------------------------------------------

const listAvailableTasks = asyncHandler(async (req, res) => {
  const { tasks, needsBaseAddress, meta } = await taskService.listAvailable(req.user, req.query);
  return success(res, { message: 'Available relief tasks retrieved successfully.', data: { tasks, needsBaseAddress }, meta });
});
const listMyTasks = asyncHandler(async (req, res) => {
  const { tasks, meta } = await taskService.listMine(req.user, req.query);
  return success(res, { message: 'Your relief tasks retrieved successfully.', data: { tasks }, meta });
});
const getTask = asyncHandler(async (req, res) => {
  const data = await taskService.getTask(req.user, req.params.id);
  return success(res, { message: 'Relief task retrieved successfully.', data });
});
const acceptTask = asyncHandler(async (req, res) => {
  const data = await taskService.acceptTask(req.user, req.params.id, ctxOf(req));
  return success(res, { message: 'Task accepted.', data });
});
const scheduleTask = asyncHandler(async (req, res) => {
  const data = await taskService.scheduleTask(req.user, req.params.id, req.body, ctxOf(req));
  return success(res, { message: 'Pickup scheduled.', data });
});
const taskOnTheWay = asyncHandler(async (req, res) => {
  const data = await taskService.onTheWay(req.user, req.params.id, ctxOf(req));
  return success(res, { message: 'Marked as on the way.', data });
});
const reportPickup = asyncHandler(async (req, res) => {
  const data = await taskService.reportPickup(req.user, req.params.id, req.body, ctxOf(req));
  return success(res, { message: 'Pickup recorded.', data });
});
const reportDelivery = asyncHandler(async (req, res) => {
  const data = await taskService.reportDelivery(req.user, req.params.id, req.body, ctxOf(req));
  return success(res, { message: 'Delivery reported.', data });
});
const reportFailure = asyncHandler(async (req, res) => {
  const data = await taskService.reportFailure(req.user, req.params.id, req.body, ctxOf(req));
  return success(res, { message: 'Failed delivery reported to administrators.', data });
});
const reportProblem = asyncHandler(async (req, res) => {
  const data = await taskService.reportProblem(req.user, req.params.id, req.body, ctxOf(req));
  return success(res, { message: 'Problem reported to administrators.', data });
});
const releaseTask = asyncHandler(async (req, res) => {
  const data = await taskService.releaseTask(req.user, req.params.id, req.body, ctxOf(req));
  return success(res, { message: 'Task released.', data });
});
const getTimeline = asyncHandler(async (req, res) => {
  const data = await reviewService.getTimeline(req.user, req.params.id);
  return success(res, { message: 'Timeline retrieved successfully.', data });
});

// ---- Admin review ----------------------------------------------------------

const listReports = asyncHandler(async (req, res) => {
  const { reports, meta } = await reviewService.listReports(req.query);
  return success(res, { message: 'Reports retrieved successfully.', data: { reports }, meta });
});
const listAdminTasks = asyncHandler(async (req, res) => {
  const { tasks, meta } = await reviewService.listTasks(req.query);
  return success(res, { message: 'Relief tasks retrieved successfully.', data: { tasks }, meta });
});
const verifyReport = asyncHandler(async (req, res) => {
  const data = await reviewService.verifyDelivery(req.user, req.params.reportId, req.body, ctxOf(req));
  return success(res, { message: 'Delivery verified.', data });
});
const rejectReport = asyncHandler(async (req, res) => {
  const data = await reviewService.rejectDelivery(req.user, req.params.reportId, req.body, ctxOf(req));
  return success(res, { message: 'Delivery report rejected.', data });
});
const resolveReport = asyncHandler(async (req, res) => {
  const data = await reviewService.resolveReport(req.user, req.params.reportId, req.body, ctxOf(req));
  return success(res, { message: 'Report resolved.', data });
});

module.exports = {
  reportIncident, listIncidents, getIncident, updateIncident, changeIncidentStatus,
  createRequest, listRequests, getRequest, getRequestSummary, updateRequest, changeRequestStatus, listRequestPledges,
  addItem, updateItem, removeItem,
  createPledge, listMyPledges, getPledge, updatePledge, cancelPledge, recordCollection, recordDelivery, closePledgePartial,
  listAvailableTasks, listMyTasks, getTask, acceptTask, scheduleTask, taskOnTheWay, reportPickup, reportDelivery,
  reportFailure, reportProblem, releaseTask, getTimeline,
  listReports, listAdminTasks, verifyReport, rejectReport, resolveReport,
};
