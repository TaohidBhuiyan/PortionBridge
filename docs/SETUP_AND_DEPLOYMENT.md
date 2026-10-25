# PortionBridge — setup, migration order and deployment notes (Phase 6)

## Requirements
Node.js 20+ (tested on 22), MySQL 8.0.16+ or MariaDB 10.2.1+ (CHECK constraints, generated columns; tested on MariaDB 10.11). No other services are required. Optional: a Brevo API key (account e-mails), Google OAuth client id.

## Local setup (step by step)
1. `git clone` / unzip, then `cd portionbridge`.
2. **Database (new install).** Create it and load the baseline: `mysql -u root -p < database/main_schema.sql` (creates database `portionbridge`), then `mysql -u root -p portionbridge < database/triggers.sql`.
   Using a different database name? Replace the name in a copy of the two files, **or** create the database yourself and pipe the files in with the name as the argument; set `DB_NAME` accordingly. (The migration runner is safe for any name; the two SQL files above are not.)
3. `cd server && cp .env.example .env` and set at least `DB_*`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (long random values), `JWT_ACCESS_EXPIRES_IN`, `CLIENT_URL`. `npm install`.
4. **Migrations:** `npm run migrate` (idempotent; applies only what is missing). Order is fixed inside `scripts/migrate.js`: baseline → 021 → 028 → 029 disaster foundation → 030 pledge logistics → 031 alerts → 032 admin operations.
5. Create the first admin: set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (policy-compliant; optional `SEED_ADMIN_NAME`) in your shell — not in a committed file — then `npm run seed:admin`. Phase 6 removed the hard-coded e-mail/password this script used to contain; **if that old default account exists in any real deployment, change its password and review it.**
6. `npm start` (or `npm run dev`). Health check: `GET /api/v1/health`.
7. Client: `cd ../client && cp .env.example .env && npm install && npm run dev` (or `npm run build` → `dist/`).
8. Tests: `cd server && npm test` (uses the database in `DB_NAME`; **use a separate, disposable database** for tests, e.g. `DB_NAME=portionbridge_test`, after steps 2 and 4 on it). `cd client && npx vitest run`.

## Backup and restore
- JSON backup/restore (existing, `scripts/simpleBackup.js`): `npm run backup`, `npm run backup:list`, `npm run backup:restore <file>`.
- SQL dump (tables with data + view definitions): `node scripts/backupDatabase.js` → `portionbridge/backups/portionbridge_backup_<timestamp>.sql` (the newest 5 are kept); `node scripts/backupDatabase.js list`; `node scripts/backupDatabase.js restore <file.sql>`. **Restore drops and recreates every table in `DB_NAME`** — create/select the intended target database first (it restores into whatever `DB_NAME` is set, e.g. an empty `portionbridge_restore` for a drill). Dumps contain real data: keep them out of Git (the folder is ignored) and out of shared storage.
- Always rehearse a restore on a scratch database before relying on a backup.

## Development seed scripts (never against a real or production database)
`seedDemoUsers.js` → `seedRandomUsers.js` (needs a stale-enum fix, see audit report) → `seedNearbyOpportunities.js` (looks donors up by name) and `seedDummyData.js` create **fake** users, donations and ratings with demo passwords. Run them once, only with `DB_NAME` pointing at a disposable database.

## Existing installations (upgrade)
1. **Back up first**: `mysqldump --single-transaction --routines --triggers <db> > backup-YYYYMMDD.sql`. Keep it until the release is verified.
2. Deploy the new code, run `npm run migrate`. Migrations 029–032 are additive (no drops, no data rewrites).
3. Rollback: stop the app, restore the dump (preferred), or run the relevant `migration_03x_*.down.sql` in reverse order (032 → 031 → …); down scripts delete the data those migrations added.

