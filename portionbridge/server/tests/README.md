# Tests

```bash
npm test              # everything
npm run test:unit     # fast, no database required
npm run test:integration   # requires a database — see below
```

Built on Node's built-in `node:test` runner and `node:assert` — no new dependencies were added.

## Unit tests (`tests/unit/`)

Pure logic, no database: password policy rules, JWT access-token generation/verification, opaque refresh-token generation/hashing, CSRF token comparison. Always run, always fast.

## Integration tests (`tests/integration/`)

Exercise the real service layer (`services/*.js`) against a real MySQL database — not mocks — because the things worth testing here (row-level locking under concurrency, transaction rollback, trigger-based notifications, authorization checks) only mean something against a real database.

**If no database is reachable, these tests report as `skip` rather than failing** — `npm test` will not fail in an environment with no DB configured; only the unit tests will actually run. To see red bars instead of skips, point the integration tests at a real (ideally disposable/test) database:

```bash
# server/.env — or export these directly before running npm test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=portionbridge          # a fresh import of database/main_schema.sql + triggers.sql
NODE_ENV=development           # required — see note below
JWT_ACCESS_SECRET=...          # any 32+ char string
JWT_REFRESH_SECRET=...         # different from the above
```

**Do not point this at a production database.** Tests create and delete real rows.

### Why `NODE_ENV=development` is required

Registration only returns a `devVerificationToken` field in non-production mode (mirroring how the real API lets you verify an account locally without a real mailbox — see `services/email.service.js`). The test helper (`tests/integration/setup.js`) uses that same token to verify test accounts. In `NODE_ENV=production` this field isn't returned and the integration tests will fail at the verification step — this is intentional, not a test bug: production must never hand out verification tokens in an API response.

### Cleanup

Every test-created user has an `@example.test` email. An `after()` hook in each test file deletes all data belonging to `@example.test` accounts (donations, team memberships, teams, users) after that file's tests finish. If a test run is interrupted (e.g. killed mid-run), just re-run — the next run's `after()` hook cleans up leftovers using the same domain filter, and every test uses freshly-generated unique emails so leftover data from a previous run doesn't collide with a new run.

### Coverage

| File | Covers |
|---|---|
| `auth.test.js` | register, duplicate-email rejection, login (wrong password / unverified email), refresh token issuance, refresh token rotation, replay-token detection, expired-token rejection, garbage-token rejection |
| `donation.test.js` | donation creation, individual acceptance, double-accept rejection, **true concurrent-accept race** (two real parallel requests — exactly one must win), valid/invalid status transitions, cross-volunteer authorization |
| `team.test.js` | team creation, one-leader-per-volunteer constraint, invite authorization (leader-only), full team-donation-accept → assign-member flow, and the authorization fix that stops a non-member from accepting "on behalf of" a team they aren't in |
| `chat.test.js` | donor/volunteer chat access on an accepted donation, rejection of unrelated users, chat unavailable before acceptance, unauthorized `sendMessage` rejection |
| `notifications.test.js` | regression coverage for the two notification bugs fixed in this pass — no duplicate donor notification on team acceptance, and both the team leader AND a distinct assigned member each get exactly one completion notification |

### A note on what's *not* covered

This is a lightweight, targeted suite aimed at the specific risk areas called out in the audit (auth, donation lifecycle, team authorization, chat authorization, notification correctness) — it is not a full coverage suite for every controller/route/validator combination. Ratings, reports, admin endpoints, leaderboard, and achievements are not covered; extend `tests/integration/` following the same pattern (real service-layer calls, `@example.test` emails, skip-if-no-DB) if you want to add them.
