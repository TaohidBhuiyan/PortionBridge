const { pool } = require('../config/db');
const { districtsOfDivision } = require('../config/bdDivisions');

/**
 * Read-only SQL for the admin disaster-operations dashboard, lists and reports (Phase 5).
 * Every number is computed from the live tables — nothing is cached, seeded or hard-coded.
 * Quantity semantics are the SAME as the relief item summaries (utils/reliefQuantity):
 *   requested      relief_request_items.quantity_requested (active items)
 *   pledged        open pledges' undelivered balance + verified delivered  ("committed")
 *   collected      quantity_collected of pledges that are not cancelled/failed
 *   verifiedDelivered   quantity_delivered (set ONLY by admin verification)
 *   pendingVerification volunteer-reported delivery awaiting admin verification
 * Merged incidents are excluded everywhere (their requests live on the surviving incident).
 */

const DELAY_HOURS = () => {
  const n = Number.parseInt(process.env.RELIEF_TASK_DELAY_HOURS, 10);
  return Number.isInteger(n) && n > 0 ? n : 24;
};

/** Builds the incident-level WHERE fragment shared by every dashboard query. */
function incidentWhere(f = {}, di = 'di') {
  const conditions = [f.status === 'merged' ? '1 = 1' : `${di}.status <> 'merged'`];
  const params = {};
  if (f.disasterType) { conditions.push(`${di}.disaster_type = :f_type`); params.f_type = f.disasterType; }
  if (f.status) { conditions.push(`${di}.status = :f_status`); params.f_status = f.status; }
  if (f.severity) { conditions.push(`${di}.severity = :f_severity`); params.f_severity = f.severity; }
  if (f.verificationStatus) { conditions.push(`${di}.verification_status = :f_verif`); params.f_verif = f.verificationStatus; }
  if (f.incidentId) { conditions.push(`${di}.id = :f_incident`); params.f_incident = f.incidentId; }
  if (f.district) { conditions.push(`${di}.district = :f_district`); params.f_district = f.district; }
  if (f.division) {
    const districts = districtsOfDivision(f.division) || [];
    if (districts.length === 0) conditions.push('1 = 0');
    else {
      const names = districts.map((d, i) => { params[`f_div${i}`] = d; return `:f_div${i}`; });
      conditions.push(`${di}.district IN (${names.join(', ')})`);
    }
  }
  if (f.from) { conditions.push(`${di}.created_at >= :f_from`); params.f_from = `${f.from} 00:00:00`; }
  if (f.to) { conditions.push(`${di}.created_at < DATE_ADD(:f_to, INTERVAL 1 DAY)`); params.f_to = f.to; }
  return { sql: conditions.join(' AND '), params };
}

const requestStatusWhere = (f, rr = 'rr') => (f.requestStatus ? { sql: ` AND ${rr}.status = :f_rstatus`, params: { f_rstatus: f.requestStatus } } : { sql: '', params: {} });

const UNFULFILLED_ITEM_EXISTS = `EXISTS (
  SELECT 1 FROM relief_request_items ui
   WHERE ui.relief_request_id = rr.id AND ui.status = 'active'
     AND ui.quantity_requested > COALESCE((SELECT SUM(up.quantity_delivered) FROM relief_pledges up
                                            WHERE up.relief_request_item_id = ui.id AND up.status NOT IN ('cancelled', 'failed')), 0)
)`;

/** Reasons an approved request needs another look. Pure SQL over live data. */
const REASSESS_SQL = `(
  rr.reassessment_flagged_at IS NOT NULL
  OR (rr.status = 'approved' AND di.status IN ('resolved', 'rejected', 'merged'))
  OR (rr.status = 'approved' AND rr.expires_at IS NOT NULL AND rr.expires_at < NOW())
)`;

