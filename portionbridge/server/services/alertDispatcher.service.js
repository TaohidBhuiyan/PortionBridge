const { pool } = require('../config/db');
const alertModel = require('../models/disasterAlert.model');
const audienceModel = require('../models/alertAudience.model');
const notificationModel = require('../models/notification.model');
const reliefRequestModel = require('../models/reliefRequest.model');
const reliefItemModel = require('../models/reliefRequestItem.model');
const notificationService = require('./notification.service');
const alertConfig = require('../config/alerts');
const { serializeItem } = require('../utils/reliefSerializers');
const { buildAlertContent } = require('../utils/alertContent');
const { NOTIFICATION_TYPES } = require('../constants');

/**
 * Alert delivery worker (the consumer side of the outbox in disaster_alert_events).
 *
 * Reliability model
 *  - An event row is written in the SAME transaction as the change that caused it, so a
 *    crash can never lose a critical event: the worst case is a 'pending' row the sweeper
 *    picks up later.
 *  - processEvent() first CLAIMS the row with one atomic UPDATE; only one worker/process wins.
 *  - Notifications are inserted with INSERT IGNORE against UNIQUE (user_id, alert_event_id),
 *    so re-running a half-finished event only adds the users still missing (no duplicates).
 *  - A thrown error marks the event 'failed' (kept, with the error) and the sweeper retries
 *    it up to ALERT_MAX_ATTEMPTS; after that an admin can retry it from the alert page.
 *  - The database is the source of truth. The Socket.io push happens AFTER the rows exist,
 *    goes only to the recipient's own sockets, and a failed push never fails the event.
 *  - Only the in-app channel exists. No SMS / email / push is sent, and nothing here claims so.
 */

const PAGE_SIZE = 500;
const inFlight = new Set();

/** Resolves the content + audience context for an event from LIVE records. */
async function loadContext(event) {
  const alert = await alertModel.findAlertById(event.alert_id);
  if (!alert) return null;
  const districts = await alertModel.getDistricts(alert.id);
  const incident = {
    id: alert.incident_id, title: alert.incident_title, disaster_type: alert.incident_type,
    district: alert.incident_district, affected_area: alert.incident_affected_area, status: alert.incident_status,
    severity: alert.incident_severity, verification_status: alert.incident_verification_status,
    latitude: alert.incident_latitude, longitude: alert.incident_longitude,
  };

  let request = null;
  let items = [];
  if (event.relief_request_id) {
    request = await reliefRequestModel.findById(event.relief_request_id);
    if (request) items = (await reliefItemModel.findWithTotalsByRequestIds([request.id])).map(serializeItem);
  }
  const [[{ approvedCount }]] = await pool.query(
    "SELECT COUNT(*) AS approvedCount FROM relief_requests WHERE incident_id = :id AND status = 'approved'", { id: alert.incident_id }
  );
  return { alert, districts, incident, request, items, approvedRequestCount: Number(approvedCount) };
}

/** Pushes freshly stored rows to each recipient's OWN sockets (never a shared room). */
async function pushRows(rows) {
  if (!rows.length) return;
  try {
    const ids = rows.map((r) => r.user_id);
    const params = {};
    const names = ids.map((id, i) => { params[`u${i}`] = id; return `:u${i}`; });
    const [counts] = await pool.query(
      `SELECT user_id, COUNT(*) AS total FROM notifications WHERE is_read = 0 AND user_id IN (${names.join(', ')}) GROUP BY user_id`, params
    );
    const unread = new Map(counts.map((c) => [c.user_id, Number(c.total)]));
    rows.forEach((row) => {
      notificationService.emitToUser(row.user_id, 'notification', row);
      notificationService.emitToUser(row.user_id, 'notification_count_updated', { unreadCount: unread.get(row.user_id) || 0 });
    });
  } catch (err) {
    console.error('[Alerts] Realtime push failed (notifications are stored):', err.message);
  }
}

/**
 * Processes one event. Safe to call repeatedly and concurrently.
 * @returns {Promise<{status: string, recipientCount?: number, reason?: string}>}
 */
