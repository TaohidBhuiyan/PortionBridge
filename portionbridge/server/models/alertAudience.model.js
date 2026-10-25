const { pool } = require('../config/db');
const { RELIEF } = require('../constants');

/**
 * Recipient resolution for an alert event — ONE set-based query per page of users,
 * never a per-user loop. Several rules can match the same person; they are OR-ed in a
 * single WHERE clause over `users`, so a user appears at most once (no duplicate
 * deliveries). The notifications UNIQUE (user_id, alert_event_id) key is the second,
 * database-level guarantee.
 *
 * Audience modes
 *   targeted — issued / updated / escalated / area_expanded / relief_update
 *     1. MANDATORY   scope nationwide AND severity critical -> every active donor & volunteer
 *                    (optional personalisation is deliberately ignored; see docs).
 *     2. NATIONWIDE  scope nationwide -> users with nationwide alerts on (default on) whose
 *                    severity floor / category filter accept the alert.
 *     3. NEARBY      any scope -> users with nearby alerts on whose filters accept the alert and
 *                    either a preferred district is one of the alert's districts, or their coarse
 *                    alert centre (volunteers: base location as fallback) is within
 *                    LEAST(their radius, alert radius) km of the incident coordinates.
 *     4. INVOLVED    donors with an open pledge / volunteers on an active relief task for the
 *                    incident (they have a direct stake, whatever their preferences).
 *   prior — correction / resolved / cancelled
 *     5. PRIOR       everyone who already received a notification for this alert, so a correction
 *                    reaches exactly the people the original reached.
 *     4. INVOLVED    (not for 'cancelled')
 */

const SEV_ORDER = RELIEF.ALERT.SEVERITY_ORDER.map((s) => `'${s}'`).join(', ');
const CATEGORY_TYPES = ['flood', 'flash_flood', 'fire', 'building_collapse', 'earthquake', 'cyclone', 'storm', 'other'];

const PREFS_OK = `(
  COALESCE(p.in_app_enabled, 1) = 1
  AND FIELD(:sev, ${SEV_ORDER}) >= FIELD(COALESCE(p.min_severity, 'low'), ${SEV_ORDER})
  AND (
    NOT EXISTS (SELECT 1 FROM disaster_alert_pref_categories c WHERE c.user_id = u.id)
    OR EXISTS (SELECT 1 FROM disaster_alert_pref_categories c WHERE c.user_id = u.id AND c.disaster_type = :type)
  )
)`;

const INVOLVED = `(
  EXISTS (
    SELECT 1 FROM relief_pledges rp
      JOIN relief_request_items ri ON ri.id = rp.relief_request_item_id
      JOIN relief_requests rr ON rr.id = ri.relief_request_id
     WHERE rr.incident_id = :incidentId AND rp.donor_id = u.id AND rp.status IN ('pledged', 'collected')
  )
  OR EXISTS (
    SELECT 1 FROM relief_pledges rp
      JOIN relief_request_items ri ON ri.id = rp.relief_request_item_id
      JOIN relief_requests rr ON rr.id = ri.relief_request_id
      JOIN donation_requests dr ON dr.id = rp.donation_request_id
     WHERE rr.incident_id = :incidentId AND rp.status IN ('pledged', 'collected')
       AND (dr.volunteer_id = u.id OR dr.assigned_member_id = u.id)
  )
)`;

const PRIOR = `EXISTS (
  SELECT 1 FROM notifications pn JOIN disaster_alert_events pe ON pe.id = pn.alert_event_id
   WHERE pe.alert_id = :alertId AND pn.user_id = u.id
)`;

/**
 * @param {Object} a
 * @param {Object} a.alert      disaster_alerts row (scope, severity, radius_km, id)
 * @param {Object} a.incident   disaster_incidents row (id, disaster_type, latitude, longitude)
 * @param {string[]} a.districts target districts of the alert
 * @param {string} a.eventType
 */
function buildWhere({ alert, incident, districts, eventType }) {
  const params = {
    sev: alert.severity,
    type: CATEGORY_TYPES.includes(incident.disaster_type) ? incident.disaster_type : 'other',
    incidentId: incident.id,
    alertId: alert.id,
  };
  const rules = [];

  if (['correction', 'resolved', 'cancelled'].includes(eventType)) {
    rules.push(PRIOR);
    if (eventType !== 'cancelled') rules.push(INVOLVED);
  } else {
    if (alert.scope === 'nationwide') {
      if (alert.severity === 'critical') rules.push('1 = 1'); // mandatory critical nationwide policy
      else rules.push(`(COALESCE(p.nationwide_enabled, 1) = 1 AND ${PREFS_OK})`);
    }

    const nearby = [];
    if (districts.length) {
      const names = districts.map((d, i) => { params[`dist${i}`] = d; return `:dist${i}`; });
      nearby.push(`EXISTS (SELECT 1 FROM disaster_alert_pref_districts d WHERE d.user_id = u.id AND d.district IN (${names.join(', ')}))`);
    }
    const lat = incident.latitude === null || incident.latitude === undefined ? null : Number(incident.latitude);
    const lng = incident.longitude === null || incident.longitude === undefined ? null : Number(incident.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      params.lat = lat;
      params.lng = lng;
      params.alertRadius = alert.radius_km ?? 100000;
      params.defaultRadius = RELIEF.ALERT.DEFAULT_RADIUS_KM;
      nearby.push(`(
        COALESCE(p.center_latitude, vp.latitude) IS NOT NULL AND COALESCE(p.center_longitude, vp.longitude) IS NOT NULL
        AND 6371 * ACOS(LEAST(1, GREATEST(-1,
              COS(RADIANS(:lat)) * COS(RADIANS(COALESCE(p.center_latitude, vp.latitude)))
              * COS(RADIANS(COALESCE(p.center_longitude, vp.longitude)) - RADIANS(:lng))
            + SIN(RADIANS(:lat)) * SIN(RADIANS(COALESCE(p.center_latitude, vp.latitude)))
        ))) <= LEAST(COALESCE(p.radius_km, :defaultRadius), :alertRadius)
      )`);
    }
    if (nearby.length) rules.push(`(COALESCE(p.nearby_enabled, 1) = 1 AND ${PREFS_OK} AND (${nearby.join(' OR ')}))`);

    rules.push(INVOLVED);
  }

  const where = `u.role IN ('donor', 'volunteer') AND u.is_deleted = 0 AND u.is_banned = 0 AND (${rules.join(' OR ')})`;
  return { where, params };
}

const FROM = `
  FROM users u
  LEFT JOIN disaster_alert_preferences p ON p.user_id = u.id
  LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id AND u.role = 'volunteer'
`;

/** One page of recipient ids (keyset pagination on users.id, so memory stays flat). */
async function findRecipientPage(ctx, { afterId = 0, pageSize = 500 } = {}) {
  const { where, params } = buildWhere(ctx);
  const [rows] = await pool.query(
    `SELECT u.id ${FROM} WHERE ${where} AND u.id > :afterId ORDER BY u.id ASC LIMIT :pageSize`,
    { ...params, afterId, pageSize }
  );
  return rows.map((r) => r.id);
}

/** Exact audience size for the admin preview (counts people, writes nothing). */
async function countRecipients(ctx) {
  const { where, params } = buildWhere(ctx);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total ${FROM} WHERE ${where}`, params);
  return Number(rows[0].total);
}

module.exports = { findRecipientPage, countRecipients };
