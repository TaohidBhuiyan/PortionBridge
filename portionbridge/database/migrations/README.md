# Migrations — Status

Every migration in this folder has already been folded into `database/main_schema.sql`.
This was verified directly against the current schema file (Phase 3 audit):

| Migration | Change | Status in `main_schema.sql` |
|---|---|---|
| `008_add_achievements.sql` | `achievement_definitions`, `user_achievements` tables | Present |
| `migration_012_google_auth_enhancements.sql` | `provider`, `google_id` columns on `users` | Present |
| `migration_013_service_areas_fix.sql` | `service_areas` column on `volunteer_profiles` | Present |
| `migration_014_admin_announcement_type.sql` | `admin_announcement` notification type | Present |
| `migration_015_report_moderation_fields.sql` | `resolution_notes`, `resolved_by`, `resolved_at`, `dismissed` status on `reports` | Present |

**Do not run any file in this folder against a database that was created from the current `main_schema.sql`.** Every table/column they'd create already exists, so they will fail (duplicate column/table, or an FK error if run out of order — confirmed by testing `008_add_achievements.sql` directly against a fresh schema import).

These files are kept for historical reference only (they show how the schema evolved incrementally before being consolidated). The only supported initialization path is:

```
main_schema.sql → triggers.sql → dummy_data.sql
```

as already documented in `database/import_guide.md`.
