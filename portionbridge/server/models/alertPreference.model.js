const { pool } = require('../config/db');

/**
 * Data access for per-user disaster-alert preferences. A user WITHOUT a row simply
 * has the defaults (see DEFAULTS) — nothing is written until the user saves a change.
 */

const DEFAULTS = Object.freeze({
  nearbyEnabled: true,
  nationwideEnabled: true,
  inAppEnabled: true,
  minSeverity: 'low',
  radiusKm: null,
  centerLatitude: null,
  centerLongitude: null,
  districts: [],
  categories: [],
});

async function findByUserId(userId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM disaster_alert_preferences WHERE user_id = :userId', { userId });
  if (!rows[0]) return null;
  const [districts] = await executor.query('SELECT district FROM disaster_alert_pref_districts WHERE user_id = :userId ORDER BY district', { userId });
  const [categories] = await executor.query('SELECT disaster_type FROM disaster_alert_pref_categories WHERE user_id = :userId ORDER BY disaster_type', { userId });
  const r = rows[0];
  return {
    nearbyEnabled: Boolean(r.nearby_enabled),
    nationwideEnabled: Boolean(r.nationwide_enabled),
    inAppEnabled: Boolean(r.in_app_enabled),
    minSeverity: r.min_severity,
    radiusKm: r.radius_km,
    centerLatitude: r.center_latitude === null ? null : Number(r.center_latitude),
    centerLongitude: r.center_longitude === null ? null : Number(r.center_longitude),
    districts: districts.map((d) => d.district),
    categories: categories.map((c) => c.disaster_type),
    updatedAt: r.updated_at,
  };
}

/** Replaces the whole preference set for a user inside the caller's transaction. */
async function saveAll(userId, prefs, connection) {
  await connection.query(
    `INSERT INTO disaster_alert_preferences
       (user_id, nearby_enabled, nationwide_enabled, in_app_enabled, min_severity, radius_km, center_latitude, center_longitude)
     VALUES (:userId, :nearbyEnabled, :nationwideEnabled, :inAppEnabled, :minSeverity, :radiusKm, :centerLatitude, :centerLongitude)
     ON DUPLICATE KEY UPDATE
       nearby_enabled = VALUES(nearby_enabled), nationwide_enabled = VALUES(nationwide_enabled),
       in_app_enabled = VALUES(in_app_enabled), min_severity = VALUES(min_severity), radius_km = VALUES(radius_km),
       center_latitude = VALUES(center_latitude), center_longitude = VALUES(center_longitude)`,
    {
      userId,
      nearbyEnabled: prefs.nearbyEnabled ? 1 : 0,
      nationwideEnabled: prefs.nationwideEnabled ? 1 : 0,
      inAppEnabled: prefs.inAppEnabled ? 1 : 0,
      minSeverity: prefs.minSeverity,
      radiusKm: prefs.radiusKm,
      centerLatitude: prefs.centerLatitude,
      centerLongitude: prefs.centerLongitude,
    }
  );

  await connection.query('DELETE FROM disaster_alert_pref_districts WHERE user_id = :userId', { userId });
  if (prefs.districts.length) {
    const params = { userId };
    const values = prefs.districts.map((d, i) => { params[`d${i}`] = d; return `(:userId, :d${i})`; });
    await connection.query(`INSERT INTO disaster_alert_pref_districts (user_id, district) VALUES ${values.join(', ')}`, params);
  }

  await connection.query('DELETE FROM disaster_alert_pref_categories WHERE user_id = :userId', { userId });
  if (prefs.categories.length) {
    const params = { userId };
    const values = prefs.categories.map((c, i) => { params[`c${i}`] = c; return `(:userId, :c${i})`; });
    await connection.query(`INSERT INTO disaster_alert_pref_categories (user_id, disaster_type) VALUES ${values.join(', ')}`, params);
  }
}

module.exports = { DEFAULTS, findByUserId, saveAll };
