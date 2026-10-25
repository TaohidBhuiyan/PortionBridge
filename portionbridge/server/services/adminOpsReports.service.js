const { pool } = require('../config/db');
const ops = require('../models/adminOps.model');
const { divisionOf } = require('../config/bdDivisions');
const auditService = require('./audit.service');
const { serializeQuantityRow, LIMITATIONS } = require('./adminOps.service');
const { AUDIT_ACTIONS } = require('../constants');

const num = (v) => Number(v ?? 0);
const BUCKETS = {
  day: (c) => `DATE_FORMAT(${c}, '%Y-%m-%d')`,
  week: (c) => `DATE_FORMAT(${c}, '%x-W%v')`,
  month: (c) => `DATE_FORMAT(${c}, '%Y-%m')`,
};

async function groupCount(column, f) {
  const w = ops.incidentWhere(f);
  const [rows] = await pool.query(`SELECT ${column} AS k, COUNT(*) AS c FROM disaster_incidents di WHERE ${w.sql} GROUP BY ${column} ORDER BY c DESC, k`, w.params);
  return rows.map((r) => ({ key: r.k, count: num(r.c) }));
}

async function trends(f, granularity) {
  const bucket = BUCKETS[granularity] || BUCKETS.week;
  const w = ops.incidentWhere({ ...f, from: undefined, to: undefined });
  const dateParams = {};
  const range = (col) => {
    let sql = '';
    if (f.from) { sql += ` AND ${col} >= :t_from`; dateParams.t_from = `${f.from} 00:00:00`; }
    if (f.to) { sql += ` AND ${col} < DATE_ADD(:t_to, INTERVAL 1 DAY)`; dateParams.t_to = f.to; }
    return sql;
  };
  const [reported] = await pool.query(
    `SELECT ${bucket('di.created_at')} AS b, COUNT(*) AS c FROM disaster_incidents di WHERE ${w.sql}${range('di.created_at')} GROUP BY b`, { ...w.params, ...dateParams });
  const [verified] = await pool.query(
    `SELECT ${bucket('di.verified_at')} AS b, COUNT(*) AS c FROM disaster_incidents di WHERE ${w.sql} AND di.verification_status = 'verified' AND di.verified_at IS NOT NULL${range('di.verified_at')} GROUP BY b`, { ...w.params, ...dateParams });
  const [deliveries] = await pool.query(
    `SELECT ${bucket('rp.reviewed_at')} AS b, COUNT(*) AS c, COALESCE(SUM(rp.verified_quantity), 0) AS q
       FROM relief_pledge_reports rp JOIN relief_pledges p ON p.id = rp.pledge_id JOIN relief_request_items i ON i.id = p.relief_request_item_id
       JOIN relief_requests rr ON rr.id = i.relief_request_id JOIN disaster_incidents di ON di.id = rr.incident_id
      WHERE ${w.sql} AND rp.report_type = 'delivery' AND rp.status = 'verified' AND rp.reviewed_at IS NOT NULL${range('rp.reviewed_at')} GROUP BY b`, { ...w.params, ...dateParams });
  const map = new Map();
  const put = (b, key, v) => { if (!b) return; if (!map.has(b)) map.set(b, { period: b, incidentsReported: 0, incidentsVerified: 0, deliveriesVerified: 0 }); map.get(b)[key] = v; };
  reported.forEach((r) => put(r.b, 'incidentsReported', num(r.c)));
  verified.forEach((r) => put(r.b, 'incidentsVerified', num(r.c)));
  deliveries.forEach((r) => put(r.b, 'deliveriesVerified', num(r.c)));
  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
}

