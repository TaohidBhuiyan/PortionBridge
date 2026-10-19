# Migrations — Status

All migrations in this folder are now represented in `database/main_schema.sql` for fresh installs. The standalone files remain available for upgrading databases that were created before those changes were merged.

## Already folded into main_schema.sql
These changes are already present in the current `main_schema.sql` file:

||| Migration | Change | Status in `main_schema.sql` |
|||---|---|---|
||| `008_add_achievements.sql` | `achievement_definitions`, `user_achievements` tables | Present |
||| `migration_012_google_auth_enhancements.sql` | `provider`, `google_id` columns on `users` | Present |
||| `migration_013_service_areas_fix.sql` | `service_areas` column on `volunteer_profiles` | Present |
||| `migration_014_admin_announcement_type.sql` | `admin_announcement` notification type | Present |
||| `migration_015_report_moderation_fields.sql` | `resolution_notes`, `resolved_by`, `resolved_at`, `dismissed` status on `reports` | Present |
||| `migration_016_donation_cancelled_status.sql` | `cancelled` donation status | Present |
||| `migration_017_leaderboard_opt_out.sql` | Leaderboard privacy column and filtered views | Present |
||| `migration_018_notification_templates.sql` | `notification_templates` table | Present |
||| `migration_019_recurring_donations.sql` | `recurring_donations` table | Present |
||| `migration_020_volunteer_team_base_location.sql` | `base_address` column on `volunteer_profiles` and `teams` | Present |
||| `migration_021_fix_volunteer_leaderboard_team_credits.sql` | Team-aware volunteer leaderboard view | Present |
||| `migration_022_volunteer_team_join_requests.sql` | `team_join_requests` table | Present |
||| `migration_023_team_join_request_notifications_and_constraint.sql` | Join-request notifications and one-pending constraint | Present |
||| `migration_024_add_is_deleted_to_donation_requests.sql` | `is_deleted`, `deleted_at` on `donation_requests` | Present |
||| `migration_025_status_history_actor_attribution_fix.sql` | Real actor in `donation_status_history` (`@status_change_actor_id`) | Present in `triggers.sql` (it is a trigger change, not a table change) |
||| `migration_029_disaster_relief_foundation.sql` | `disaster_incidents`, `relief_requests`, `relief_request_items`, `relief_pledges` tables | Present |
||| `migration_030_relief_pledge_logistics.sql` | Relief pledge logistics: `relief_pledge_reports` table, `failed` pledge status, `quantity_pending_verification`, `relief_requests.delivery_instructions` | Present |

**Do not run these migrations against a database freshly created from the current `main_schema.sql`.** Their DDL is already present and rerunning them can fail with duplicate columns, tables, indexes, or constraints. Use the migration files only to upgrade an older existing database.

For fresh database initialization, use (`triggers.sql` must come before `dummy_data.sql`):
```
main_schema.sql → triggers.sql → dummy_data.sql
```

For an older existing database, apply only migrations that have not already been applied, in numeric order, using the project migration process.

## Migration 029 — Disaster Relief foundation (additive)
Creates four new tables only; no existing table is altered. It uses `CREATE TABLE IF NOT EXISTS`, so re-running is harmless, and it contains no `USE <database>` — run it against the intended database explicitly (`npm run migrate` does this via `DB_NAME`). A manual rollback script, `migration_029_disaster_relief_foundation.down.sql`, drops those four tables (destructive — back up first; it is not run by `npm run migrate`).

## Migration 030 — Relief pledge logistics & delivery verification (additive)
Builds on 029. It adds the `relief_pledge_reports` table, a `failed` value to `relief_pledges.status`, the `quantity_pending_verification` and `failed_at` columns, `relief_requests.delivery_instructions`, and widens the pledge CHECK constraints. No existing row is changed or deleted; existing pledges keep their values. Apply with `npm run migrate` (runs 029 then 030 and records both; a second run is a no-op) or, manually and **once**, `mysql -u root -p <database> < migration_030_relief_pledge_logistics.sql` — the ALTERs are not re-runnable. Requires MySQL 8.0.19+ / MariaDB 10.2.1+. Rollback: `migration_030_relief_pledge_logistics.down.sql` (manual; drops the reports table and the new columns, converting any `failed` pledges to `cancelled` first). Back up before applying.

`scripts/migrate.js` now records applied migrations with `INSERT IGNORE`: migrations 021 and 028 insert their own `schema_migrations` row, which made the runner's second insert fail with a duplicate-key error on a database that had not applied them yet.
