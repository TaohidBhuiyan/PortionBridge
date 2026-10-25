const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { getClientIp, getUserAgent } = require('../utils/helpers');
const { HTTP_STATUS } = require('../constants');
const alertService = require('../services/disasterAlert.service');
const preferenceService = require('../services/alertPreference.service');

const ctxOf = (req) => ({ ipAddress: getClientIp(req), userAgent: getUserAgent(req) });

// ---- every signed-in user -----------------------------------------------------
const getPreferences = asyncHandler(async (req, res) => {
  const data = await preferenceService.getPreferences(req.user.id);
  return success(res, { message: 'Alert preferences retrieved successfully.', data });
});
const updatePreferences = asyncHandler(async (req, res) => {
  const data = await preferenceService.updatePreferences(req.user.id, req.body, ctxOf(req));
  return success(res, { message: 'Alert preferences saved.', data });
});
const listActive = asyncHandler(async (req, res) => {
  const alerts = await alertService.listActiveAlerts({ incidentId: req.query.incidentId ? Number(req.query.incidentId) : undefined });
  return success(res, { message: 'Active alerts retrieved successfully.', data: { alerts } });
});

// ---- admin only (also enforced by authorize('admin') on the routes) -------------
const preview = asyncHandler(async (req, res) => {
  const data = await alertService.previewAlert(req.body);
  return success(res, { message: 'Alert preview generated.', data });
});
const issue = asyncHandler(async (req, res) => {
  const alert = await alertService.issueAlert(req.user, req.body, ctxOf(req));
  return success(res, { statusCode: HTTP_STATUS.CREATED, message: 'Alert issued. Delivery to eligible users is in progress.', data: { alert } });
});
const list = asyncHandler(async (req, res) => {
  const { alerts, meta } = await alertService.listAlerts(req.query);
  return success(res, { message: 'Alerts retrieved successfully.', data: { alerts }, meta });
});
const get = asyncHandler(async (req, res) => {
  const alert = await alertService.getAlert(req.params.id);
  return success(res, { message: 'Alert retrieved successfully.', data: { alert } });
});
const update = asyncHandler(async (req, res) => {
  const alert = await alertService.updateAlert(req.params.id, req.user, req.body, ctxOf(req));
  return success(res, { message: 'Alert updated.', data: { alert } });
});
const correct = asyncHandler(async (req, res) => {
  const alert = await alertService.addCorrection(req.params.id, req.user, req.body, ctxOf(req));
  return success(res, { message: 'Correction notice queued.', data: { alert } });
});
const resolve = asyncHandler(async (req, res) => {
  const alert = await alertService.resolveAlert(req.params.id, req.user, req.body, ctxOf(req));
  return success(res, { message: 'Alert resolved. A resolution notice is being delivered.', data: { alert } });
});
const cancel = asyncHandler(async (req, res) => {
  const alert = await alertService.cancelAlert(req.params.id, req.user, req.body, ctxOf(req));
  return success(res, { message: 'Alert cancelled. A withdrawal notice is being delivered.', data: { alert } });
});
const retry = asyncHandler(async (req, res) => {
  const alert = await alertService.retryEvent(req.params.id, req.params.eventId, req.user, ctxOf(req));
  return success(res, { message: 'Delivery retry queued.', data: { alert } });
});

module.exports = { getPreferences, updatePreferences, listActive, preview, issue, list, get, update, correct, resolve, cancel, retry };