async function incidentCounts(f) {
  const w = incidentWhere(f);
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(di.status IN ('reported', 'under_review')), 0) AS awaiting_verification,
            COALESCE(SUM(di.status IN ('verified', 'active')), 0) AS verified_active,
            COALESCE(SUM(di.severity IN ('high', 'critical') AND di.status IN ('reported', 'under_review', 'verified', 'active')), 0) AS critical_high,
            COALESCE(SUM(di.status = 'resolved'), 0) AS resolved,
            COALESCE(SUM(di.status = 'rejected'), 0) AS rejected
       FROM disaster_incidents di WHERE ${w.sql}`, w.params
  );
  return rows[0];
}

async function requestCounts(f) {
  const w = incidentWhere(f);
  const r = requestStatusWhere(f);
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(rr.status = 'pending_review'), 0) AS pending_review,
            COALESCE(SUM(rr.status = 'approved'), 0) AS approved,
            COALESCE(SUM(rr.status = 'approved' AND ${UNFULFILLED_ITEM_EXISTS}), 0) AS approved_unfulfilled,
            COALESCE(SUM(${REASSESS_SQL}), 0) AS needs_reassessment,
            COALESCE(SUM(rr.correction_requested_at IS NOT NULL AND rr.status = 'pending_review'), 0) AS awaiting_correction
       FROM relief_requests rr JOIN disaster_incidents di ON di.id = rr.incident_id
      WHERE ${w.sql}${r.sql}`, { ...w.params, ...r.params }
  );
  return rows[0];
}

/** Requested / pledged / collected / verified delivered grouped by item and unit (units are never mixed). */
async function quantityRollup(f, { byIncident = false } = {}) {
  const w = incidentWhere(f);
  const r = requestStatusWhere(f);
  const [rows] = await pool.query(
    `SELECT ${byIncident ? 't.incident_id, t.incident_title,' : ''} t.item_key, MIN(t.item_name) AS item_name, MIN(t.item_category) AS item_category, t.unit,
            SUM(t.requested) AS requested, SUM(t.active_pledged + t.delivered) AS pledged, SUM(t.collected) AS collected,
            SUM(t.delivered) AS verified_delivered, SUM(t.pending_verification) AS pending_verification, COUNT(*) AS item_rows
       FROM (
         SELECT i.id, i.item_key, i.item_name, i.item_category, i.unit, i.quantity_requested AS requested,
                di.id AS incident_id, di.title AS incident_title,
                COALESCE(SUM(CASE WHEN p.status IN ('pledged', 'collected') THEN p.quantity_pledged - p.quantity_delivered ELSE 0 END), 0) AS active_pledged,
                COALESCE(SUM(CASE WHEN p.status NOT IN ('cancelled', 'failed') THEN p.quantity_collected ELSE 0 END), 0) AS collected,
                COALESCE(SUM(CASE WHEN p.status NOT IN ('cancelled', 'failed') THEN p.quantity_delivered ELSE 0 END), 0) AS delivered,
                COALESCE(SUM(CASE WHEN p.status IN ('pledged', 'collected') THEN p.quantity_pending_verification ELSE 0 END), 0) AS pending_verification
           FROM relief_request_items i
           JOIN relief_requests rr ON rr.id = i.relief_request_id
           JOIN disaster_incidents di ON di.id = rr.incident_id
           LEFT JOIN relief_pledges p ON p.relief_request_item_id = i.id
          WHERE i.status = 'active' AND rr.status IN ('approved', 'completed') AND ${w.sql}${r.sql}
          GROUP BY i.id
       ) t
      GROUP BY ${byIncident ? 't.incident_id, t.incident_title,' : ''} t.item_key, t.unit
      ORDER BY ${byIncident ? 't.incident_id,' : ''} item_name, t.unit`,
    { ...w.params, ...r.params }
  );
  return rows;
}

const TASK_BASE_FROM = `
  FROM relief_pledges p
  JOIN relief_request_items i ON i.id = p.relief_request_item_id
  JOIN relief_requests rr ON rr.id = i.relief_request_id
  JOIN disaster_incidents di ON di.id = rr.incident_id
  LEFT JOIN donation_requests d ON d.id = p.donation_request_id
  LEFT JOIN users vu ON vu.id = COALESCE(d.assigned_member_id, d.volunteer_id)
`;
const LAST_CHANGE = '(SELECT MAX(h.changed_at) FROM donation_status_history h WHERE h.donation_request_id = d.id)';
const ACTIVE_DONATION = "d.status IN ('accepted', 'scheduled', 'on_the_way', 'picked_up') AND (d.is_deleted = 0)";

