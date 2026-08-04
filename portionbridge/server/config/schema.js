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
  const foundTables = new Set(tables.map((row) => row.table_name));
  const missingTables = REQUIRED_TABLES.filter((table) => !foundTables.has(table));

  const [columns] = await pool.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = :database`,
    { database }
  );
  const foundColumns = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
  const missingColumns = Object.entries(REQUIRED_COLUMNS).flatMap(([table, names]) =>
    names.filter((name) => !foundColumns.has(`${table}.${name}`)).map((name) => `${table}.${name}`)
  );

  const [indexes] = await pool.query(
    `SELECT table_name, index_name FROM information_schema.statistics
     WHERE table_schema = :database`,
    { database }
  );
  const foundIndexes = new Set(indexes.map((row) => `${row.table_name}.${row.index_name}`));
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
