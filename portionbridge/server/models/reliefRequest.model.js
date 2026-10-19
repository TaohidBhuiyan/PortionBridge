const { pool } = require('../config/db');

/** Raw SQL data-access layer for `relief_requests`. */

const WRITABLE = new Set([
  'title', 'description', 'location_name', 'address', 'delivery_instructions', 'latitude', 'longitude', 'priority',
  'status', 'requesting_organization', 'approved_by', 'approved_at', 'review_notes',
  'expires_at', 'closed_at',
]);

const SELECT = `
  rr.*, di.status AS incident_status, di.district AS incident_district, di.title AS incident_title,
  requester.name AS requester_name
  FROM relief_requests rr
  JOIN disaster_incidents di ON di.id = rr.incident_id
  LEFT JOIN users requester ON requester.id = rr.requested_by
`;

async function create(data, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO relief_requests
       (incident_id, title, description, location_name, address, delivery_instructions, latitude, longitude, priority,
        status, requested_by, requesting_organization, expires_at)
     VALUES
       (:incidentId, :title, :description, :locationName, :address, :deliveryInstructions, :latitude, :longitude, :priority,
        'pending_review', :requestedBy, :requestingOrganization, :expiresAt)`,
    data
  );
  return result.insertId;
}

async function findById(id, executor = pool) {
  const [rows] = await executor.query(`SELECT ${SELECT} WHERE rr.id = :id`, { id });
  return rows[0] || null;
}

/** Exclusive row lock — serialises request-level state changes. */
async function findByIdForUpdate(id, connection) {
  const [rows] = await connection.query('SELECT * FROM relief_requests WHERE id = :id FOR UPDATE', { id });
  return rows[0] || null;
}

/**
 * Shared row lock — many pledge transactions may hold it together, but a
 * request status change (exclusive lock) must wait for them and vice versa.
 */
async function findByIdForShare(id, connection) {
  const [rows] = await connection.query('SELECT * FROM relief_requests WHERE id = :id LOCK IN SHARE MODE', { id });
  return rows[0] || null;
}

async function updateById(id, fields, executor = pool) {
  const keys = Object.keys(fields).filter((k) => WRITABLE.has(k));
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${k} = :${k}`);
  const params = { id };
  keys.forEach((k) => { params[k] = fields[k]; });
  await executor.query(`UPDATE relief_requests SET ${setClauses.join(', ')} WHERE id = :id`, params);
}

function buildFilter({ incidentId, statuses, requestedBy, priority }) {
  const conditions = ['1 = 1'];
  const params = {};
  if (incidentId) { conditions.push('rr.incident_id = :incidentId'); params.incidentId = incidentId; }
  if (Array.isArray(statuses) && statuses.length) {
    const names = statuses.map((s, i) => { params[`st${i}`] = s; return `:st${i}`; });
    conditions.push(`rr.status IN (${names.join(', ')})`);
  }
  if (requestedBy) { conditions.push('rr.requested_by = :requestedBy'); params.requestedBy = requestedBy; }
  if (priority) { conditions.push('rr.priority = :priority'); params.priority = priority; }
  return { where: conditions.join(' AND '), params };
}

async function findAll(filters, { limit, offset }) {
  const { where, params } = buildFilter(filters);
  const [rows] = await pool.query(
    `SELECT ${SELECT} WHERE ${where}
     ORDER BY FIELD(rr.priority, 'urgent', 'high', 'normal', 'low'), rr.created_at DESC, rr.id DESC
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

async function countAll(filters) {
  const { where, params } = buildFilter(filters);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM relief_requests rr WHERE ${where}`, params);
  return rows[0].total;
}

module.exports = { create, findById, findByIdForUpdate, findByIdForShare, updateById, findAll, countAll };
