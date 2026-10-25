const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../../middleware/auth.middleware');
const validateRequest = require('../../middleware/validateRequest');
const { alertPublishLimiter } = require('../../middleware/rateLimiter');
const c = require('../../controllers/disasterAlert.controller');
const v = require('../../validators/alert.validator');

// ============================================================================
// DISASTER ALERTS (Phase 4). Mounted at /api/v1/alerts. Every route requires a
// Bearer token. Publishing / escalating / cancelling / broadcasting is ADMIN-ONLY and
// enforced here on the backend; the client never decides what is verified or critical.
// ============================================================================

// ---- any signed-in user ----------------------------------------------------
router.get('/preferences', protect, c.getPreferences);
router.put('/preferences', protect, v.preferenceRules, validateRequest, c.updatePreferences);
router.get('/active', protect, v.activeRules, validateRequest, c.listActive);

// ---- admin only --------------------------------------------------------------
router.post('/preview', protect, authorize('admin'), v.previewRules, validateRequest, c.preview);
router.get('/', protect, authorize('admin'), v.listRules, validateRequest, c.list);
router.post('/', protect, authorize('admin'), alertPublishLimiter, v.issueRules, validateRequest, c.issue);
router.get('/:id', protect, authorize('admin'), v.idRules, validateRequest, c.get);
router.patch('/:id', protect, authorize('admin'), alertPublishLimiter, v.updateRules, validateRequest, c.update);
router.post('/:id/correction', protect, authorize('admin'), alertPublishLimiter, v.correctionRules, validateRequest, c.correct);
router.post('/:id/resolve', protect, authorize('admin'), v.resolveRules, validateRequest, c.resolve);
router.post('/:id/cancel', protect, authorize('admin'), v.cancelRules, validateRequest, c.cancel);
router.post('/:id/events/:eventId/retry', protect, authorize('admin'), v.retryRules, validateRequest, c.retry);

module.exports = router;
