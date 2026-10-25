const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for `disaster_incidents`.
 * Columns that may be written are whitelisted in WRITABLE so a caller can never
 * set an arbitrary column (mass-assignment protection at the data layer too).
 */

const WRITABLE = new Set([
  'title', 'description', 'disaster_type', 'severity', 'priority', 'latitude', 'longitude',
  'address', 'district', 'affected_area', 'status', 'source_type', 'source_reference',
  'verification_status', 'verified_by', 'verified_at', 'verification_notes', 'resolved_at',
  'merged_into_id', 'merged_at', 'merged_by', 'info_requested_at', 'info_requested_by', 'info_request_note',
]);

const SELECT = `
  di.*, reporter.name AS reporter_name, verifier.name AS verifier_name
  FROM disaster_incidents di
  LEFT JOIN users reporter ON reporter.id = di.reported_by
  LEFT JOIN users verifier ON verifier.id = di.verified_by
`;

async function create(data, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO disaster_incidents
       (title, description, disaster_type, severity, priority, latitude, longitude, address,
        district, affected_area, status, source_type, source_reference, verification_status, reported_by)
     VALUES
       (:title, :description, :disasterType, :severity, :priority, :latitude, :longitude, :address,
        :district, :affectedArea, 'reported', :sourceType, :sourceReference, 'unverified', :reportedBy)`,
    data
  );
  return result.insertId;
}

async function findById(id, executor = pool) {
  const [rows] = await executor.query(`SELECT ${SELECT} WHERE di.id = :id`, { id });
  return rows[0] || null;
}

/** Row lock — call inside a transaction. */
async function findByIdForUpdate(id, connection) {
  const [rows] = await connection.query('SELECT * FROM disaster_incidents WHERE id = :id FOR UPDATE', { id });
  return rows[0] || null;
}

async function updateById(id, fields, executor = pool) {
  const keys = Object.keys(fields).filter((k) => WRITABLE.has(k));
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${k} = :${k}`);
  const params = { id };
  keys.forEach((k) => { params[k] = fields[k]; });
  await executor.query(`UPDATE disaster_incidents SET ${setClauses.join(', ')} WHERE id = :id`, params);
}

function buildFilter({ statuses, disasterType, district, severity, priority, search, reportedBy }) {
  const conditions = ['1 = 1'];
  const params = {};
  if (Array.isArray(statuses) && statuses.length) {
    const names = statuses.map((s, i) => { params[`st${i}`] = s; return `:st${i}`; });
    conditions.push(`di.status IN (${names.join(', ')})`);
  }
  if (disasterType) { conditions.push('di.disaster_type = :disasterType'); params.disasterType = disasterType; }
  if (district) { conditions.push('di.district = :district'); params.district = district; }
  if (severity) { conditions.push('di.severity = :severity'); params.severity = severity; }
  if (priority) { conditions.push('di.priority = :priority'); params.priority = priority; }
  if (reportedBy) { conditions.push('di.reported_by = :reportedBy'); params.reportedBy = reportedBy; }
  if (search) {
    conditions.push('(di.title LIKE :search OR di.affected_area LIKE :search OR di.district LIKE :search)');
    params.search = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  }
  return { where: conditions.join(' AND '), params };
}

const SORTS = {
  newest: 'di.created_at DESC, di.id DESC',
  oldest: 'di.created_at ASC, di.id ASC',
  priority: "FIELD(di.priority, 'urgent', 'high', 'normal', 'low'), di.created_at DESC",
  severity: "FIELD(di.severity, 'critical', 'high', 'moderate', 'low'), di.created_at DESC",
};

async function findAll(filters, { sort = 'newest', limit, offset }) {
  const { where, params } = buildFilter(filters);
  const [rows] = await pool.query(
    `SELECT ${SELECT} WHERE ${where} ORDER BY ${SORTS[sort] || SORTS.newest} LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows;
}

async function countAll(filters) {
  const { where, params } = buildFilter(filters);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM disaster_incidents di WHERE ${where}`, params);
  return rows[0].total;
}

module.exports = { create, findById, findByIdForUpdate, updateById, findAll, countAll };
