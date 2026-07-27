const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'portionbridge',
  port: process.env.DB_PORT || 3306,
  namedPlaceholders: true, // Necessary for named parameters (:email, :id) in queries
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

let connection;

async function connect() {
  if (connection) return connection;
  connection = await pool.getConnection();
  return connection;
}

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    console.log(`[DB] Connected to MySQL database "${process.env.DB_NAME || 'portionbridge'}" successfully.`);
    conn.release();
    return true;
  } catch (error) {
    console.error('[DB] Database connection test failed:', error.message);
    return false;
  }
}

module.exports = { connect, testConnection, pool };
