const { pool } = require('../config/db');

/** Raw SQL data-access layer for `relief_pledges`. */

const WRITABLE = new Set([
  'quantity_pledged', 'quantity_collected', 'quantity_delivered', 'quantity_pending_verification', 'status', 'notes',
  'collected_at', 'delivered_at', 'cancelled_at', 'failed_at', 'cancelled_by', 'cancellation_reason',
]);

const SELECT = `
  p.*, i.item_name, i.item_category, i.unit, i.quantity_requested, i.relief_request_id,
  rr.title AS request_title, rr.status AS request_status, rr.incident_id,
  donor.name AS donor_name
  FROM relief_pledges p
  JOIN relief_request_items i ON i.id = p.relief_request_item_id
  JOIN relief_requests rr ON rr.id = i.relief_request_id
  JOIN users donor ON donor.id = p.donor_id
`;

async function create(data, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO relief_pledges
       (relief_request_item_id, donor_id, quantity_pledged, status, donation_request_id, idempotency_key, notes)
     VALUES (:itemId, :donorId, :quantityPledged, 'pledged', :donationRequestId, :idempotencyKey, :notes)`,
    data
  );
  return result.insertId;
}

async function findById(id, executor = pool) {
  const [rows] = await executor.query(`SELECT ${SELECT} WHERE p.id = :id`, { id });
  return rows[0] || null;
}

/** Plain row, no joins — for the lock-then-verify step. */
async function findByIdForUpdate(id, connection) {
  const [rows] = await connection.query('SELECT * FROM relief_pledges WHERE id = :id FOR UPDATE', { id });
  return rows[0] || null;
}

/** Item id of a pledge without locking (immutable once created) — used to pick the lock order. */
async function findItemIdByPledgeId(id, executor = pool) {
  const [rows] = await executor.query('SELECT relief_request_item_id FROM relief_pledges WHERE id = :id', { id });
  return rows[0] ? rows[0].relief_request_item_id : null;
}

async function findByIdempotencyKey(donorId, key, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM relief_pledges WHERE donor_id = :donorId AND idempotency_key = :key',
    { donorId, key }
  );
  return rows[0] || null;
}

async function findOpenByDonorAndItem(donorId, itemId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT * FROM relief_pledges
     WHERE donor_id = :donorId AND relief_request_item_id = :itemId AND status IN ('pledged', 'collected')`,
    { donorId, itemId }
  );
  return rows[0] || null;
}

async function updateById(id, fields, executor = pool) {
  const keys = Object.keys(fields).filter((k) => WRITABLE.has(k));
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${k} = :${k}`);
  const params = { id };
  keys.forEach((k) => { params[k] = fields[k]; });
  await executor.query(`UPDATE relief_pledges SET ${setClauses.join(', ')} WHERE id = :id`, params);
}

async function findByDonor(donorId, { status, limit, offset }) {
  const params = { donorId, limit, offset };
  let statusClause = '';
  if (status) { statusClause = 'AND p.status = :status'; params.status = status; }
  const [rows] = await pool.query(
    `SELECT ${SELECT} WHERE p.donor_id = :donorId ${statusClause}
     ORDER BY p.created_at DESC, p.id DESC LIMIT :limit OFFSET :offset`,
    params
  );
  return rows;
}

async function countByDonor(donorId, { status }) {
  const params = { donorId };
  let statusClause = '';
  if (status) { statusClause = 'AND status = :status'; params.status = status; }
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM relief_pledges WHERE donor_id = :donorId ${statusClause}`, params
  );
  return rows[0].total;
}

async function findByRequestId(requestId, { limit, offset }) {
  const [rows] = await pool.query(
    `SELECT ${SELECT} WHERE i.relief_request_id = :requestId
     ORDER BY p.created_at DESC, p.id DESC LIMIT :limit OFFSET :offset`,
    { requestId, limit, offset }
  );
  return rows;
}

async function countByRequestId(requestId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM relief_pledges p
     JOIN relief_request_items i ON i.id = p.relief_request_item_id
     WHERE i.relief_request_id = :requestId`,
    { requestId }
  );
  return rows[0].total;
}

/** Pledges of a request in a given status, locked (call after locking the items). */
async function lockByRequestAndStatus(requestId, status, connection) {
  const [rows] = await connection.query(
    `SELECT p.* FROM relief_pledges p
     JOIN relief_request_items i ON i.id = p.relief_request_item_id
     WHERE i.relief_request_id = :requestId AND p.status = :status
     ORDER BY p.id FOR UPDATE`,
    { requestId, status }
  );
  return rows;
}

/**
 * Donation record a pledge may be linked to (the existing pickup/delivery workflow).
 * Returns only the columns needed for ownership/validity checks.
 */
async function findDonationForLink(donationId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT id, donor_id, status, is_deleted FROM donation_requests WHERE id = :donationId`,
    { donationId }
  );
  return rows[0] || null;
}

/** True if `userId` is the volunteer (or assigned team member) of the pledge's linked donation. */
async function isAssignedFulfiller(pledgeId, userId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT 1 FROM relief_pledges p
     JOIN donation_requests dr ON dr.id = p.donation_request_id
     WHERE p.id = :pledgeId AND dr.is_deleted = 0
       AND (dr.volunteer_id = :userId OR dr.assigned_member_id = :userId)
     LIMIT 1`,
    { pledgeId, userId }
  );
  return rows.length > 0;
}

module.exports = {
  create, findById, findByIdForUpdate, findItemIdByPledgeId, findByIdempotencyKey, findOpenByDonorAndItem,
  updateById, findByDonor, countByDonor, findByRequestId, countByRequestId, lockByRequestAndStatus,
  findDonationForLink, isAssignedFulfiller,
};
