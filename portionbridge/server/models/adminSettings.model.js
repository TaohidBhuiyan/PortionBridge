const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `admin_settings` table.
 */

function parseSettingValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

async function getAll() {
  const [rows] = await pool.query(`SELECT setting_key, setting_value FROM admin_settings`);
  const settings = {};
  for (const row of rows) {
    settings[row.setting_key] = parseSettingValue(row.setting_value);
  }
  return settings;
}

async function get(key) {
  const [rows] = await pool.query(
    `SELECT setting_value FROM admin_settings WHERE setting_key = :key LIMIT 1`,
    { key }
  );
  return rows.length ? parseSettingValue(rows[0].setting_value) : null;
}

async function set(key, value) {
  await pool.query(
    `INSERT INTO admin_settings (setting_key, setting_value)
     VALUES (:key, :value)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    { key, value: JSON.stringify(value) }
  );
}

async function setMultiple(settingsObject) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const [key, value] of Object.entries(settingsObject)) {
      await connection.query(
        `INSERT INTO admin_settings (setting_key, setting_value)
         VALUES (:key, :value)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        { key, value: JSON.stringify(value) }
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getAll,
  get,
  set,
  setMultiple,
};
