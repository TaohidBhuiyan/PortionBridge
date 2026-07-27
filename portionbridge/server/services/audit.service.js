const auditLogModel = require('../models/auditLog.model');

/**
 * Thin wrapper around the audit_logs data-access layer.
 * Audit logging failures must never break the primary auth flow, so every
 * call here swallows its own errors (logged to console) rather than
 * propagating and failing the parent request.
 */
async function record({ userId = null, action, ipAddress = null, userAgent = null, metadata = null }) {
  try {
    await auditLogModel.logEvent({ userId, action, ipAddress, userAgent, metadata });
  } catch (err) {
    console.error('[Audit] Failed to record audit log event:', action, err.message);
  }
}

module.exports = { record };
