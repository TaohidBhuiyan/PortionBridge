const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../../middleware/auth.middleware');
const { optionalAuth } = require('../../middleware/optionalAuth.middleware');
const validateRequest = require('../../middleware/validateRequest');
const { incidentReportLimiter } = require('../../middleware/rateLimiter');
const c = require('../../controllers/disasterRelief.controller');
const v = require('../../validators/relief.validator');

// ============================================================================
// DISASTER RESPONSE & RELIEF (Phase 1 — backend foundation)
// Mounted at /api/v1/relief. Reads of verified data are public (optionalAuth);
// every write requires a Bearer token (so CSRF-immune like the rest of the API).
// ============================================================================

// ---- Incidents -------------------------------------------------------------
// Any signed-in user can REPORT. Reports start as 'reported' and only an admin can verify.
router.post('/incidents', protect, incidentReportLimiter, v.createIncidentRules, validateRequest, c.reportIncident);
router.get('/incidents', optionalAuth, v.listIncidentRules, validateRequest, c.listIncidents);
router.get('/incidents/:id', optionalAuth, v.idRules, validateRequest, c.getIncident);
// admin, or the reporter while still 'reported' (enforced in the service)
router.patch('/incidents/:id', protect, v.updateIncidentRules, validateRequest, c.updateIncident);
router.patch('/incidents/:id/status', protect, authorize('admin'), v.incidentStatusRules, validateRequest, c.changeIncidentStatus);

// ---- Relief requests -------------------------------------------------------
router.post('/incidents/:incidentId/requests', protect, authorize('admin', 'volunteer'), v.createRequestRules, validateRequest, c.createRequest);
router.get('/incidents/:incidentId/requests', optionalAuth, v.incidentIdRules, v.listRequestRules, validateRequest, c.listRequests);
router.get('/requests', optionalAuth, v.listRequestRules, validateRequest, c.listRequests);
router.get('/requests/:id', optionalAuth, v.idRules, validateRequest, c.getRequest);
router.get('/requests/:id/summary', optionalAuth, v.idRules, validateRequest, c.getRequestSummary);
router.patch('/requests/:id', protect, authorize('admin', 'volunteer'), v.updateRequestRules, validateRequest, c.updateRequest);
router.patch('/requests/:id/status', protect, authorize('admin'), v.requestStatusRules, validateRequest, c.changeRequestStatus);
router.get('/requests/:id/pledges', protect, authorize('admin'), v.idRules, v.pagination, validateRequest, c.listRequestPledges);

// ---- Request items ---------------------------------------------------------
router.post('/requests/:id/items', protect, authorize('admin', 'volunteer'), v.addItemRules, validateRequest, c.addItem);
router.patch('/requests/:id/items/:itemId', protect, authorize('admin', 'volunteer'), v.updateItemRules, validateRequest, c.updateItem);
router.delete('/requests/:id/items/:itemId', protect, authorize('admin', 'volunteer'), v.removeItemRules, validateRequest, c.removeItem);

// ---- Pledges ---------------------------------------------------------------
router.post('/items/:itemId/pledges', protect, authorize('donor'), v.createPledgeRules, validateRequest, c.createPledge);
router.get('/pledges/mine', protect, authorize('donor'), v.listPledgeRules, validateRequest, c.listMyPledges);
router.get('/pledges/:id', protect, v.pledgeIdRules, validateRequest, c.getPledge);
router.patch('/pledges/:id', protect, authorize('donor'), v.updatePledgeRules, validateRequest, c.updatePledge);
router.post('/pledges/:id/cancel', protect, authorize('donor', 'admin'), v.cancelPledgeRules, validateRequest, c.cancelPledge);
// Direct quantity entry is an ADMIN override for pledges WITHOUT a pickup task. Volunteers report through /tasks/* and admins verify.
router.post('/pledges/:id/collection', protect, authorize('admin'), v.quantityActionRules, validateRequest, c.recordCollection);
router.post('/pledges/:id/delivery', protect, authorize('admin'), v.quantityActionRules, validateRequest, c.recordDelivery);
router.post('/pledges/:id/close-partial', protect, authorize('admin'), v.pledgeIdRules, validateRequest, c.closePledgePartial);

router.get('/pledges/:id/timeline', protect, v.pledgeIdRules, validateRequest, c.getTimeline);

// ---- Volunteer relief tasks (pickup & delivery coordination) ---------------
// Static paths first so they are not captured by /tasks/:id.
router.get('/tasks/available', protect, authorize('volunteer'), v.listTaskRules, validateRequest, c.listAvailableTasks);
router.get('/tasks/mine', protect, authorize('volunteer'), v.listTaskRules, validateRequest, c.listMyTasks);
// assigned volunteer (full details) / any volunteer for an unaccepted task (limited) / admin — enforced in the service
router.get('/tasks/:id', protect, authorize('volunteer', 'admin'), v.taskIdRules, validateRequest, c.getTask);
router.post('/tasks/:id/accept', protect, authorize('volunteer'), v.taskIdRules, validateRequest, c.acceptTask);
router.post('/tasks/:id/schedule', protect, authorize('volunteer'), v.scheduleTaskRules, validateRequest, c.scheduleTask);
router.post('/tasks/:id/on-the-way', protect, authorize('volunteer'), v.taskIdRules, validateRequest, c.taskOnTheWay);
router.post('/tasks/:id/pickup', protect, authorize('volunteer'), v.pickupReportRules, validateRequest, c.reportPickup);
router.post('/tasks/:id/delivery', protect, authorize('volunteer'), v.deliveryReportRules, validateRequest, c.reportDelivery);
router.post('/tasks/:id/failure', protect, authorize('volunteer'), v.issueReportRules, validateRequest, c.reportFailure);
router.post('/tasks/:id/problem', protect, authorize('volunteer'), v.issueReportRules, validateRequest, c.reportProblem);
router.post('/tasks/:id/release', protect, authorize('volunteer', 'admin'), v.releaseTaskRules, validateRequest, c.releaseTask);

// ---- Admin review & verification (admin only) -------------------------------
router.get('/admin/reports', protect, authorize('admin'), v.listReportRules, validateRequest, c.listReports);
router.get('/admin/tasks', protect, authorize('admin'), v.adminTaskListRules, validateRequest, c.listAdminTasks);
router.post('/admin/reports/:reportId/verify', protect, authorize('admin'), v.verifyReportRules, validateRequest, c.verifyReport);
router.post('/admin/reports/:reportId/reject', protect, authorize('admin'), v.rejectReportRules, validateRequest, c.rejectReport);
router.post('/admin/reports/:reportId/resolve', protect, authorize('admin'), v.resolveReportRules, validateRequest, c.resolveReport);

module.exports = router;
