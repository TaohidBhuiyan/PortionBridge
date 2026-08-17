# PortionBridge

A full-stack food & clothes donation coordination platform connecting donors, volunteers, and volunteer teams. Donors post donations; individual volunteers or teams accept and fulfill them through a tracked pickup lifecycle, with real-time notifications and chat throughout.

## Tech Stack

**Backend:** Node.js, Express.js, MySQL (mysql2, raw SQL — no ORM), Socket.IO, JWT, bcrypt, Multer, express-validator, Swagger UI.

**Frontend:** React 18 + Vite, Tailwind CSS, React Router, Socket.IO client, Axios.

**Architecture:** Layered MVC — `routes → controllers → services → models`, with `validators` for request-shape checks and `middleware` for cross-cutting concerns (auth, rate limiting, uploads, error handling).

## Implemented Features

### Authentication & Security
- Registration, login, logout, email verification, forgot/reset password
- Google OAuth sign-in (server-side ID token verification)
- JWT access tokens (short-lived, returned in the response body) + refresh tokens (long-lived, `httpOnly` cookie)
- Refresh token rotation with replay detection (a reused/stale refresh token revokes the session)
- Per-IP and per-account login rate limiting with account lockout after repeated failures
- Registration and forgot-password endpoints are separately rate-limited
- Role-based authorization (donor / volunteer / admin) enforced per-route
- Audit logging of security-relevant actions (login, registration, team changes, donation lifecycle events, etc.)

### Donations
- Create, update, cancel donation requests (food or clothes category, with category-specific required fields)
- Browsing/discovery with filters
- Full status lifecycle: `pending → accepted → scheduled → on_the_way → picked_up → completed`
- Individual-volunteer acceptance and team acceptance, both guarded against double-accept via row-level locking (`SELECT ... FOR UPDATE`) inside a transaction
- Donor-side and volunteer-side donation history with summaries
- Saved pickup addresses

### Volunteers & Teams
- Volunteer profile (vehicle type, availability, service area)
- Volunteer discovery for donors (nearby volunteers/teams, filterable)
- Volunteer dashboard with real assignment data
- Teams: create, invite, accept/decline invitation, promote, remove member, transfer leadership, leave
- Team-assigned donations: a team leader accepts on behalf of the team and can assign a specific member to actually perform the pickup — the assigned member (not just the leader) is tracked and notified through the full lifecycle

### Notifications
- Real-time delivery via Socket.IO (with DB-persisted history) for: donation accepted, donation status changes, team invitations, team-donation assignment, pickup completion, and more
- Donation-status notifications are created once via a database trigger on `donation_requests` status changes and delivered to the relevant user(s) in real time — application code does not duplicate that trigger-created notification
- For team donations, both the team leader and the specific assigned member receive their own completion notification (not just whoever is stored in `volunteer_id`), without duplicating a notification to someone who is both

### Chat
- Socket.IO-based real-time chat scoped to a specific donation, restricted to the donation's donor and assigned volunteer/team member

### Ratings & Reports
- Post-completion ratings between donor and volunteer
- User/donation reporting

### Admin
- User management, donation oversight, platform-level views

### Other
- Leaderboard (volunteer activity ranking)
- Achievements (donor/volunteer milestone tracking) — schema present in `database/migrations/008_add_achievements.sql`; see **Known Limitations** below
- Image uploads for donation photos and profile photos: MIME-type filtering, file size limits, randomized filenames, and file-content (magic-byte) signature verification to reject files whose actual bytes don't match a real image of the declared type

## Project Structure

```
portionbridge/
├── client/                    # React frontend
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── context/           # Auth/Socket context providers
│       ├── pages/             # Route-level pages
│       ├── services/          # API client layer
│       └── utils/
├── server/                    # Express backend
│   ├── config/                # DB pool, CORS, schema validation
│   ├── constants/             # Shared enums/constants
│   ├── controllers/           # Thin HTTP-layer handlers
│   ├── middleware/            # Auth, rate limiting, uploads, error handling
│   ├── models/                # Raw-SQL data access layer
│   ├── routes/v1/             # API route definitions
│   ├── services/              # Business logic
│   ├── sockets/                # Socket.IO setup and event handlers
│   ├── tests/                 # Automated tests (see Testing below)
│   ├── utils/                 # Shared helpers
│   └── validators/            # express-validator request rules
└── database/
    ├── portionbridge_schema.sql     # Consolidated current schema (source of truth for a fresh install)
    ├── portionbridge_triggers.sql   # DB triggers (e.g. donation-status notifications)
    └── migrations/                   # Historical/incremental migration files
```

