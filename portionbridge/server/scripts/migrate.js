const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const database = process.env.DB_NAME || 'portionbridge';
const migrationsDirectory = path.join(__dirname, '..', '..', 'database');

const migrations = [
  {
    id: '002_auth_security',
    file: 'migration_002_auth_security.sql',
    checks: [
      ['column', 'users', 'email_verified'],
      ['column', 'users', 'failed_login_attempts'],
      ['column', 'users', 'lock_until'],
      ['table', 'email_verifications'],
      ['table', 'password_history'],
      ['table', 'refresh_tokens'],
      ['table', 'audit_logs'],
    ],
  },
  { id: '003_donation_accept', file: 'migration_003_donation_accept.sql', checks: [['column', 'donation_requests', 'accepted_at']] },
  { id: '004_donation_scheduled_status', file: 'migration_004_donation_scheduled_status.sql', checks: [['enumValue', 'donation_requests', 'status', 'scheduled']] },
  { id: '005_complete_donation', file: 'migration_005_complete_donation.sql', checks: [['column', 'donation_requests', 'completed_at']] },
  {
    id: '006_status_flow_ratings_reports',
    file: 'migration_006_status_flow_ratings_reports.sql',
    checks: [
      ['column', 'reports', 'details'],
      ['index', 'reports', 'uq_reports_reporter_donation'],
    ],
  },
];

async function checkRequirement(connection, [type, table, value, extra]) {
  if (type === 'table') {
    const [rows] = await connection.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ? LIMIT 1`,
      [database, table]
    );
    return rows.length > 0;
  }

  if (type === 'column' || type === 'enumValue') {
    const [rows] = await connection.query(
      `SELECT column_type FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ? AND column_name = ? LIMIT 1`,
      [database, table, value]
    );
    return type === 'column' ? rows.length > 0 : rows[0]?.column_type.includes(`'${extra || 'scheduled'}'`);
  }

  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.statistics
     WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1`,
    [database, table, value]
  );
  return rows.length > 0;
}

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database,
    port: Number(process.env.DB_PORT || 3306),
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    for (const migration of migrations) {
      const [applied] = await connection.query('SELECT 1 FROM schema_migrations WHERE id = ? LIMIT 1', [migration.id]);
      if (applied.length > 0) {
        console.log(`[Migrate] ${migration.id} already recorded.`);
        continue;
      }

      const checks = await Promise.all(migration.checks.map((check) => checkRequirement(connection, check)));
      if (checks.every(Boolean)) {
        await connection.query('INSERT INTO schema_migrations (id) VALUES (?)', [migration.id]);
        console.log(`[Migrate] ${migration.id} already present in baseline schema; recorded.`);
        continue;
      }

      if (checks.some(Boolean)) {
        throw new Error(`Migration ${migration.id} is only partially applied. Resolve the partial schema state before retrying.`);
      }

      const sql = fs.readFileSync(path.join(migrationsDirectory, migration.file), 'utf8');
      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (id) VALUES (?)', [migration.id]);
      console.log(`[Migrate] Applied ${migration.id}.`);
    }
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error('[Migrate] Failed:', error.message);
  process.exit(1);
});
