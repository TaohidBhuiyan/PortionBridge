const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const database = process.env.DB_NAME || 'portionbridge';
const migrationsDirectory = path.join(__dirname, '..', '..', 'database', 'migrations');

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
  {
    id: '012_google_auth_enhancements',
    file: 'migration_012_google_auth_enhancements.sql',
    checks: [
      ['column', 'users', 'provider'],
      ['column', 'users', 'google_id'],
      ['column', 'users', 'profile_picture'],
    ],
  },
  {
    id: 'migration_013_service_areas_fix',
    file: 'migration_013_service_areas_fix.sql',
    checks: [['column', 'volunteer_profiles', 'service_areas']],
  },
  {
    id: 'migration_014_admin_announcement_type',
    file: 'migration_014_admin_announcement_type.sql',
    checks: [['enumValue', 'notifications', 'type', 'admin_announcement']],
  },
  {
    id: 'migration_015_report_moderation_fields',
    file: 'migration_015_report_moderation_fields.sql',
    checks: [
      ['enumValue', 'reports', 'status', 'dismissed'],
      ['column', 'reports', 'resolution_notes'],
      ['column', 'reports', 'resolved_by'],
      ['column', 'reports', 'resolved_at'],
    ],
  },
  {
    id: 'migration_016_donation_cancelled_status',
    file: 'migration_016_donation_cancelled_status.sql',
    checks: [['enumValue', 'donation_requests', 'status', 'cancelled']],
  },
  {
    id: 'migration_017_leaderboard_opt_out',
    file: 'migration_017_leaderboard_opt_out.sql',
    checks: [['column', 'users', 'show_on_leaderboard']],
  },
  {
    id: 'migration_018_notification_templates',
    file: 'migration_018_notification_templates.sql',
    checks: [['table', 'notification_templates']],
  },
  {
    id: 'migration_019_recurring_donations',
    file: 'migration_019_recurring_donations.sql',
    checks: [['table', 'recurring_donations']],
  },
  {
    id: 'migration_020_volunteer_team_base_location',
    file: 'migration_020_volunteer_team_base_location.sql',
    checks: [
      ['column', 'volunteer_profiles', 'base_address'],
      ['column', 'teams', 'base_address'],
    ],
  },
  {
    id: 'migration_021_fix_volunteer_leaderboard_team_credits',
    file: 'migration_021_fix_volunteer_leaderboard_team_credits.sql',
    checks: [['index', 'top_volunteers', 'top_volunteers']], // View exists check
  },
  {
    id: 'migration_022_volunteer_team_join_requests',
    file: 'migration_022_volunteer_team_join_requests.sql',
    checks: [['table', 'team_join_requests']],
  },
  {
    id: 'migration_023_team_join_request_notifications_and_constraint',
    file: 'migration_023_team_join_request_notifications_and_constraint.sql',
    checks: [
      ['enumValue', 'notifications', 'type', 'team_join_request_received'],
      ['column', 'team_join_requests', 'pending_flag'],
    ],
  },
  {
    id: 'migration_024_add_is_deleted_to_donation_requests',
    file: 'migration_024_add_is_deleted_to_donation_requests.sql',
    checks: [['column', 'donation_requests', 'is_deleted']],
  },
  {
    id: 'migration_025_status_history_actor_attribution_fix',
    file: 'migration_025_status_history_actor_attribution_fix.sql',
    checks: [], // Trigger migration - no schema checks needed
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
    if (type === 'column') return rows.length > 0;
    // MySQL's information_schema always returns result columns as
    // COLUMN_TYPE (uppercase), regardless of the lowercase alias used
    // above — reading rows[0].column_type is undefined on a real MySQL
    // 8.0 server, which crashed every enumValue check. Read case-
    // insensitively so this works regardless of server/driver casing.
    const row = rows[0];
    if (!row) return false;
    const columnType = row.column_type ?? row.COLUMN_TYPE;
    return Boolean(columnType && columnType.includes(`'${extra || 'scheduled'}'`));
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
