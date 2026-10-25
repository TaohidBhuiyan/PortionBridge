const notificationService = require('./notification.service');
const { NOTIFICATION_TYPES } = require('../constants');

/**
 * In-app notification for a relief event, delivered through the existing
 * notification service (database row first, then Socket.io push). The database
 * stays the source of truth: a failed push or insert is logged and never fails
 * the business operation that already committed.
 * `relatedId` is the linked donation id, matching how existing donation
 * notifications are keyed. Optional `incidentId` / `reliefRequestId` / `reliefPledgeId`
 * let the inbox deep-link to the incident, request or pledge/task instead.
 */
async function notifyRelief(userId, { title, message, relatedId = null, incidentId = null, reliefRequestId = null, reliefPledgeId = null }) {
  if (!userId) return;
  try {
    await notificationService.createNotification(userId, {
      type: NOTIFICATION_TYPES.STATUS_UPDATED,
      title,
      message,
      relatedId,
      incidentId,
      reliefRequestId,
      reliefPledgeId,
    });
  } catch (err) {
    console.error('Relief notification failed:', err.message);
  }
}

module.exports = { notifyRelief };
