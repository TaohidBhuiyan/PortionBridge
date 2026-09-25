/**
 * seedVolunteerLocations.js
 * Seeds realistic Dhaka-area lat/lng + availability for existing volunteers
 * and teams so the Discover Volunteers map shows markers correctly.
 *
 * Run once: node scripts/seedVolunteerLocations.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

// Dhaka-area locations spread across the city
const DHAKA_LOCATIONS = [
  { lat: 23.8103,  lng: 90.4125,  area: 'Dhaka Central (Motijheel)' },
  { lat: 23.7461,  lng: 90.3742,  area: 'Dhanmondi' },
  { lat: 23.7935,  lng: 90.4066,  area: 'Gulshan 1' },
  { lat: 23.7949,  lng: 90.4143,  area: 'Gulshan 2' },
  { lat: 23.7506,  lng: 90.3978,  area: 'Kalabagan' },
  { lat: 23.8069,  lng: 90.3687,  area: 'Mirpur 10' },
  { lat: 23.8687,  lng: 90.3996,  area: 'Uttara Sector 7' },
  { lat: 23.7271,  lng: 90.4093,  area: 'Rayer Bazar / Mohammadpur' },
  { lat: 23.7772,  lng: 90.3994,  area: 'Shyamoli' },
  { lat: 23.7340,  lng: 90.3840,  area: 'Jigatola' },
  { lat: 23.7643,  lng: 90.3888,  area: 'Panthapath' },
  { lat: 23.7200,  lng: 90.4050,  area: 'Hazaribagh' },
  { lat: 23.7560,  lng: 90.3865,  area: 'Elephant Road' },
  { lat: 23.8200,  lng: 90.3650,  area: 'Mirpur 1' },
  { lat: 23.7900,  lng: 90.4300,  area: 'Banasree' },
  { lat: 23.8103,  lng: 90.4550,  area: 'Rampura' },
  { lat: 23.7700,  lng: 90.4200,  area: 'Malibagh' },
  { lat: 23.7450,  lng: 90.4350,  area: 'Basabo' },
  { lat: 23.8260,  lng: 90.4156,  area: 'Kurmitola' },
  { lat: 23.7980,  lng: 90.3750,  area: 'Kafrul' },
];

// Team locations (city hubs)
const TEAM_LOCATIONS = [
  { lat: 23.8103, lng: 90.4125, area: 'Motijheel Hub' },
  { lat: 23.7461, lng: 90.3742, area: 'Dhanmondi Hub' },
  { lat: 23.7949, lng: 90.4143, area: 'Gulshan Hub' },
  { lat: 23.8069, lng: 90.3687, area: 'Mirpur Hub' },
  { lat: 23.8687, lng: 90.3996, area: 'Uttara Hub' },
  { lat: 23.7772, lng: 90.3994, area: 'Shyamoli Hub' },
  { lat: 23.7200, lng: 90.4050, area: 'Hazaribagh Hub' },
];

// Realistic availability schedules
const AVAILABILITY_OPTIONS = [
  { weekdays: ['monday', 'wednesday', 'friday'], timeSlots: ['morning', 'afternoon'] },
  { weekdays: ['tuesday', 'thursday', 'saturday'], timeSlots: ['afternoon', 'evening'] },
  { weekdays: ['saturday', 'sunday'], timeSlots: ['morning', 'afternoon', 'evening'] },
  { weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], timeSlots: ['evening'] },
  { weekdays: ['friday', 'saturday', 'sunday'], timeSlots: ['morning'] },
];

async function seed() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'portionbridge',
    namedPlaceholders: true,
  });

  try {
    // --- Volunteers ---
    const [volunteers] = await pool.query(
      `SELECT u.id, vp.user_id AS vp_exists
       FROM users u
       LEFT JOIN volunteer_profiles vp ON u.id = vp.user_id
       WHERE u.role = 'volunteer'
       ORDER BY u.id`
    );

    console.log(`Seeding ${volunteers.length} volunteers with location + availability...`);
    for (let i = 0; i < volunteers.length; i++) {
      const v            = volunteers[i];
      const loc          = DHAKA_LOCATIONS[i % DHAKA_LOCATIONS.length];
      const availability = AVAILABILITY_OPTIONS[i % AVAILABILITY_OPTIONS.length];

      // Add ±0.002° jitter so markers don't perfectly overlap
      const lat = loc.lat + (Math.random() - 0.5) * 0.004;
      const lng = loc.lng + (Math.random() - 0.5) * 0.004;

      if (v.vp_exists) {
        await pool.query(
          `UPDATE volunteer_profiles
              SET latitude             = :lat,
                  longitude            = :lng,
                  coverage_radius      = :radius,
                  base_address         = :addr,
                  is_online            = :online,
                  availability         = :availability,
                  last_location_update = NOW()
            WHERE user_id = :userId`,
          {
            lat,
            lng,
            radius:       10 + (i % 5) * 5,
            addr:         loc.area,
            online:       i % 3 === 0 ? 1 : 0,
            availability: JSON.stringify(availability),
            userId:       v.id,
          }
        );
      } else {
        await pool.query(
          `INSERT INTO volunteer_profiles
             (user_id, latitude, longitude, coverage_radius, base_address, is_online, availability, last_location_update)
           VALUES (:userId, :lat, :lng, :radius, :addr, :online, :availability, NOW())
           ON DUPLICATE KEY UPDATE
             latitude             = VALUES(latitude),
             longitude            = VALUES(longitude),
             coverage_radius      = VALUES(coverage_radius),
             base_address         = VALUES(base_address),
             is_online            = VALUES(is_online),
             availability         = VALUES(availability),
             last_location_update = VALUES(last_location_update)`,
          {
            userId:       v.id,
            lat,
            lng,
            radius:       10 + (i % 5) * 5,
            addr:         loc.area,
            online:       i % 3 === 0 ? 1 : 0,
            availability: JSON.stringify(availability),
          }
        );
      }

      console.log(`  ✓ Volunteer #${v.id} → ${loc.area} (${lat.toFixed(4)}, ${lng.toFixed(4)}) | online=${i % 3 === 0 ? 'yes' : 'no'}`);
    }

    // --- Teams ---
    const [teams] = await pool.query(
      `SELECT id, name FROM teams ORDER BY id`
    );

    console.log(`\nSeeding ${teams.length} teams...`);
    for (let i = 0; i < teams.length; i++) {
      const t   = teams[i];
      const loc = TEAM_LOCATIONS[i % TEAM_LOCATIONS.length];

      const lat = loc.lat + (Math.random() - 0.5) * 0.006;
      const lng = loc.lng + (Math.random() - 0.5) * 0.006;

      await pool.query(
        `UPDATE teams
            SET latitude        = :lat,
                longitude       = :lng,
                coverage_radius = :radius,
                base_address    = :addr
          WHERE id = :teamId`,
        {
          lat,
          lng,
          radius: 15 + (i % 4) * 5,
          addr:   loc.area,
          teamId: t.id,
        }
      );

      console.log(`  ✓ Team #${t.id} "${t.name}" → ${loc.area} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }

    console.log('\n✅  Done! Volunteer and team locations + availability have been seeded.');
    console.log('   Volunteers will now appear on the Discover Volunteers map.');
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
