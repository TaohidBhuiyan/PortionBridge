const { pool } = require('../config/db');

/** Raw SQL data-access layer for `relief_pledge_reports` (volunteer reports + admin review). */

const WRITABLE = new Set(['status', 'verified_quantity', 'reviewed_by', 'reviewed_at', 'review_notes']);

async function create({ pledgeId, reporterId, reportType, quantity = null, isFinal = false, status, notes = null }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO relief_pledge_reports (pledge_id, reporter_id, report_type, quantity, is_final, status, notes)
     VALUES (:pledgeId, :reporterId, :reportType, :quantity, :isFinal, :status, :notes)`,
    { pledgeId, reporterId, reportType, quantity, isFinal: isFinal ? 1 : 0, status, notes }
  );
  return result.insertId;
}

async function findById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM relief_pledge_reports WHERE id = :id', { id });
  return rows[0] || null;
}

async function findByIdForUpdate(id, connection) {
  const [rows] = await connection.query('SELECT * FROM relief_pledge_reports WHERE id = :id FOR UPDATE', { id });
  return rows[0] || null;
}

async function updateById(id, fields, executor = pool) {
  const keys = Object.keys(fields).filter((k) => WRITABLE.has(k));
  if (keys.length === 0) return;
  const params = { id };
  keys.forEach((k) => { params[k] = fields[k]; });
  await executor.query(`UPDATE relief_pledge_reports SET ${keys.map((k) => `${k} = :${k}`).join(', ')} WHERE id = :id`, params);
}

/** A delivery report that closes the volunteer's side of the task (pending or already verified). */
async function findActiveFinalDelivery(pledgeId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT * FROM relief_pledge_reports
     WHERE pledge_id = :pledgeId AND report_type = 'delivery' AND is_final = 1 AND status IN ('pending', 'verified')
     LIMIT 1`,
    { pledgeId }
  );
  return rows[0] || null;
}

async function findOpenByPledge(pledgeId, types, executor = pool) {
  const params = { pledgeId };
  const names = types.map((t, i) => { params[`t${i}`] = t; return `:t${i}`; });
  const [rows] = await executor.query(
    `SELECT * FROM relief_pledge_reports WHERE pledge_id = :pledgeId AND status = 'open' AND report_type IN (${names.join(', ')})`,
    params
  );
  return rows;
}

async function countOpenIssues(pledgeId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT COUNT(*) AS n FROM relief_pledge_reports WHERE pledge_id = :pledgeId AND status IN ('open', 'pending')`,
    { pledgeId }
  );
  return Number(rows[0].n);
}

async function findByPledge(pledgeId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT r.*, reporter.name AS reporter_name, reviewer.name AS reviewer_name
     FROM relief_pledge_reports r
     LEFT JOIN users reporter ON reporter.id = r.reporter_id
     LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
     WHERE r.pledge_id = :pledgeId ORDER BY r.created_at ASC, r.id ASC`,
    { pledgeId }
  );
  return rows;
}

function queueFilter({ types, statuses }) {
  const conditions = ['1 = 1'];
  const params = {};
  if (types && types.length) {
    conditions.push(`r.report_type IN (${types.map((t, i) => { params[`ty${i}`] = t; return `:ty${i}`; }).join(', ')})`);
  }
  if (statuses && statuses.length) {
    conditions.push(`r.status IN (${statuses.map((t, i) => { params[`st${i}`] = t; return `:st${i}`; }).join(', ')})`);
  }
  return { where: conditions.join(' AND '), params };
}

const QUEUE_FROM = `
  FROM relief_pledge_reports r
  JOIN relief_pledges p ON p.id = r.pledge_id
  JOIN relief_request_items i ON i.id = p.relief_request_item_id
  JOIN relief_requests rr ON rr.id = i.relief_request_id
  JOIN disaster_incidents di ON di.id = rr.incident_id
  JOIN users donor ON donor.id = p.donor_id
  LEFT JOIN users reporter ON reporter.id = r.reporter_id
`;

/** Admin review queue. Oldest first so nothing waits forever. */
async function findQueue({ types, statuses }, { limit, offset }) {
  const { where, params } = queueFilter({ types, statuses });
  const [rows] = await pool.query(
    `SELECT r.*, p.status AS pledge_status, p.quantity_pledged, p.quantity_collected, p.quantity_delivered,
            p.quantity_pending_verification, p.donation_request_id,
            i.id AS item_id, i.item_name, i.unit, rr.id AS request_id, rr.title AS request_title,
            di.id AS incident_id, di.title AS incident_title, di.district,
            donor.name AS donor_name, reporter.name AS reporter_name
     ${QUEUE_FROM} WHERE ${where}
     ORDER BY r.created_at ASC, r.id ASC LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

async function countQueue(filters) {
  const { where, params } = queueFilter(filters);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total ${QUEUE_FROM} WHERE ${where}`, params);
  return rows[0].total;
}

module.exports = {
  create, findById, findByIdForUpdate, updateById, findActiveFinalDelivery, findOpenByPledge,
  countOpenIssues, findByPledge, findQueue, countQueue,
};