async function processEvent(eventId) {
  const claimed = await alertModel.claimEvent(eventId, {
    maxAttempts: alertConfig.maxAttempts(),
    staleSeconds: alertConfig.staleClaimSeconds(),
  });
  if (!claimed) return { status: 'skipped', reason: 'not_claimable' };

  try {
    const event = await alertModel.findEventById(eventId);
    const ctx = await loadContext(event);
    if (!ctx) throw new Error('Alert not found for event.');

    // Guards that keep an unverified or withdrawn alert from ever being delivered.
    const isFollowUp = ['cancelled', 'resolved', 'correction'].includes(event.event_type);
    if (ctx.incident.verification_status !== 'verified') {
      await alertModel.completeEvent(eventId, { recipientCount: 0, skipReason: 'incident_not_verified' });
      return { status: 'completed', recipientCount: 0, reason: 'incident_not_verified' };
    }
    if (ctx.alert.status === 'cancelled' && event.event_type !== 'cancelled') {
      await alertModel.completeEvent(eventId, { recipientCount: 0, skipReason: 'alert_cancelled_before_delivery' });
      return { status: 'completed', recipientCount: 0, reason: 'alert_cancelled_before_delivery' };
    }
    if (!isFollowUp && ctx.alert.status !== 'active') {
      await alertModel.completeEvent(eventId, { recipientCount: 0, skipReason: 'alert_not_active' });
      return { status: 'completed', recipientCount: 0, reason: 'alert_not_active' };
    }

    const { title, message } = buildAlertContent({ event, ...ctx });
    const audienceCtx = { alert: { ...ctx.alert, severity: event.severity, scope: event.scope }, incident: ctx.incident, districts: ctx.districts, eventType: event.event_type };

    let afterId = 0;
    for (;;) {
      const userIds = await audienceModel.findRecipientPage(audienceCtx, { afterId, pageSize: PAGE_SIZE });
      if (userIds.length === 0) break;
      const created = await notificationModel.insertAlertBatch(userIds, {
        type: NOTIFICATION_TYPES.DISASTER_ALERT, title, message, relatedId: ctx.incident.id, incidentId: ctx.incident.id,
        reliefRequestId: event.relief_request_id, alertEventId: eventId, severity: event.severity,
      });
      await pushRows(created);
      afterId = userIds[userIds.length - 1];
      if (userIds.length < PAGE_SIZE) break;
    }

    const recipientCount = await notificationModel.countForAlertEvent(eventId);
    await alertModel.completeEvent(eventId, { title, message, recipientCount });
    return { status: 'completed', recipientCount };
  } catch (err) {
    console.error(`[Alerts] Event ${eventId} failed:`, err.message);
    await alertModel.failEvent(eventId, err.message).catch(() => {});
    return { status: 'failed', reason: err.message };
  }
}

/**
 * Fire-and-forget dispatch right after the transaction that created the event(s) commits.
 * The sweeper is the safety net if this process dies before it runs.
 */
function dispatchSoon(eventIds) {
  const ids = (Array.isArray(eventIds) ? eventIds : [eventIds]).filter(Boolean);
  ids.forEach((id) => {
    const p = new Promise((resolve) => setImmediate(resolve))
      .then(() => processEvent(id))
      .catch((err) => console.error('[Alerts] dispatch error:', err.message))
      .finally(() => inFlight.delete(p));
    inFlight.add(p);
  });
}

/** Waits for every dispatch started in this process (used by tests and graceful shutdown). */
async function drain() {
  while (inFlight.size) await Promise.allSettled([...inFlight]);
}

/** One sweep: process everything pending, stale-claimed or failed-under-cap. */
async function sweep() {
  const ids = await alertModel.findRunnableEventIds({
    maxAttempts: alertConfig.maxAttempts(), staleSeconds: alertConfig.staleClaimSeconds(),
  });
  const results = [];
  for (const id of ids) results.push({ id, ...(await processEvent(id)) });
  return results;
}

let timer = null;
function startSweeper() {
  const interval = alertConfig.sweepIntervalMs();
  if (timer || interval <= 0) return;
  timer = setInterval(() => { sweep().catch((err) => console.error('[Alerts] sweep error:', err.message)); }, interval);
  if (timer.unref) timer.unref();
}
function stopSweeper() { if (timer) { clearInterval(timer); timer = null; } }

module.exports = { processEvent, dispatchSoon, drain, sweep, startSweeper, stopSweeper };
