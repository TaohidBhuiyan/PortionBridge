# Migration 002 — Authentication & Security Documentation

Additive migration on top of `portionbridge_schema.sql`. Nothing from Migration 001 is dropped, renamed, or altered — only new columns and new tables are added.

## New `users` Columns

| Column | Type | Purpose |
|---|---|---|
| `email_verified` | TINYINT(1) | Gates login — users cannot log in until this is `1` |
| `failed_login_attempts` | TINYINT UNSIGNED | Consecutive failed logins; reset to 0 on success |
| `lock_until` | DATETIME | If set and in the future, login is rejected regardless of password correctness |
| `last_login_at` | DATETIME | Set on every successful login |
| `last_login_ip` | VARCHAR(45) | Set on every successful login (supports IPv6) |
| `last_user_agent` | VARCHAR(255) | Set on every successful login |

## New Tables

### `email_verifications`
One row per issued verification token. Only `SHA-256(rawToken)` is stored — the raw token is what gets emailed/returned in dev mode. Expires after `EMAIL_VERIFICATION_EXPIRES_HOURS` (env-configured). `is_used` prevents replay of an already-consumed link.

### `password_history`
Stores bcrypt hashes of previous passwords. On `reset-password`, the new password is compared (via `bcrypt.compare`) against the current password hash **and** the stored history rows; a match at any point is rejected. Only the most recent `PASSWORD_HISTORY_LIMIT` (default 5) rows are kept per user — older rows are pruned after each insert.

### `refresh_tokens`
Backs revocable, rotatable sessions. Each login/refresh creates a new row holding `SHA-256(rawRefreshToken)`, plus `user_agent`/`ip_address` for session visibility. On rotation, the old row is marked `is_revoked = 1` and linked via `replaced_by_token_id` to the new row — this **rotation chain** is what enables replay detection: if a client ever presents an already-revoked token, every token for that user is immediately revoked (all sessions killed), since that pattern only happens if a stolen/duplicated refresh token was used after the legitimate client already rotated past it.

### `audit_logs`
Append-only security event trail. Every register, login attempt (success or failure), lockout, logout, password reset step, email verification step, and refresh-token event writes a row here with `action`, `ip_address`, `user_agent`, and a JSON `metadata` blob for event-specific context.

## Re-running This Migration

This file is **not idempotent** by design (matching your existing schema style) — it assumes it runs exactly once against a database that already has Migration 001 applied and none of these columns/tables yet. If you need to re-run it during development, first manually drop the 4 new tables and remove the 6 new `users` columns, or restore from a `portionbridge_backup.sql` taken before this migration.