## Getting Started

### Prerequisites
- Node.js v18+
- MySQL 8.0+ (or MariaDB 10.2.1+ — required for `CHECK` constraint support)

### 1. Database Setup

```bash
mysql -u root -p < database/portionbridge_schema.sql
mysql -u root -p portionbridge < database/portionbridge_triggers.sql
```

`portionbridge_schema.sql` is the consolidated, current schema — importing it gives you a complete, up-to-date database in one step. You do not need to separately run older migration files against a fresh database.

> **MySQL 8.0.19+ note:** two `CHECK` constraints (`chk_ratings_not_self` on `ratings`, `chk_reports_target_present` on `reports`) reference columns that are also part of a foreign key with a `CASCADE` action. MySQL 8.0.19+ rejects this combination (`ERROR 3823`). If your import fails on either of these lines, remove that one `CONSTRAINT ... CHECK (...)` clause from `portionbridge_schema.sql` before importing — the rest of the schema is unaffected. This is a known limitation of the current schema file, not something you need to work around by hand each time (a proper fix means restructuring the FK actions, which is out of scope of a schema-preserving fix).

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` — see [Environment Variables](#environment-variables) below.

```bash
npm run migrate   # verifies/records schema state against the code's expectations
npm run dev        # or: npm start
```

Backend runs on `http://localhost:5000` by default (`PORT` in `.env`).

### 3. Frontend Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Environment Variables

### Backend (`server/.env`)

| Variable | Required | Notes |
|---|---|---|
| `PORT` | | Default `5000` |
| `NODE_ENV` | | `development` or `production` — controls Swagger UI, error detail in responses, and dev-mode email console logging |
| `CLIENT_URL` | Yes | Frontend origin, used for CORS. Must be `https://` in production |
| `ALLOWED_ORIGINS` | | Comma-separated additional CORS origins |
| `TRUST_PROXY` | | Number of reverse-proxy hops in front of this server, if any |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | Yes | MySQL connection |
| `JWT_ACCESS_SECRET` | Yes | Must be a long random string (32+ chars) |
| `JWT_ACCESS_EXPIRES_IN` | | e.g. `15m` |
| `JWT_REFRESH_SECRET` | Yes | Different from the access secret |
| `GOOGLE_CLIENT_ID` | For Google login | From Google Cloud Console |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | In production | In development, emails are logged to the console instead of sent |
| `SUPPORT_URL` | | Linked from transactional emails |

### Frontend (`client/.env`)

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | e.g. `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | e.g. `http://localhost:5000` |
| `VITE_GOOGLE_CLIENT_ID` | For Google login |

## API Documentation

In development mode: `http://localhost:5000/api-docs` (Swagger UI). Socket.IO event reference: `server/docs/socketEvents.md`.

## Testing

```bash
cd server
npm test
```

See `server/tests/README.md` for what's covered and how to point the integration tests at a test database.

## Security Notes

- Refresh tokens are `httpOnly` cookies with rotation + replay detection; access tokens are short-lived bearer tokens, never cookie-stored.
- Passwords are hashed with bcrypt; never logged.
- Uploaded images are validated by declared MIME type, file size, and actual file-content signature (magic bytes) — not filename or extension alone.
- Rate limiting is in-memory/process-local by default; for horizontal scaling behind a load balancer, back it with a shared store (e.g. Redis) instead.
- Set `NODE_ENV=production` before deploying — this disables Swagger UI, suppresses stack traces in API error responses, and enforces HTTPS-only CORS origins.

## Known Limitations

- The `achievements` feature is incomplete at the database level. `database/migrations/008_add_achievements.sql` creates `user_achievements` (which is not included in `portionbridge_schema.sql` either — apply that migration if you want it), but the code (`models/achievement.model.js`) also queries a second table, `achievement_definitions`, which has no migration file anywhere in this repo. Until that table is added, donation completion's achievement check will log an "achievement check failed" error and skip silently — it does not fail or block the donation completion request itself.
- The two `CHECK` constraints noted above may need to be removed for a clean import on MySQL 8.0.19+, depending on your server version.
- Rate limiting does not share state across multiple server instances (see Security Notes).

## License

Educational/personal project.
