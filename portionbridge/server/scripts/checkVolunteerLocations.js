const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function check() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portionbridge',
    namedPlaceholders: true,
  });

  const [volunteers] = await pool.query(
    `SELECT u.id, u.name, u.role, vp.latitude, vp.longitude, vp.base_address, vp.is_online, vp.coverage_radius
     FROM users u
     LEFT JOIN volunteer_profiles vp ON u.id = vp.user_id
     WHERE u.role = 'volunteer'
     LIMIT 20`
  );
  console.log('\n=== VOLUNTEERS ===');
  console.log('Total volunteers:', volunteers.length);
  console.table(volunteers.map(v => ({
    id: v.id,
    name: v.name,
    lat: v.latitude,
    lng: v.longitude,
    online: v.is_online,
    radius: v.coverage_radius,
    base: v.base_address ? v.base_address.slice(0, 40) : null
  })));

  const [teams] = await pool.query(
    `SELECT t.id, t.name, t.latitude, t.longitude, t.base_address, COUNT(tm.user_id) as members
     FROM teams t
     LEFT JOIN team_members tm ON t.id = tm.team_id
     GROUP BY t.id
     LIMIT 10`
  );
  console.log('\n=== TEAMS ===');
  console.log('Total teams:', teams.length);
  console.table(teams.map(t => ({
    id: t.id,
    name: t.name,
    lat: t.latitude,
    lng: t.longitude,
    members: t.members
  })));

  await pool.end();
}

check().catch(console.error);
