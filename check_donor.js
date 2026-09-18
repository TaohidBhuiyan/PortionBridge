const { pool } = require('./portionbridge/server/config/db');

(async () => {
  try {
    // Check donor 216
    const [users] = await pool.query('SELECT id, name, email, role, phone, address FROM users WHERE id = 216');
    console.log('Donor 216:', JSON.stringify(users, null, 2));

    // Check donor 216's saved addresses
    const [addresses] = await pool.query('SELECT * FROM saved_addresses WHERE user_id = 216');
    console.log('Donor 216 saved addresses:', JSON.stringify(addresses, null, 2));

    // Check existing volunteers
    const [volunteers] = await pool.query('SELECT id, name, email, role, phone, address FROM users WHERE role = "volunteer" AND is_deleted = 0 LIMIT 10');
    console.log('Existing volunteers:', JSON.stringify(volunteers, null, 2));

    // Check existing donations for donor 216
    const [donations] = await pool.query('SELECT id, title, status, created_at FROM donation_requests WHERE donor_id = 216');
    console.log('Donor 216 existing donations:', JSON.stringify(donations, null, 2));

  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();