async function timings(f) {
  const w = ops.incidentWhere(f);
  const hrs = (r) => (r === null || r === undefined ? null : Math.round(Number(r) * 10) / 10);
  const [[v]] = await pool.query(
    `SELECT COUNT(*) AS n, AVG(TIMESTAMPDIFF(MINUTE, di.created_at, di.verified_at)) / 60 AS h FROM disaster_incidents di
      WHERE ${w.sql} AND di.verification_status = 'verified' AND di.verified_at IS NOT NULL`, w.params);
  const [[a]] = await pool.query(
    `SELECT COUNT(*) AS n, AVG(TIMESTAMPDIFF(MINUTE, rr.created_at, rr.approved_at)) / 60 AS h FROM relief_requests rr JOIN disaster_incidents di ON di.id = rr.incident_id
      WHERE ${w.sql} AND rr.approved_at IS NOT NULL`, w.params);
  const [[c]] = await pool.query(
    `SELECT COUNT(*) AS n, AVG(TIMESTAMPDIFF(MINUTE, rr.approved_at, rr.closed_at)) / 60 AS h FROM relief_requests rr JOIN disaster_incidents di ON di.id = rr.incident_id
      WHERE ${w.sql} AND rr.status = 'completed' AND rr.approved_at IS NOT NULL AND rr.closed_at IS NOT NULL`, w.params);
  const [[d]] = await pool.query(
    `SELECT COUNT(*) AS n, AVG(TIMESTAMPDIFF(MINUTE, rp.created_at, rp.reviewed_at)) / 60 AS h
       FROM relief_pledge_reports rp JOIN relief_pledges p ON p.id = rp.pledge_id JOIN relief_request_items i ON i.id = p.relief_request_item_id
       JOIN relief_requests rr ON rr.id = i.relief_request_id JOIN disaster_incidents di ON di.id = rr.incident_id
      WHERE ${w.sql} AND rp.report_type = 'delivery' AND rp.status = 'verified' AND rp.reviewed_at IS NOT NULL`, w.params);
  const [[g]] = await pool.query(
    `SELECT COUNT(*) AS n, AVG(TIMESTAMPDIFF(MINUTE, p.created_at, x.first_accept)) / 60 AS h
       FROM relief_pledges p JOIN relief_request_items i ON i.id = p.relief_request_item_id JOIN relief_requests rr ON rr.id = i.relief_request_id
       JOIN disaster_incidents di ON di.id = rr.incident_id
       JOIN (SELECT h.donation_request_id, MIN(h.changed_at) AS first_accept FROM donation_status_history h WHERE h.new_status = 'accepted' GROUP BY h.donation_request_id) x
         ON x.donation_request_id = p.donation_request_id
      WHERE ${w.sql}`, w.params);
  const metric = (label, row, basis) => ({ label, averageHours: hrs(row.h), sampleSize: num(row.n), basis, available: num(row.n) > 0 });
  return [
    metric('Incident report → verification', v, 'disaster_incidents.created_at to verified_at'),
    metric('Relief request submission → approval', a, 'relief_requests.created_at to approved_at'),
    metric('Pledge → first volunteer acceptance', g, 'pledge created_at to the first "accepted" status in donation_status_history'),
    metric('Delivery report → admin verification', d, 'relief_pledge_reports.created_at to reviewed_at'),
    metric('Request approval → fulfilment (completed requests)', c, 'relief_requests.approved_at to closed_at'),
  ];
}

