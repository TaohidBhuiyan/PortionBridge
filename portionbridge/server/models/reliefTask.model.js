const { pool } = require('../config/db');

/**
 * Task view of a relief pledge: the pledge joined with its linked donation (the existing
 * pickup lifecycle), the requested item, the approved relief request and the incident.
 * One query shape, used by the donor, volunteer and admin views, so every screen sees the
 * same quantities and statuses.
 */

const TASK_FROM = `
  FROM relief_pledges p
  JOIN relief_request_items i ON i.id = p.relief_request_item_id
  JOIN relief_requests rr ON rr.id = i.relief_request_id
  JOIN disaster_incidents di ON di.id = rr.incident_id
  JOIN donation_requests dr ON dr.id = p.donation_request_id
  JOIN users donor ON donor.id = p.donor_id
  LEFT JOIN users vol ON vol.id = dr.volunteer_id
  LEFT JOIN users member ON member.id = dr.assigned_member_id
`;

const TASK_COLUMNS = `
  p.id AS pledge_id, p.status AS pledge_status, p.quantity_pledged, p.quantity_collected,
  p.quantity_delivered, p.quantity_pending_verification, p.created_at AS pledged_at,
  p.collected_at, p.delivered_at, p.cancelled_at, p.failed_at, p.cancellation_reason, p.notes AS pledge_notes,
  i.id AS item_id, i.item_name, i.item_category, i.unit, i.quantity_requested,
  rr.id AS request_id, rr.title AS request_title, rr.status AS request_status, rr.priority AS request_priority,
  rr.location_name AS dropoff_name, rr.address AS dropoff_address, rr.latitude AS dropoff_latitude,
  rr.longitude AS dropoff_longitude, rr.delivery_instructions,
  di.id AS incident_id, di.title AS incident_title, di.district AS incident_district,
  di.disaster_type, di.severity, di.status AS incident_status,
  dr.id AS donation_id, dr.status AS donation_status, dr.volunteer_id, dr.assigned_member_id, dr.assignment_mode,
  dr.pickup_location, dr.pickup_address_details, dr.pickup_date, dr.pickup_time, dr.pickup_time_slot,
  dr.contact_phone, dr.scheduled_at, dr.accepted_at, dr.completed_at, dr.is_deleted AS donation_deleted,
  donor.id AS donor_id, donor.name AS donor_name,
  vol.name AS volunteer_name, member.name AS member_name,
  (SELECT COUNT(*) FROM relief_pledge_reports r WHERE r.pledge_id = p.id AND r.status IN ('open', 'pending')) AS open_reports,
  (SELECT COUNT(*) FROM relief_pledge_reports r WHERE r.pledge_id = p.id AND r.status = 'open') AS open_issues
`;

function parseDetails(row) {
  if (!row) return row;
  if (row.pickup_address_details && typeof row.pickup_address_details === 'string') {
    try { row.pickup_address_details = JSON.parse(row.pickup_address_details); } catch { row.pickup_address_details = null; }
  }
  return row;
}

async function findByPledgeId(pledgeId, executor = pool) {
  const [rows] = await executor.query(`SELECT ${TASK_COLUMNS} ${TASK_FROM} WHERE p.id = :pledgeId`, { pledgeId });
  return parseDetails(rows[0] || null);
}

/** Pending, approved-request, open-incident tasks nobody has accepted yet. */
async function findAvailable({ limit = 200 } = {}) {
  const [rows] = await pool.query(
    `SELECT ${TASK_COLUMNS} ${TASK_FROM}
     WHERE p.status = 'pledged' AND dr.status = 'pending' AND dr.is_deleted = 0
       AND rr.status = 'approved' AND (rr.expires_at IS NULL OR rr.expires_at > NOW())
       AND di.status IN ('verified', 'active')
     ORDER BY FIELD(rr.priority, 'urgent', 'high', 'normal', 'low'), p.created_at ASC
     LIMIT :limit`,
    { limit }
  );
  return rows.map(parseDetails);
}

const GROUPS = {
  active: "dr.status IN ('accepted', 'scheduled', 'on_the_way', 'picked_up') AND p.status IN ('pledged', 'collected')",
  history: "(dr.status IN ('completed', 'cancelled') OR p.status IN ('delivered', 'partially_fulfilled', 'failed', 'cancelled'))",
};

/** Tasks assigned to this volunteer (individually or as the assigned team member). */
async function findMine(userId, { group, limit, offset }) {
  const groupSql = GROUPS[group] ? `AND ${GROUPS[group]}` : '';
  const [rows] = await pool.query(
    `SELECT ${TASK_COLUMNS} ${TASK_FROM}
     WHERE (dr.volunteer_id = :userId OR dr.assigned_member_id = :userId) ${groupSql}
     ORDER BY COALESCE(dr.scheduled_at, dr.pickup_time) ASC, p.id DESC LIMIT :limit OFFSET :offset`,
    { userId, limit, offset }
  );
  return rows.map(parseDetails);
}

async function countMine(userId, { group }) {
  const groupSql = GROUPS[group] ? `AND ${GROUPS[group]}` : '';
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total ${TASK_FROM}
     WHERE (dr.volunteer_id = :userId OR dr.assigned_member_id = :userId) ${groupSql}`,
    { userId }
  );
  return rows[0].total;
}

/** Admin overview of every relief task, optionally only those needing attention. */
async function findForAdmin({ attention, status, requestId }, { limit, offset }) {
  const conditions = ['1 = 1'];
  const params = { limit, offset };
  if (attention) conditions.push("(EXISTS (SELECT 1 FROM relief_pledge_reports r WHERE r.pledge_id = p.id AND r.status IN ('open', 'pending')))");
  if (status) { conditions.push('p.status = :status'); params.status = status; }
  if (requestId) { conditions.push('rr.id = :requestId'); params.requestId = requestId; }
  const [rows] = await pool.query(
    `SELECT ${TASK_COLUMNS} ${TASK_FROM} WHERE ${conditions.join(' AND ')}
     ORDER BY open_reports DESC, p.id DESC LIMIT :limit OFFSET :offset`,
    params
  );
  return rows.map(parseDetails);
}

async function countForAdmin({ attention, status, requestId }) {
  const conditions = ['1 = 1'];
  const params = {};
  if (attention) conditions.push("(EXISTS (SELECT 1 FROM relief_pledge_reports r WHERE r.pledge_id = p.id AND r.status IN ('open', 'pending')))");
  if (status) { conditions.push('p.status = :status'); params.status = status; }
  if (requestId) { conditions.push('rr.id = :requestId'); params.requestId = requestId; }
  const [rows] = await pool.query(`SELECT COUNT(*) AS total ${TASK_FROM} WHERE ${conditions.join(' AND ')}`, params);
  return rows[0].total;
}

/** Status history written by the donation trigger — the single source of lifecycle timestamps. */
async function findDonationHistory(donationId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT h.old_status, h.new_status, h.changed_at, u.name AS changed_by_name
     FROM donation_status_history h LEFT JOIN users u ON u.id = h.changed_by
     WHERE h.donation_request_id = :donationId ORDER BY h.changed_at ASC, h.id ASC`,
    { donationId }
  );
  return rows;
}

module.exports = {
  findByPledgeId, findAvailable, findMine, countMine, findForAdmin, countForAdmin, findDonationHistory,
};
