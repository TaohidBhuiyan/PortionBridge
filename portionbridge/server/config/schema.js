const { pool } = require('./db');

const REQUIRED_TABLES = [
  'users',
  'email_verifications',
  'password_history',
  'refresh_tokens',
  'audit_logs',
  'donation_requests',
  'reports',
  'saved_addresses',
  'user_preferences',
  'notification_settings',
  'volunteer_profiles',
];

const REQUIRED_COLUMNS = {
  users: ['email_verified', 'failed_login_attempts', 'lock_until', 'last_login_at', 'last_login_ip', 'last_user_agent', 'date_of_birth', 'gender', 'phone_verified', 'provider', 'google_id', 'profile_picture'],
  donation_requests: ['accepted_at', 'completed_at', 'scheduled_at'],
  reports: ['details'],
};

const REQUIRED_INDEXES = {
  reports: ['uq_reports_reporter_donation'],
};

/**
 * MySQL's information_schema always returns result columns as TABLE_NAME /
 * COLUMN_NAME / INDEX_NAME (uppercase) regardless of the case used for the
 * alias in the query — this is server behavior, not a driver quirk, and it
 * does not follow the lower_case_table_names setting used for ordinary
 * tables. Reading row.table_name (lowercase) against that result silently
 * returns undefined for every row, which previously made every table/
 * column/index look "missing" on every real MySQL 8.0 server and made
 * validateDatabaseSchema() fail startup unconditionally. Normalizing keys
 * to lowercase here makes the lookup resilient to that casing regardless
 * of server/driver version.
 * @param {Object} row - A row from an information_schema query
 * @param {string} key - Column name to read, in any case
 * @returns {*} The value for that column
 */
function readCaseInsensitive(row, key) {
  if (key in row) return row[key];
  const upper = key.toUpperCase();
  if (upper in row) return row[upper];
  const lower = key.toLowerCase();
  return row[lower];
}

/**
 * Fails startup before HTTP begins serving when the selected database is not
 * at the schema level required by the running application.
 */
async function validateDatabaseSchema() {
  const database = process.env.DB_NAME || 'portionbridge';
  const [tables] = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = :database`,
    { database }
  );
  const foundTables = new Set(tables.map((row) => readCaseInsensitive(row, 'table_name')));
  const missingTables = REQUIRED_TABLES.filter((table) => !foundTables.has(table));

  const [columns] = await pool.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = :database`,
    { database }
  );
  const foundColumns = new Set(
    columns.map((row) => `${readCaseInsensitive(row, 'table_name')}.${readCaseInsensitive(row, 'column_name')}`)
  );
  const missingColumns = Object.entries(REQUIRED_COLUMNS).flatMap(([table, names]) =>
    names.filter((name) => !foundColumns.has(`${table}.${name}`)).map((name) => `${table}.${name}`)
  );

  const [indexes] = await pool.query(
    `SELECT table_name, index_name FROM information_schema.statistics
     WHERE table_schema = :database`,
    { database }
  );
  const foundIndexes = new Set(
    indexes.map((row) => `${readCaseInsensitive(row, 'table_name')}.${readCaseInsensitive(row, 'index_name')}`)
  );
  const missingIndexes = Object.entries(REQUIRED_INDEXES).flatMap(([table, names]) =>
    names.filter((name) => !foundIndexes.has(`${table}.${name}`)).map((name) => `${table}.${name}`)
  );

  if (missingTables.length || missingColumns.length || missingIndexes.length) {
    const details = [
      missingTables.length && `tables: ${missingTables.join(', ')}`,
      missingColumns.length && `columns: ${missingColumns.join(', ')}`,
      missingIndexes.length && `indexes: ${missingIndexes.join(', ')}`,
    ].filter(Boolean).join('; ');
    throw new Error(`Database schema is incomplete (${details}). Run \"npm run migrate\" after importing database/portionbridge_schema.sql.`);
  }
}

module.exports = { validateDatabaseSchema };