## Environment variables (all placeholders live in `server/.env.example` and `client/.env.example`)
Server: `PORT, NODE_ENV, CLIENT_URL, ALLOWED_ORIGINS, TRUST_PROXY, DB_HOST/USER/PASSWORD/NAME/PORT, JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_SECRET, GOOGLE_CLIENT_ID, BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, SUPPORT_URL, RELIEF_REQUIRE_DELIVERY_VERIFICATION (default true — keep true so volunteer-reported deliveries need admin verification), ALERT_AUTO_LOCAL_MIN_SEVERITY, ALERT_SWEEP_INTERVAL_MS, ALERT_MAX_ATTEMPTS, ALERT_STALE_CLAIM_SECONDS, RELIEF_TASK_DELAY_HOURS`.
Client: `VITE_API_BASE_URL, VITE_SOCKET_URL, VITE_GOOGLE_CLIENT_ID`; `VITE_DEV_MODE` must be unset/false in production (it shows the dev-login shortcut).
`docker-compose*.yml` contain the placeholder password `examplepassword`: replace it (and do not expose the database port) before any real deployment.

## External services and honest status
- **Realtime:** Socket.io on the same origin as the API (JWT-authenticated; per-user rooms). Behind a proxy, enable WebSocket upgrade and set `TRUST_PROXY`/`ALLOWED_ORIGINS`.
- **Notifications:** in-app inbox + Socket.io only. **No SMS, WhatsApp, push or alert-e-mail is configured or claimed.** Brevo is used only for account e-mails (verification/reset) and falls back to a console log when `BREVO_API_KEY` is absent.
- **Maps/geocoding:** Leaflet with the public OpenStreetMap tile server (`tile.openstreetmap.org`) and Nominatim geocoding. Both are free public services with usage policies (no heavy/bulk use, attribution shown). For production traffic, use a tile provider/own tile server and a geocoder you are licensed to use (client code: `DisasterMap.jsx`, `VolunteerMap.jsx`, `AddressLocationPicker.jsx`, `utils/geocoding.js`).
- **Alert delivery worker:** an in-process sweeper (`ALERT_SWEEP_INTERVAL_MS`); with several API instances each runs its own sweeper (claims make this safe).

## Known deployment limitations
Single `admin` role; no upazila data; migrations 029–032 not folded into `main_schema.sql`; no automated browser (E2E) or load testing was performed; the development seed scripts are for disposable databases only (see below).

## Recommended Git procedure
1. Branch from your main branch: `git checkout -b release/disaster-response-final`; commit this ZIP's contents as **one commit per phase-sized concern** if you can (migrations; backend; frontend; tests; docs) so review stays tractable.
2. Open a pull request into `main`; require: CI green (`npm test` server on a throw-away DB, `npx vitest run`, `npm run build`), a second reviewer for migrations and authorization code (`routes/v1/*.routes.js`, `middleware/`), and a re-read of `docs/FINAL_AUDIT_REPORT.md` limitations.
3. Resolve the three conflicted scripts in a separate small commit (pick the correct side or delete them) — do not let conflict markers reach `main`.
4. Staging first: restore a **copy** of production data, run `npm run migrate`, smoke-test the manual checks below, then tag (`git tag v1.0-disaster-response`) and merge (prefer a merge commit so the release is easy to revert).
5. Production: backup → deploy → `npm run migrate` → smoke test. Keep the pre-release dump and tag for rollback.

## Manual checks before deploying (not covered by automated tests)
1. Real browser walk-through in **light and dark** themes on desktop and a phone-sized viewport: report incident → admin verify → map → request → pledge → volunteer task → delivery → admin verify → resolve.
2. Two real accounts per role to confirm Socket.io notifications arrive (and never to another user) through your real proxy/TLS.
3. Map tiles/geocoding load from your deployment origin (check CSP, CORS and tile-provider terms).
4. Production `.env`: strong unique JWT secrets, `NODE_ENV=production`, correct `CLIENT_URL/ALLOWED_ORIGINS`, `VITE_DEV_MODE` unset, DB credentials not the compose placeholder, e-mail provider configured if you rely on verification e-mails.
5. Backup + **restore drill** on a copy of production data, including the new migrations.
6. `npm audit` for both packages and a dependency review (not run in this audit).
7. Load test the dashboard/list endpoints with production-sized data; check slow-query log (queries are paginated and index-supported, but were not benchmarked at scale).
8. Decide policy items noted in the audit report (resolved incident with approved requests / in-flight tasks; single admin role).
