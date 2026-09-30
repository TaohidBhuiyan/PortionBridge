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

**Do not run these migrations against a database freshly created from the current `main_schema.sql`.** Their DDL is already present and rerunning them can fail with duplicate columns, tables, indexes, or constraints. Use the migration files only to upgrade an older existing database.

For fresh database initialization, use (`triggers.sql` must come before `dummy_data.sql`):
```
main_schema.sql → triggers.sql → dummy_data.sql
```

For an older existing database, apply only migrations that have not already been applied, in numeric order, using the project migration process.
