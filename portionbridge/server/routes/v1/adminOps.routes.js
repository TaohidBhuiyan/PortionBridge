const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../../middleware/auth.middleware');
const validateRequest = require('../../middleware/validateRequest');
const { alertPublishLimiter } = require('../../middleware/rateLimiter');
const c = require('../../controllers/adminOps.controller');
const v = require('../../validators/adminOps.validator');

// ============================================================================
// ADMIN DISASTER OPERATIONS (Phase 5). Mounted at /api/v1/admin/ops.
// EVERY route requires a Bearer token AND the admin role (enforced here, server-side).
// The role system has a single admin role, so there is no finer-grained permission to
// enforce: any admin can use every operation, no donor/volunteer can use any.
// Incident verify/reject, request approve/reject and delivery verify/reject/resolve keep
// using the existing /api/v1/relief endpoints; this router adds what was missing.
// ============================================================================
router.use(protect, authorize('admin'));

// ---- read ----
router.get('/dashboard', v.filterRules, validateRequest, c.dashboard);
router.get('/incidents', v.listRules, validateRequest, c.listIncidents);
router.get('/incidents/:id', v.idRules, validateRequest, c.incidentDetail);
router.get('/requests', v.listRules, validateRequest, c.listRequests);
router.get('/requests/:id/quantity-history', v.idRules, validateRequest, c.quantityHistory);
router.get('/tasks', v.listRules, validateRequest, c.listTasks);
router.get('/tasks/:pledgeId/assignments', v.pledgeRules, validateRequest, c.assignmentHistory);
router.get('/exceptions', v.listRules, validateRequest, c.listExceptions);
router.get('/volunteers', v.listRules, validateRequest, c.listVolunteers);
router.get('/reports', v.reportRules, validateRequest, c.reports);
router.get('/export', v.exportRules, validateRequest, c.exportCsv);

// ---- incident management ----
router.post('/incidents/:id/request-info', v.infoRules, validateRequest, c.requestInfo);
router.post('/incidents/:id/merge', alertPublishLimiter, v.mergeRules, validateRequest, c.merge);
router.post('/incidents/:id/reopen', v.reasonRules, validateRequest, c.reopen);

// ---- relief request review ----
router.post('/requests/:id/request-correction', v.noteRules, validateRequest, c.requestCorrection);
router.post('/requests/:id/reassessment', v.reasonRules, validateRequest, c.flagReassessment);
router.delete('/requests/:id/reassessment', v.optionalNoteRules, validateRequest, c.clearReassessment);

// ---- volunteer coordination ----
router.post('/tasks/:pledgeId/assign', v.assignRules, validateRequest, c.assign);
router.post('/tasks/:pledgeId/reassign', v.assignRules, validateRequest, c.reassign);
router.post('/tasks/:pledgeId/release', v.pledgeReasonRules, validateRequest, c.release);
router.post('/tasks/:pledgeId/cancel', v.pledgeReasonRules, validateRequest, c.cancelTask);

// ---- delivery exceptions ----
router.post('/deliveries/:reportId/correct', v.correctRules, validateRequest, c.correctDelivery);

module.exports = router;
