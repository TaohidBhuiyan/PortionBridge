/**
 * Quick test: does the discovery API return volunteers near Kurmitola?
 * (Donor Taohid's location: 23.82617977, 90.4155552)
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const DONOR_LAT = 23.82617977;
const DONOR_LNG = 90.4155552;
const RADIUS_KM  = 20;

async function test() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'portionbridge',
    namedPlaceholders: true,
  });

  const distanceFormula = `
    (6371 * ACOS(
      COS(RADIANS(:lat)) * COS(RADIANS(vp.latitude)) *
      COS(RADIANS(vp.longitude) - RADIANS(:lng)) +
      SIN(RADIANS(:lat)) * SIN(RADIANS(vp.latitude))
    ))
  `;

  const [volunteers] = await pool.query(
    `SELECT
       u.id, u.name, vp.latitude, vp.longitude, vp.is_online,
       vp.base_address, vp.availability,
       ${distanceFormula} AS distance
     FROM users u
     INNER JOIN volunteer_profiles vp ON u.id = vp.user_id
     WHERE u.is_deleted = 0
       AND u.is_banned  = 0
       AND u.role       = 'volunteer'
       AND vp.latitude  IS NOT NULL
       AND vp.longitude IS NOT NULL
       AND vp.availability IS NOT NULL
     HAVING distance <= :radius
     ORDER BY distance ASC
     LIMIT 10`,
    { lat: DONOR_LAT, lng: DONOR_LNG, radius: RADIUS_KM }
  );

  console.log(`\n=== Volunteers within ${RADIUS_KM} km of Kurmitola ===`);
  console.log(`Found: ${volunteers.length}`);
  console.table(volunteers.map(v => ({
    id:      v.id,
    name:    v.name,
    dist_km: Number(v.distance).toFixed(2),
    online:  v.is_online,
    area:    v.base_address,
  })));

  const [teams] = await pool.query(
    `SELECT
       t.id, t.name, t.latitude, t.longitude, t.base_address,
       ${distanceFormula.replace(/vp\./g, 't.')} AS distance
     FROM teams t
     WHERE t.latitude  IS NOT NULL
       AND t.longitude IS NOT NULL
     HAVING distance <= :radius
     ORDER BY distance ASC
     LIMIT 10`,
    { lat: DONOR_LAT, lng: DONOR_LNG, radius: RADIUS_KM }
  );

  console.log(`\n=== Teams within ${RADIUS_KM} km of Kurmitola ===`);
  console.log(`Found: ${teams.length}`);
  console.table(teams.map(t => ({
    id:      t.id,
    name:    t.name,
    dist_km: Number(t.distance).toFixed(2),
    area:    t.base_address,
  })));

  await pool.end();
}

test().catch(console.error);