async function getReports(filters, { granularity = 'week' } = {}) {
  const [byType, bySeverity, byStatus, byDistrict, verification, requestsByStatus, quantities, perIncident, taskOutcomes, taskCounts, trendRows, timing] = await Promise.all([
    groupCount('di.disaster_type', filters), groupCount('di.severity', filters), groupCount('di.status', filters), groupCount('di.district', filters),
    groupCount('di.verification_status', filters),
    (async () => {
      const w = ops.incidentWhere(filters);
      const [rows] = await pool.query(`SELECT rr.status AS k, COUNT(*) AS c FROM relief_requests rr JOIN disaster_incidents di ON di.id = rr.incident_id WHERE ${w.sql} GROUP BY rr.status ORDER BY c DESC`, w.params);
      return rows.map((r) => ({ key: r.k, count: num(r.c) }));
    })(),
    ops.quantityRollup(filters), ops.quantityRollup(filters, { byIncident: true }),
    (async () => {
      const w = ops.incidentWhere(filters);
      const [rows] = await pool.query(
        `SELECT p.status AS k, COUNT(*) AS c ${ops.TASK_BASE_FROM} WHERE ${w.sql} GROUP BY p.status`, w.params);
      return rows.map((r) => ({ key: r.k, count: num(r.c) }));
    })(),
    ops.taskCounts(filters), trends(filters, granularity), timings(filters),
  ]);

  const divisions = new Map();
  byDistrict.forEach((d) => { const key = divisionOf(d.key) || 'Unknown'; divisions.set(key, (divisions.get(key) || 0) + d.count); });

  const incidents = new Map();
  perIncident.map(serializeQuantityRow).forEach((q) => {
    if (!incidents.has(q.incidentId)) incidents.set(q.incidentId, { incidentId: q.incidentId, incidentTitle: q.incidentTitle, items: [] });
    incidents.get(q.incidentId).items.push(q);
  });
  const outcome = (k) => (taskOutcomes.find((t) => t.key === k) || { count: 0 }).count;

  return {
    generatedAt: new Date().toISOString(), filters, granularity,
    incidents: {
      byType, bySeverity, byStatus, byDistrict, byDivision: [...divisions.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
      verifiedVsRejected: {
        verified: (verification.find((x) => x.key === 'verified') || { count: 0 }).count,
        rejected: (verification.find((x) => x.key === 'rejected') || { count: 0 }).count,
        unverified: (verification.find((x) => x.key === 'unverified') || { count: 0 }).count,
      },
    },
    requests: { byStatus: requestsByStatus },
    quantities: quantities.map(serializeQuantityRow),
    fulfillmentByIncident: [...incidents.values()],
    deliveryTasks: {
      completed: outcome('delivered') + outcome('partially_fulfilled'), fullyDelivered: outcome('delivered'), partiallyFulfilled: outcome('partially_fulfilled'),
      failed: outcome('failed'), cancelled: outcome('cancelled'), inProgress: outcome('pledged') + outcome('collected'), delayedNow: taskCounts.delayed,
      delayThresholdHours: ops.DELAY_HOURS(),
    },
    trends: trendRows,
    timings: timing,
    limitations: [
      ...LIMITATIONS,
      'The date range filters incidents by the date they were reported; trend series use each event\'s own timestamp.',
      'Timing metrics use only records that carry the needed timestamps (see sampleSize). Records from before these timestamps were captured are excluded, never estimated.',
      'A "delayed" task is one whose last status change is older than the configured threshold; the figure describes the present, not history.',
    ],
  };
}

// ---- CSV export (no personal data) --------------------------------------------------

const EXPORT_LIMIT = 10000;

/** Neutralises spreadsheet formula injection and escapes CSV. */
function csvCell(value) {
  if (value === null || value === undefined) return '';
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const toCsv = (columns, rows) => `\uFEFF${[columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(','))].join('\r\n')}\r\n`;

const DATASETS = ['incidents', 'requests', 'quantities', 'tasks'];

async function exportDataset(admin, dataset, filters, ctx = {}) {
  const w = ops.incidentWhere(filters);
  const r = ops.requestStatusWhere(filters);
  let columns; let rows;
  if (dataset === 'incidents') {
    [rows] = await pool.query(
      `SELECT di.id, di.title, di.disaster_type, di.severity, di.priority, di.status, di.verification_status, di.district, di.source_type, di.created_at, di.verified_at, di.resolved_at
         FROM disaster_incidents di WHERE ${w.sql} ORDER BY di.id LIMIT ${EXPORT_LIMIT}`, w.params);
    rows = rows.map((x) => ({ ...x, division: divisionOf(x.district) }));
    columns = ['id', 'title', 'disaster_type', 'severity', 'priority', 'status', 'verification_status', 'district', 'division', 'source_type', 'created_at', 'verified_at', 'resolved_at'];
  } else if (dataset === 'requests') {
    [rows] = await pool.query(
      `SELECT rr.id, rr.incident_id, rr.title, rr.status, rr.priority, rr.location_name, di.district, rr.created_at, rr.approved_at, rr.expires_at, rr.closed_at
         FROM relief_requests rr JOIN disaster_incidents di ON di.id = rr.incident_id WHERE ${w.sql}${r.sql} ORDER BY rr.id LIMIT ${EXPORT_LIMIT}`, { ...w.params, ...r.params });
    columns = ['id', 'incident_id', 'title', 'status', 'priority', 'location_name', 'district', 'created_at', 'approved_at', 'expires_at', 'closed_at'];
  } else if (dataset === 'quantities') {
    rows = (await ops.quantityRollup(filters)).map(serializeQuantityRow).map((q) => ({
      item: q.name, category: q.category, unit: q.unit, requested: q.requested, pledged: q.pledged, collected: q.collected,
      verified_delivered: q.verifiedDelivered, pending_verification: q.pendingVerification, remaining_unfulfilled: q.remainingUnfulfilled,
    }));
    columns = ['item', 'category', 'unit', 'requested', 'pledged', 'collected', 'verified_delivered', 'pending_verification', 'remaining_unfulfilled'];
  } else {
    [rows] = await pool.query(
      `SELECT p.id AS pledge_id, rr.id AS request_id, di.id AS incident_id, i.item_name, i.unit, p.quantity_pledged, p.quantity_collected, p.quantity_delivered,
              p.quantity_pending_verification, p.status AS pledge_status, d.status AS task_status, p.created_at, p.delivered_at,
              TIMESTAMPDIFF(HOUR, COALESCE(${ops.LAST_CHANGE}, d.updated_at, p.created_at), NOW()) AS hours_since_change
         ${ops.TASK_BASE_FROM} WHERE ${w.sql}${r.sql} ORDER BY p.id LIMIT ${EXPORT_LIMIT}`, { ...w.params, ...r.params });
    columns = ['pledge_id', 'request_id', 'incident_id', 'item_name', 'unit', 'quantity_pledged', 'quantity_collected', 'quantity_delivered', 'quantity_pending_verification', 'pledge_status', 'task_status', 'created_at', 'delivered_at', 'hours_since_change'];
  }
  await auditService.record({
    userId: admin.id, action: AUDIT_ACTIONS.OPS_EXPORT_GENERATED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { dataset, rows: rows.length, filters },
  });
  return { csv: toCsv(columns, rows), rows: rows.length, truncated: rows.length >= EXPORT_LIMIT };
}

module.exports = { getReports, exportDataset, csvCell, toCsv, DATASETS, EXPORT_LIMIT };
