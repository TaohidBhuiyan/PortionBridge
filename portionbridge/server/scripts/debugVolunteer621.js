const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const DONOR_LAT = 23.82617977;
const DONOR_LNG = 90.4155552;

async function check() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portionbridge',
    namedPlaceholders: true,
  });

  const [rows] = await pool.query(
    `SELECT
       u.id, u.name, u.role, u.is_deleted, u.is_banned,
       vp.user_id AS vp_exists,
       vp.latitude, vp.longitude, vp.is_online,
       vp.coverage_radius, vp.base_address,
       vp.availability,
       vp.skills,
       (6371 * ACOS(
         COS(RADIANS(:lat)) * COS(RADIANS(vp.latitude)) *
         COS(RADIANS(vp.longitude) - RADIANS(:lng)) +
         SIN(RADIANS(:lat)) * SIN(RADIANS(vp.latitude))
       )) AS distance_from_donor
     FROM users u
     LEFT JOIN volunteer_profiles vp ON u.id = vp.user_id
     WHERE u.id = 621`,
    { lat: DONOR_LAT, lng: DONOR_LNG }
  );

  if (!rows.length) {
    console.log('❌ User #621 not found in DB!');
  } else {
    const v = rows[0];
    console.log('\n=== Volunteer #621 Full Details ===');
    console.log('Name:          ', v.name);
    console.log('Role:          ', v.role);
    console.log('is_deleted:    ', v.is_deleted);
    console.log('is_banned:     ', v.is_banned);
    console.log('vp_exists:     ', v.vp_exists ? 'YES' : 'NO');
    console.log('latitude:      ', v.latitude);
    console.log('longitude:     ', v.longitude);
    console.log('is_online:     ', v.is_online);
    console.log('coverage_radius:', v.coverage_radius);
    console.log('base_address:  ', v.base_address);
    console.log('availability:  ', v.availability);
    console.log('skills:        ', v.skills);
    console.log('distance_km:   ', v.distance_from_donor != null ? Number(v.distance_from_donor).toFixed(2) : 'N/A (no lat/lng)');

    console.log('\n=== Discovery Filter Checks ===');
    console.log('✓ role = volunteer?      ', v.role === 'volunteer' ? '✅' : '❌');
    console.log('✓ is_deleted = 0?        ', v.is_deleted === 0 ? '✅' : '❌');
    console.log('✓ is_banned = 0?         ', v.is_banned === 0 ? '✅' : '❌');
    console.log('✓ latitude IS NOT NULL?  ', v.latitude != null ? '✅' : '❌ latitude is NULL');
    console.log('✓ longitude IS NOT NULL? ', v.longitude != null ? '✅' : '❌ longitude is NULL');
    console.log('✓ availability NOT NULL? ', v.availability != null ? '✅' : '❌ availability is NULL — filtered out by availableOnly=true!');
    if (v.distance_from_donor != null) {
      const dist = Number(v.distance_from_donor);
      console.log(`✓ within 10km?           `, dist <= 10 ? `✅ (${dist.toFixed(2)} km)` : `❌ too far (${dist.toFixed(2)} km)`);
      console.log(`✓ within 20km?           `, dist <= 20 ? `✅ (${dist.toFixed(2)} km)` : `❌ too far (${dist.toFixed(2)} km)`);
    }
  }

  await pool.end();
}

check().catch(console.error);
