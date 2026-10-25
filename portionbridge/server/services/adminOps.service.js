const { pool } = require('../config/db');
const ops = require('../models/adminOps.model');
const alertModel = require('../models/disasterAlert.model');
const AppError = require('../utils/AppError');
const auditService = require('./audit.service');
const { divisionOf, DIVISIONS } = require('../config/bdDivisions');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { milliToNumber, dbToMilli, buildQuantitySummary } = require('../utils/reliefQuantity');
const { serializeItem } = require('../utils/reliefSerializers');
const reliefItemModel = require('../models/reliefRequestItem.model');
const { HTTP_STATUS, AUDIT_ACTIONS } = require('../constants');

const num = (v) => Number(v ?? 0);
const qty = (v) => milliToNumber(dbToMilli(v));

function serializeQuantityRow(r) {
  const requested = qty(r.requested);
  const verifiedDelivered = qty(r.verified_delivered);
  return {
    key: r.item_key, name: r.item_name, category: r.item_category, unit: r.unit,
    ...(r.incident_id ? { incidentId: r.incident_id, incidentTitle: r.incident_title } : {}),
    requested, pledged: qty(r.pledged), collected: qty(r.collected), verifiedDelivered,
    pendingVerification: qty(r.pending_verification),
    remainingUnfulfilled: Math.max(0, Math.round((requested - verifiedDelivered) * 1000) / 1000),
  };
}

const LIMITATIONS = [
  'Upazila is not stored on incidents, requests or users, so upazila filtering and grouping are not available; district and division (derived from the district) are.',
  'Quantities are grouped by item and unit; different units (e.g. kg vs packet) are never added together.',
];

// ---- dashboard ----------------------------------------------------------------

