const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { getClientIp, getUserAgent } = require('../utils/helpers');
const { HTTP_STATUS } = require('../constants');
const { canonicalDistrict } = require('../config/bdDistricts');
const { DIVISIONS } = require('../config/bdDivisions');
const read = require('../services/adminOps.service');
const actions = require('../services/adminOpsActions.service');
const reports = require('../services/adminOpsReports.service');

const ctxOf = (req) => ({ ipAddress: getClientIp(req), userAgent: getUserAgent(req) });

/** Only validated, whitelisted filter keys ever reach SQL (and always as bound parameters). */
function filtersOf(q) {
  const f = {};
  ['disasterType', 'status', 'severity', 'verificationStatus', 'requestStatus', 'from', 'to'].forEach((k) => { if (q[k]) f[k] = String(q[k]); });
  if (q.district) f.district = canonicalDistrict(q.district);
  if (q.division) f.division = Object.keys(DIVISIONS).find((d) => d.toLowerCase() === String(q.division).toLowerCase());
  if (q.incidentId) f.incidentId = Number(q.incidentId);
  return f;
}
const ok = (res, message, data, meta) => success(res, { message, data, ...(meta ? { meta } : {}) });

const dashboard = asyncHandler(async (req, res) => ok(res, 'Operations dashboard retrieved.', await read.getDashboard(filtersOf(req.query))));
const listIncidents = asyncHandler(async (req, res) => { const { incidents, meta } = await read.listIncidents(filtersOf(req.query), req.query); return ok(res, 'Incidents retrieved.', { incidents }, meta); });
const incidentDetail = asyncHandler(async (req, res) => ok(res, 'Incident operations detail retrieved.', await read.getIncidentDetail(req.params.id)));
const listRequests = asyncHandler(async (req, res) => { const { requests, meta } = await read.listRequests(filtersOf(req.query), req.query); return ok(res, 'Relief requests retrieved.', { requests }, meta); });
const listTasks = asyncHandler(async (req, res) => { const { tasks, view, meta } = await read.listTasks(filtersOf(req.query), req.query); return ok(res, 'Relief tasks retrieved.', { tasks, view }, meta); });
const listExceptions = asyncHandler(async (req, res) => { const { exceptions, meta } = await read.listExceptions(filtersOf(req.query), req.query); return ok(res, 'Delivery exceptions retrieved.', { exceptions }, meta); });
const listVolunteers = asyncHandler(async (req, res) => { const { volunteers, meta } = await actions.listVolunteers(req.query); return ok(res, 'Volunteers retrieved.', { volunteers }, meta); });
const quantityHistory = asyncHandler(async (req, res) => ok(res, 'Quantity history retrieved.', { history: await read.getRequestQuantityHistory(req.params.id) }));
const assignmentHistory = asyncHandler(async (req, res) => ok(res, 'Assignment history retrieved.', { history: await actions.getAssignmentHistory(req.params.pledgeId) }));
const reportsHandler = asyncHandler(async (req, res) => ok(res, 'Operations report generated.', await reports.getReports(filtersOf(req.query), { granularity: req.query.granularity })));

const exportCsv = asyncHandler(async (req, res) => {
  const { csv, truncated } = await reports.exportDataset(req.user, req.query.dataset, filtersOf(req.query), ctxOf(req));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="portionbridge-${req.query.dataset}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.setHeader('X-Export-Truncated', truncated ? 'true' : 'false');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(HTTP_STATUS.OK).send(csv);
});

const act = (fn, message, pick) => asyncHandler(async (req, res) => {
  const data = await fn(req);
  return ok(res, message, pick ? pick(data) : data);
});

module.exports = {
  dashboard, listIncidents, incidentDetail, listRequests, listTasks, listExceptions, listVolunteers, quantityHistory, assignmentHistory,
  reports: reportsHandler, exportCsv,
  requestInfo: act((req) => actions.requestIncidentInfo(req.user, req.params.id, req.body, ctxOf(req)), 'Information request sent.'),
  merge: act((req) => actions.mergeIncidents(req.user, req.params.id, req.body, ctxOf(req)), 'Incident merged. Its relief requests now belong to the surviving incident.'),
  reopen: act((req) => actions.reopenIncident(req.user, req.params.id, req.body, ctxOf(req)), 'Incident reopened.'),
  requestCorrection: act((req) => actions.requestRequestCorrection(req.user, req.params.id, req.body, ctxOf(req)), 'Correction request sent.'),
  flagReassessment: act((req) => actions.flagReassessment(req.user, req.params.id, req.body, ctxOf(req)), 'Request flagged for reassessment.'),
  clearReassessment: act((req) => actions.clearReassessment(req.user, req.params.id, req.body, ctxOf(req)), 'Reassessment flag cleared.'),
  assign: act((req) => actions.assignTask(req.user, req.params.pledgeId, req.body, ctxOf(req)), 'Volunteer assigned.'),
  reassign: act((req) => actions.reassignTask(req.user, req.params.pledgeId, req.body, ctxOf(req)), 'Task reassigned.'),
  release: act((req) => actions.releaseAssignedTask(req.user, req.params.pledgeId, req.body, ctxOf(req)), 'Task released to the available pool.'),
  cancelTask: act((req) => actions.cancelTask(req.user, req.params.pledgeId, req.body, ctxOf(req)), 'Task cancelled.'),
  correctDelivery: act((req) => actions.correctDelivery(req.user, req.params.reportId, req.body, ctxOf(req)), 'Delivery record corrected.'),
};