/** SQL predicates for each task view (hours are bound as :delayHours). */
const TASK_VIEWS = {
  all: '1 = 1',
  active: `p.status IN ('pledged', 'collected') AND ${ACTIVE_DONATION}`,
  unassigned: "p.status = 'pledged' AND rr.status = 'approved' AND d.status = 'pending' AND d.is_deleted = 0",
  delayed: `p.status IN ('pledged', 'collected') AND (
      (${ACTIVE_DONATION} AND COALESCE(${LAST_CHANGE}, d.updated_at) < (NOW() - INTERVAL :delayHours HOUR))
      OR (p.status = 'pledged' AND rr.status = 'approved' AND d.status = 'pending' AND d.is_deleted = 0 AND p.created_at < (NOW() - INTERVAL :delayHours HOUR)))`,
  failed: "p.status = 'failed'",
  attention: "EXISTS (SELECT 1 FROM relief_pledge_reports r WHERE r.pledge_id = p.id AND r.status IN ('open', 'pending'))",
};

async function taskCounts(f) {
  const w = incidentWhere(f);
  const r = requestStatusWhere(f);
  const base = `SELECT COUNT(*) AS c ${TASK_BASE_FROM} WHERE ${w.sql}${r.sql} AND `;
  const params = { ...w.params, ...r.params, delayHours: DELAY_HOURS() };
  const out = {};
  for (const [name, sql] of Object.entries(TASK_VIEWS)) {
    const [rows] = await pool.query(`${base}(${sql})`, params);
    out[name] = Number(rows[0].c);
  }
  return out;
}

async function disputedCounts(f) {
  const w = incidentWhere(f);
  const r = requestStatusWhere(f);
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(rp.status = 'open'), 0) AS open_issues,
            COALESCE(SUM(rp.report_type = 'delivery' AND rp.status = 'pending'), 0) AS pending_verification,
            COALESCE(SUM(rp.report_type = 'delivery' AND rp.status = 'verified' AND rp.verified_quantity < rp.quantity), 0) AS discrepancies
       FROM relief_pledge_reports rp
       JOIN relief_pledges p ON p.id = rp.pledge_id
       JOIN relief_request_items i ON i.id = p.relief_request_item_id
       JOIN relief_requests rr ON rr.id = i.relief_request_id
       JOIN disaster_incidents di ON di.id = rr.incident_id
      WHERE ${w.sql}${r.sql}`, { ...w.params, ...r.params }
  );
  return rows[0];
}

async function recentIncidents(f, limit = 8) {
  const w = incidentWhere(f);
  const [rows] = await pool.query(
    `SELECT di.id, di.title, di.disaster_type, di.severity, di.status, di.verification_status, di.district, di.updated_at
       FROM disaster_incidents di WHERE ${w.sql} ORDER BY di.updated_at DESC, di.id DESC LIMIT :limit`, { ...w.params, limit }
  );
  return rows;
}

async function recentRequests(f, limit = 8) {
  const w = incidentWhere(f);
  const r = requestStatusWhere(f);
  const [rows] = await pool.query(
    `SELECT rr.id, rr.title, rr.status, rr.priority, rr.updated_at, di.id AS incident_id, di.title AS incident_title
       FROM relief_requests rr JOIN disaster_incidents di ON di.id = rr.incident_id
      WHERE ${w.sql}${r.sql} ORDER BY rr.updated_at DESC, rr.id DESC LIMIT :limit`, { ...w.params, ...r.params, limit }
  );
  return rows;
}

async function alertHealth() {
  const [[a]] = await pool.query(
    `SELECT COALESCE(SUM(status = 'active'), 0) AS active_alerts,
            COALESCE(SUM(status = 'active' AND scope = 'nationwide'), 0) AS active_nationwide FROM disaster_alerts`
  );
  const [[e]] = await pool.query(
    `SELECT COALESCE(SUM(status = 'failed'), 0) AS failed_events,
            COALESCE(SUM(status = 'pending'), 0) AS pending_events,
            COALESCE(SUM(status = 'processing' AND locked_at < (NOW() - INTERVAL 5 MINUTE)), 0) AS stuck_events
       FROM disaster_alert_events`
  );
  const [failed] = await pool.query(
    `SELECT e.id, e.alert_id, e.event_type, e.attempts, e.last_error, e.created_at
       FROM disaster_alert_events e WHERE e.status = 'failed' ORDER BY e.created_at DESC LIMIT 5`
  );
  return { ...a, ...e, failed };
}

module.exports = {
  DELAY_HOURS, incidentWhere, requestStatusWhere, TASK_VIEWS, TASK_BASE_FROM, LAST_CHANGE, REASSESS_SQL, UNFULFILLED_ITEM_EXISTS,
  incidentCounts, requestCounts, quantityRollup, taskCounts, disputedCounts, recentIncidents, recentRequests, alertHealth,
};
