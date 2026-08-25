# PortionBridge — Database Import Guide

Step-by-step instructions to import the schema and sample data into your local XAMPP MySQL instance via phpMyAdmin.

---

## Prerequisites

- XAMPP installed and running
- MySQL version **8.0.16+** or MariaDB **10.2.1+** (required for `CHECK` constraints to be enforced — older versions will accept the syntax but silently ignore the checks)

To confirm your version, open phpMyAdmin → click the **"Databases"** tab or check the bottom of the phpMyAdmin homepage where the server version is listed.

---

## Step 1 — Start MySQL

1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL**.
3. Confirm it shows a green "Running" status.

---

## Step 2 — Open phpMyAdmin

Go to: `http://localhost/phpmyadmin`

---

## Step 3 — Import the Schema

1. Click the **Import** tab at the top of phpMyAdmin (no need to manually create the `portionbridge` database first — the schema file creates it for you).
2. Click **Choose File** and select `database/main_schema.sql`.
3. Leave all other options at their defaults.
4. Click **Go** at the bottom of the page.
5. Wait for the green success message confirming the SQL executed without errors.

**What this creates:**
- The `portionbridge` database (if it doesn't already exist)
- 23 tables: `users`, `email_verifications`, `password_history`, `refresh_tokens`, `audit_logs`, `password_resets`, `saved_addresses`, `user_preferences`, `notification_settings`, `volunteer_profiles`, `user_achievements`, `achievement_definitions`, `teams`, `team_members`, `team_invitations`, `donation_requests`, `donation_assignments`, `donation_status_history`, `chat_messages`, `notifications`, `ratings`, `reports`, `schema_migrations`
- 2 views: `top_donors`, `top_volunteers`

> If you're re-importing after a previous attempt, this file safely drops and recreates everything — no manual cleanup needed.

---

## Step 4 — Import Triggers

1. Make sure `portionbridge` is selected in the left sidebar (click on it once).
2. Go to the **Import** tab again.
3. Choose `database/triggers.sql`.
4. Click **Go**.

**What this creates:**
- 4 triggers: `trg_donation_status_insert`, `trg_donation_status_update`, `trg_saved_addresses_limit`, `trg_saved_addresses_single_default`

These triggers provide automatic audit logging, notification generation, and data integrity constraints at the database level.

---

## Step 5 — Import Sample Data

1. Make sure `portionbridge` is selected in the left sidebar (click on it once).
2. Go to the **Import** tab again.
3. Choose `database/dummy_data.sql`.
4. Click **Go**.

**What this creates:**
- 7 users (1 admin, 3 donors, 3 volunteers)
- 8 donation requests covering every status in the lifecycle, plus one soft-deleted example
- Chat messages, ratings, and reports linked across those donations

> The triggers you imported in Step 4 will automatically populate `donation_status_history` and `notifications` as this sample data is inserted — you don't need to import anything extra for those two tables.

---

## Step 6 — Verify the Import

In phpMyAdmin, click on the `portionbridge` database in the left sidebar and confirm you see all 23 tables plus the 2 views listed.

Quick verification queries (run these in the **SQL** tab):

```sql
-- Should return 7 users
SELECT COUNT(*) FROM users;

-- Should return 7 non-deleted donation requests (8 total, 1 soft-deleted)
SELECT COUNT(*) FROM donation_requests WHERE is_deleted = 0;

-- Should show 3 donors ranked by completed donations
SELECT * FROM top_donors;

-- Should show 3 volunteers ranked by completed pickups
SELECT * FROM top_volunteers;

-- Should show a full history trail — multiple rows per donation_request_id
SELECT * FROM donation_status_history ORDER BY donation_request_id, changed_at;

-- Should show notifications auto-created by the triggers
SELECT * FROM notifications ORDER BY created_at DESC;
```

---

## Step 7 — Confirm Backend Connectivity

With the database populated, start your Express backend (from Phase 1.5) and hit the health check endpoint:

```bash
cd server
npm run dev
```

Then in a browser or via curl:
[http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

```json
Expected response:
{
  "success": true,
  "message": "Health check successful",
  "data": {
    "server": "running",
    "database": "connected",
    "timestamp": "..."
  }
}
```

If `database` shows `"connected"`, the `mysql2` pool configured in `server/config/db.js` is successfully talking to the schema you just imported.

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| Import fails with a `CHECK constraint` syntax error | MySQL/MariaDB version too old | Upgrade XAMPP's bundled MySQL, or the constraint will just be parsed but not enforced (not a blocking error on MySQL 5.7, only a silent no-op) |
| `Access denied for user 'root'` | `DB_PASSWORD` in `server/.env` doesn't match your local MySQL root password | Update `server/.env` to match your XAMPP MySQL credentials |
| Import succeeds but `database: "disconnected"` on health check | MySQL service not running, or wrong `DB_PORT` in `.env` | Confirm MySQL is started in XAMPP Control Panel; default port is `3306` |
| Foreign key errors on `dummy_data.sql` import | `main_schema.sql` wasn't imported first, or was only partially imported | Re-import `main_schema.sql` completely before importing dummy data |

---

## Exporting a Backup (for future milestones)

As noted in the planning document, export a backup after each major milestone:

1. In phpMyAdmin, select the `portionbridge` database.
2. Click the **Export** tab.
3. Choose **Quick** export method, **SQL** format.
4. Click **Go** and save the file as `portionbridge_backup.sql` (e.g. in a local `database/backups/` folder — not committed to Git, per `.gitignore`).