async function getDashboard(filters) {
  const [incidents, requests, quantities, tasks, disputed, recentInc, recentReq, alerts] = await Promise.all([
    ops.incidentCounts(filters), ops.requestCounts(filters), ops.quantityRollup(filters), ops.taskCounts(filters),
    ops.disputedCounts(filters), ops.recentIncidents(filters), ops.recentRequests(filters), ops.alertHealth(),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    filters,
    summary: {
      incidents: {
        totalReported: num(incidents.total), awaitingVerification: num(incidents.awaiting_verification),
        verifiedActive: num(incidents.verified_active), criticalOrHigh: num(incidents.critical_high),
        resolved: num(incidents.resolved), rejected: num(incidents.rejected),
      },
      requests: {
        total: num(requests.total), awaitingReview: num(requests.pending_review), approved: num(requests.approved),
        approvedUnfulfilled: num(requests.approved_unfulfilled), needsReassessment: num(requests.needs_reassessment),
        awaitingCorrection: num(requests.awaiting_correction),
      },
      tasks: {
        active: tasks.active, unassigned: tasks.unassigned, delayed: tasks.delayed, failed: tasks.failed,
        needingAttention: tasks.attention, delayThresholdHours: ops.DELAY_HOURS(),
      },
      deliveryIssues: {
        openIssues: num(disputed.open_issues), pendingVerification: num(disputed.pending_verification),
        discrepancies: num(disputed.discrepancies), failedTasks: tasks.failed,
      },
    },
    quantities: quantities.map(serializeQuantityRow),
    recentIncidents: recentInc.map((r) => ({
      id: r.id, title: r.title, disasterType: r.disaster_type, severity: r.severity, status: r.status,
      verificationStatus: r.verification_status, district: r.district, division: divisionOf(r.district), updatedAt: r.updated_at,
    })),
    recentRequests: recentReq.map((r) => ({
      id: r.id, title: r.title, status: r.status, priority: r.priority, incidentId: r.incident_id, incidentTitle: r.incident_title, updatedAt: r.updated_at,
    })),
    alerts: {
      active: num(alerts.active_alerts), activeNationwide: num(alerts.active_nationwide), failedEvents: num(alerts.failed_events),
      pendingEvents: num(alerts.pending_events), stuckEvents: num(alerts.stuck_events),
      failed: alerts.failed.map((e) => ({ id: e.id, alertId: e.alert_id, type: e.event_type, attempts: e.attempts, error: e.last_error, createdAt: e.created_at })),
    },
    limitations: LIMITATIONS,
  };
}

// ---- lists ----------------------------------------------------------------------

async function listIncidents(filters, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const w = ops.incidentWhere(filters);
  const QUEUES = {
    awaiting: "di.status IN ('reported', 'under_review')",
    open: "di.status IN ('verified', 'active')",
    critical: "di.severity IN ('high', 'critical') AND di.status IN ('reported', 'under_review', 'verified', 'active')",
  };
  if (QUEUES[query.queue]) w.sql += ` AND ${QUEUES[query.queue]}`;
  const [rows] = await pool.query(
    `SELECT di.id, di.title, di.disaster_type, di.severity, di.priority, di.status, di.verification_status, di.district,
            di.source_type, di.created_at, di.updated_at, di.merged_into_id, di.info_requested_at, rep.name AS reporter_name,
            (SELECT COUNT(*) FROM relief_requests r WHERE r.incident_id = di.id) AS request_count,
            (SELECT COUNT(*) FROM relief_requests r WHERE r.incident_id = di.id AND r.status = 'pending_review') AS pending_requests,
            (SELECT COUNT(*) FROM relief_pledge_reports rp JOIN relief_pledges p ON p.id = rp.pledge_id
               JOIN relief_request_items i ON i.id = p.relief_request_item_id JOIN relief_requests r ON r.id = i.relief_request_id
              WHERE r.incident_id = di.id AND rp.status IN ('open', 'pending')) AS open_issues,
            (SELECT COUNT(*) FROM disaster_alerts a WHERE a.incident_id = di.id AND a.status = 'active') AS live_alerts
       FROM disaster_incidents di LEFT JOIN users rep ON rep.id = di.reported_by
      WHERE ${w.sql}
      ORDER BY (di.status IN ('reported', 'under_review')) DESC, di.updated_at DESC, di.id DESC
      LIMIT :limit OFFSET :offset`, { ...w.params, limit, offset }
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM disaster_incidents di WHERE ${w.sql}`, w.params);
  return {
    incidents: rows.map((r) => ({
      id: r.id, title: r.title, disasterType: r.disaster_type, severity: r.severity, priority: r.priority, status: r.status,
      verificationStatus: r.verification_status, district: r.district, division: divisionOf(r.district), sourceType: r.source_type,
      reporterName: r.reporter_name || null, createdAt: r.created_at, updatedAt: r.updated_at, mergedIntoId: r.merged_into_id,
      infoRequestedAt: r.info_requested_at, requestCount: num(r.request_count), pendingRequests: num(r.pending_requests),
      openIssues: num(r.open_issues), liveAlerts: num(r.live_alerts),
    })),
    meta: buildPaginationMeta({ page, limit, totalItems: Number(total) }),
  };
}

function reassessmentReasons(r) {
  const reasons = [];
  if (r.reassessment_flagged_at) reasons.push({ code: 'flagged', text: r.reassessment_reason || 'Flagged by an administrator' });
  if (r.status === 'approved' && ['resolved', 'rejected', 'merged'].includes(r.incident_status)) reasons.push({ code: 'incident_closed', text: `The incident is now ${r.incident_status}` });
  if (r.status === 'approved' && r.expires_at && new Date(r.expires_at) < new Date()) reasons.push({ code: 'expired', text: 'The request is past its expiry date' });
  return reasons;
}

async function listRequests(filters, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const w = ops.incidentWhere(filters);
  const r = ops.requestStatusWhere(filters);
  const extra = [];
  if (query.needsReassessment === 'true') extra.push(`AND ${ops.REASSESS_SQL}`);
  if (query.unfulfilled === 'true') extra.push(`AND rr.status = 'approved' AND ${ops.UNFULFILLED_ITEM_EXISTS}`);
  if (query.fulfillment === 'open') extra.push('AND COALESCE(t.delivered_items, 0) = 0');
  if (query.fulfillment === 'partial') extra.push('AND COALESCE(t.delivered_items, 0) > 0 AND COALESCE(t.fulfilled_items, 0) < COALESCE(t.total_items, 0)');
  if (query.fulfillment === 'fulfilled') extra.push('AND COALESCE(t.total_items, 0) > 0 AND t.fulfilled_items = t.total_items');
  const from = `FROM relief_requests rr
      JOIN disaster_incidents di ON di.id = rr.incident_id
      LEFT JOIN users req ON req.id = rr.requested_by
      LEFT JOIN (
        SELECT x.rid, COUNT(*) AS total_items, SUM(x.delivered >= x.requested) AS fulfilled_items, SUM(x.delivered > 0) AS delivered_items
          FROM (SELECT i.relief_request_id AS rid, i.quantity_requested AS requested,
                       COALESCE((SELECT SUM(p.quantity_delivered) FROM relief_pledges p WHERE p.relief_request_item_id = i.id AND p.status NOT IN ('cancelled', 'failed')), 0) AS delivered
                  FROM relief_request_items i WHERE i.status = 'active') x GROUP BY x.rid
      ) t ON t.rid = rr.id
     WHERE ${w.sql}${r.sql} ${extra.join(' ')}`;
  const params = { ...w.params, ...r.params };
  const [rows] = await pool.query(
    `SELECT rr.id, rr.title, rr.status, rr.priority, rr.location_name, rr.approved_at, rr.expires_at, rr.created_at, rr.updated_at,
            rr.requesting_organization, rr.reassessment_flagged_at, rr.reassessment_reason, rr.correction_requested_at, rr.correction_note,
            di.id AS incident_id, di.title AS incident_title, di.district, di.status AS incident_status, req.name AS requester_name,
            COALESCE(t.total_items, 0) AS total_items, COALESCE(t.fulfilled_items, 0) AS fulfilled_items, COALESCE(t.delivered_items, 0) AS delivered_items
       ${from} ORDER BY (rr.status = 'pending_review') DESC, rr.updated_at DESC, rr.id DESC LIMIT :limit OFFSET :offset`, { ...params, limit, offset }
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${from}`, params);
  return {
    requests: rows.map((x) => {
      let fulfillmentState = 'open';
      if (x.status === 'cancelled') fulfillmentState = 'cancelled';
      else if (num(x.total_items) > 0 && num(x.fulfilled_items) === num(x.total_items)) fulfillmentState = 'fulfilled';
      else if (num(x.delivered_items) > 0) fulfillmentState = 'partially_fulfilled';
      return {
        id: x.id, title: x.title, status: x.status, priority: x.priority, locationName: x.location_name,
        organization: x.requesting_organization, requesterName: x.requester_name || null, approvedAt: x.approved_at, expiresAt: x.expires_at,
        createdAt: x.created_at, updatedAt: x.updated_at, incidentId: x.incident_id, incidentTitle: x.incident_title,
        district: x.district, incidentStatus: x.incident_status, totalItems: num(x.total_items), fulfilledItems: num(x.fulfilled_items),
        fulfillmentState, correctionRequestedAt: x.correction_requested_at, correctionNote: x.correction_note,
        reassessment: reassessmentReasons(x),
      };
    }),
    meta: buildPaginationMeta({ page, limit, totalItems: Number(total) }),
  };
}

const TASK_VIEWS = Object.keys(ops.TASK_VIEWS);

async function listTasks(filters, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const view = TASK_VIEWS.includes(query.view) ? query.view : 'all';
  const w = ops.incidentWhere(filters);
  const r = ops.requestStatusWhere(filters);
  const where = `${w.sql}${r.sql} AND (${ops.TASK_VIEWS[view]})`;
  const params = { ...w.params, ...r.params, delayHours: ops.DELAY_HOURS() };
  const [rows] = await pool.query(
    `SELECT p.id AS pledge_id, p.status AS pledge_status, p.quantity_pledged, p.quantity_collected, p.quantity_delivered,
            p.quantity_pending_verification, p.created_at AS pledged_at, i.item_name, i.unit,
            rr.id AS request_id, rr.title AS request_title, rr.status AS request_status, di.id AS incident_id, di.title AS incident_title, di.district,
            d.id AS donation_id, d.status AS donation_status, d.assignment_mode, COALESCE(d.assigned_member_id, d.volunteer_id) AS volunteer_id, vu.name AS volunteer_name,
            TIMESTAMPDIFF(HOUR, COALESCE(${ops.LAST_CHANGE}, d.updated_at, p.created_at), NOW()) AS hours_since_change,
            (SELECT COUNT(*) FROM relief_pledge_reports r2 WHERE r2.pledge_id = p.id AND r2.status IN ('open', 'pending')) AS open_reports
       ${ops.TASK_BASE_FROM} WHERE ${where}
      ORDER BY open_reports DESC, hours_since_change DESC, p.id DESC LIMIT :limit OFFSET :offset`, { ...params, limit, offset }
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${ops.TASK_BASE_FROM} WHERE ${where}`, params);
  return {
    view,
    tasks: rows.map((t) => ({
      pledgeId: t.pledge_id, pledgeStatus: t.pledge_status, itemName: t.item_name, unit: t.unit,
      quantities: { pledged: qty(t.quantity_pledged), collected: qty(t.quantity_collected), verifiedDelivered: qty(t.quantity_delivered), pendingVerification: qty(t.quantity_pending_verification) },
      requestId: t.request_id, requestTitle: t.request_title, requestStatus: t.request_status, incidentId: t.incident_id, incidentTitle: t.incident_title,
      district: t.district, donationId: t.donation_id, taskStatus: t.donation_status || null, assignmentMode: t.assignment_mode || null,
      volunteerId: t.volunteer_id || null, volunteerName: t.volunteer_name || null, openReports: num(t.open_reports),
      hoursSinceChange: t.hours_since_change === null ? null : num(t.hours_since_change), pledgedAt: t.pledged_at,
      unassigned: t.pledge_status === 'pledged' && t.donation_status === 'pending',
      delayed: ['pledged', 'collected'].includes(t.pledge_status) && num(t.hours_since_change) >= ops.DELAY_HOURS() && (t.donation_status !== null),
    })),
    meta: buildPaginationMeta({ page, limit, totalItems: Number(total) }),
  };
}

const EXCEPTION_TYPES = {
  open_issue: "rp.status = 'open'",
  pending_verification: "rp.report_type = 'delivery' AND rp.status = 'pending'",
  discrepancy: "rp.report_type = 'delivery' AND rp.status = 'verified' AND rp.verified_quantity < rp.quantity",
};

async function listExceptions(filters, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const w = ops.incidentWhere(filters);
  const r = ops.requestStatusWhere(filters);
  const typeSql = EXCEPTION_TYPES[query.type] || `(${Object.values(EXCEPTION_TYPES).map((x) => `(${x})`).join(' OR ')})`;
  const from = `FROM relief_pledge_reports rp
      JOIN relief_pledges p ON p.id = rp.pledge_id
      JOIN relief_request_items i ON i.id = p.relief_request_item_id
      JOIN relief_requests rr ON rr.id = i.relief_request_id
      JOIN disaster_incidents di ON di.id = rr.incident_id
      LEFT JOIN users ru ON ru.id = rp.reporter_id
     WHERE ${w.sql}${r.sql} AND (${typeSql})`;
  const [rows] = await pool.query(
    `SELECT rp.id AS report_id, rp.report_type, rp.status, rp.quantity, rp.verified_quantity, rp.is_final, rp.notes, rp.review_notes, rp.created_at, rp.reviewed_at,
            ru.name AS reporter_name, p.id AS pledge_id, p.status AS pledge_status, p.quantity_pledged, p.quantity_delivered, i.item_name, i.unit,
            rr.id AS request_id, rr.title AS request_title, di.id AS incident_id, di.title AS incident_title, di.district,
            (SELECT COUNT(*) FROM relief_delivery_corrections c WHERE c.report_id = rp.id) AS corrections
       ${from} ORDER BY (rp.status IN ('open', 'pending')) DESC, rp.created_at DESC, rp.id DESC LIMIT :limit OFFSET :offset`,
    { ...w.params, ...r.params, limit, offset }
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${from}`, { ...w.params, ...r.params });
  return {
    exceptions: rows.map((x) => {
      let kind = 'open_issue';
      if (x.report_type === 'delivery' && x.status === 'pending') kind = 'pending_verification';
      else if (x.report_type === 'delivery' && x.status === 'verified') kind = 'discrepancy';
      return {
        kind, reportId: x.report_id, reportType: x.report_type, status: x.status, isFinal: Boolean(x.is_final),
        reportedQuantity: x.quantity === null ? null : qty(x.quantity), verifiedQuantity: x.verified_quantity === null ? null : qty(x.verified_quantity),
        notes: x.notes, reviewNotes: x.review_notes, createdAt: x.created_at, reviewedAt: x.reviewed_at, reporterName: x.reporter_name || null,
        pledgeId: x.pledge_id, pledgeStatus: x.pledge_status, pledgedQuantity: qty(x.quantity_pledged), verifiedDeliveredTotal: qty(x.quantity_delivered),
        itemName: x.item_name, unit: x.unit, requestId: x.request_id, requestTitle: x.request_title, incidentId: x.incident_id,
        incidentTitle: x.incident_title, district: x.district, corrections: num(x.corrections),
      };
    }),
    meta: buildPaginationMeta({ page, limit, totalItems: Number(total) }),
  };
}

// ---- incident detail / operational timeline ----------------------------------------------

async function getIncidentDetail(id) {
  const [[inc]] = await pool.query(
    `SELECT di.*, rep.name AS reporter_name, rep.role AS reporter_role, ver.name AS verifier_name, mer.name AS merged_by_name
       FROM disaster_incidents di LEFT JOIN users rep ON rep.id = di.reported_by LEFT JOIN users ver ON ver.id = di.verified_by LEFT JOIN users mer ON mer.id = di.merged_by
      WHERE di.id = :id`, { id }
  );
  if (!inc) throw new AppError('Incident not found.', HTTP_STATUS.NOT_FOUND);

  const [history] = await pool.query(
    `SELECT h.id, h.action, h.from_status, h.to_status, h.reason, h.details, h.created_at, u.name AS actor_name
       FROM disaster_incident_history h LEFT JOIN users u ON u.id = h.actor_id WHERE h.incident_id = :id ORDER BY h.created_at DESC, h.id DESC LIMIT 100`, { id }
  );
  const [requests] = await pool.query(
    `SELECT rr.id, rr.title, rr.status, rr.priority, rr.location_name, rr.approved_at, rr.expires_at, rr.reassessment_flagged_at, rr.reassessment_reason,
            rr.correction_requested_at, rr.correction_note, req.name AS requester_name
       FROM relief_requests rr LEFT JOIN users req ON req.id = rr.requested_by WHERE rr.incident_id = :id ORDER BY rr.id`, { id }
  );
  const items = await reliefItemModel.findWithTotalsByRequestIds(requests.map((r) => r.id), { includeCancelled: true });
  const [pledges] = await pool.query(
    `SELECT p.id, p.status, p.quantity_pledged, p.quantity_collected, p.quantity_delivered, p.quantity_pending_verification, p.created_at,
            i.item_name, i.unit, rr.id AS request_id, du.name AS donor_name,
            d.id AS donation_id, d.status AS task_status, COALESCE(d.assigned_member_id, d.volunteer_id) AS volunteer_id, vu.name AS volunteer_name
       FROM relief_pledges p JOIN relief_request_items i ON i.id = p.relief_request_item_id JOIN relief_requests rr ON rr.id = i.relief_request_id
       JOIN users du ON du.id = p.donor_id LEFT JOIN donation_requests d ON d.id = p.donation_request_id
       LEFT JOIN users vu ON vu.id = COALESCE(d.assigned_member_id, d.volunteer_id)
      WHERE rr.incident_id = :id ORDER BY p.id DESC LIMIT 200`, { id }
  );
  const [issues] = await pool.query(
    `SELECT rp.id, rp.report_type, rp.status, rp.quantity, rp.verified_quantity, rp.notes, rp.created_at, p.id AS pledge_id, i.item_name, i.unit
       FROM relief_pledge_reports rp JOIN relief_pledges p ON p.id = rp.pledge_id JOIN relief_request_items i ON i.id = p.relief_request_item_id
       JOIN relief_requests rr ON rr.id = i.relief_request_id
      WHERE rr.incident_id = :id AND rp.status IN ('open', 'pending') ORDER BY rp.created_at DESC LIMIT 50`, { id }
  );
  const [quantityHistory] = await pool.query(
    `SELECT q.id, q.relief_request_id, q.item_name, q.unit, q.change_type, q.old_quantity, q.new_quantity, q.request_status, q.reason, q.created_at, u.name AS actor_name
       FROM relief_item_quantity_history q JOIN relief_requests rr ON rr.id = q.relief_request_id LEFT JOIN users u ON u.id = q.changed_by
      WHERE rr.incident_id = :id ORDER BY q.created_at DESC, q.id DESC LIMIT 50`, { id }
  );
  const [mergedFrom] = await pool.query('SELECT id, title, merged_at FROM disaster_incidents WHERE merged_into_id = :id ORDER BY merged_at DESC', { id });
  const alertRows = await alertModel.findAllAlerts({ incidentId: id }, { limit: 20, offset: 0 });
  const [[stat]] = await pool.query(
    `SELECT COALESCE(COUNT(n.id), 0) AS stored, COALESCE(SUM(n.is_read = 1), 0) AS read_count
       FROM notifications n WHERE n.incident_id = :id AND n.type = 'disaster_alert'`, { id }
  );

  const itemsByRequest = new Map();
  items.map(serializeItem).forEach((it) => { if (!itemsByRequest.has(it.requestId)) itemsByRequest.set(it.requestId, []); itemsByRequest.get(it.requestId).push(it); });
  const alertDistricts = await alertModel.getDistrictsForAlerts(alertRows.map((a) => a.id));

  return {
    incident: {
      id: inc.id, title: inc.title, description: inc.description, disasterType: inc.disaster_type, severity: inc.severity, priority: inc.priority,
      status: inc.status, verificationStatus: inc.verification_status, verificationNotes: inc.verification_notes, district: inc.district,
      division: divisionOf(inc.district), affectedArea: inc.affected_area, address: inc.address, latitude: inc.latitude, longitude: inc.longitude,
      sourceType: inc.source_type, sourceReference: inc.source_reference, reporterName: inc.reporter_name || null, reporterRole: inc.reporter_role || null,
      verifiedByName: inc.verifier_name || null, verifiedAt: inc.verified_at, resolvedAt: inc.resolved_at, createdAt: inc.created_at, updatedAt: inc.updated_at,
      mergedIntoId: inc.merged_into_id, mergedAt: inc.merged_at, mergedByName: inc.merged_by_name || null,
      infoRequestedAt: inc.info_requested_at, infoRequestNote: inc.info_request_note,
    },
    history: history.map((h) => ({
      id: h.id, action: h.action, fromStatus: h.from_status, toStatus: h.to_status, reason: h.reason,
      details: h.details ? (() => { try { return JSON.parse(h.details); } catch { return null; } })() : null, actorName: h.actor_name || null, createdAt: h.created_at,
    })),
    mergedFrom: mergedFrom.map((m) => ({ id: m.id, title: m.title, mergedAt: m.merged_at })),
    requests: requests.map((r) => ({
      id: r.id, title: r.title, status: r.status, priority: r.priority, locationName: r.location_name, approvedAt: r.approved_at, expiresAt: r.expires_at,
      requesterName: r.requester_name || null, correctionRequestedAt: r.correction_requested_at, correctionNote: r.correction_note,
      reassessment: reassessmentReasons({ ...r, incident_status: inc.status }), items: itemsByRequest.get(r.id) || [],
    })),
    pledges: pledges.map((p) => ({
      id: p.id, requestId: p.request_id, status: p.status, itemName: p.item_name, unit: p.unit, donorName: p.donor_name, createdAt: p.created_at,
      pledged: qty(p.quantity_pledged), collected: qty(p.quantity_collected), verifiedDelivered: qty(p.quantity_delivered), pendingVerification: qty(p.quantity_pending_verification),
      taskStatus: p.task_status || null, volunteerId: p.volunteer_id || null, volunteerName: p.volunteer_name || null,
    })),
    issues: issues.map((x) => ({
      reportId: x.id, type: x.report_type, status: x.status, pledgeId: x.pledge_id, itemName: x.item_name, unit: x.unit, notes: x.notes, createdAt: x.created_at,
      reportedQuantity: x.quantity === null ? null : qty(x.quantity), verifiedQuantity: x.verified_quantity === null ? null : qty(x.verified_quantity),
    })),
    alerts: {
      items: alertRows.map((a) => ({
        id: a.id, scope: a.scope, severity: a.severity, status: a.status, districts: alertDistricts.get(a.id) || [], updatedAt: a.updated_at,
        deliveredTotal: num(a.delivered_total), eventsFailed: num(a.events_failed), eventsPending: num(a.events_pending),
      })),
      notificationsStored: num(stat.stored), notificationsRead: num(stat.read_count),
    },
    quantityHistory: quantityHistory.map((q) => ({
      id: q.id, requestId: q.relief_request_id, itemName: q.item_name, unit: q.unit, changeType: q.change_type,
      oldQuantity: q.old_quantity === null ? null : qty(q.old_quantity), newQuantity: q.new_quantity === null ? null : qty(q.new_quantity),
      requestStatus: q.request_status, reason: q.reason, actorName: q.actor_name || null, createdAt: q.created_at,
    })),
    limitations: ['History before Phase 5 was not recorded in the incident timeline; earlier changes appear only in the audit log.'],
  };
}

async function getRequestQuantityHistory(requestId) {
  const [rows] = await pool.query(
    `SELECT q.id, q.item_id, q.item_name, q.unit, q.change_type, q.old_quantity, q.new_quantity, q.request_status, q.reason, q.created_at, u.name AS actor_name
       FROM relief_item_quantity_history q LEFT JOIN users u ON u.id = q.changed_by WHERE q.relief_request_id = :requestId ORDER BY q.created_at DESC, q.id DESC`, { requestId }
  );
  return rows.map((q) => ({
    id: q.id, itemId: q.item_id, itemName: q.item_name, unit: q.unit, changeType: q.change_type,
    oldQuantity: q.old_quantity === null ? null : qty(q.old_quantity), newQuantity: q.new_quantity === null ? null : qty(q.new_quantity),
    requestStatus: q.request_status, reason: q.reason, actorName: q.actor_name || null, createdAt: q.created_at,
  }));
}

module.exports = {
  LIMITATIONS, serializeQuantityRow, getDashboard, listIncidents, listRequests, listTasks, listExceptions, getIncidentDetail,
  getRequestQuantityHistory, reassessmentReasons, DIVISIONS, buildQuantitySummary, auditService, AUDIT_ACTIONS,
};
