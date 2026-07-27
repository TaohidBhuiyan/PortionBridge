# PortionBridge

Food & Clothes Donation Coordination Platform.

## Stack
- Frontend: React (Vite) + Tailwind CSS
- Backend: Node.js + Express.js
- Database: MySQL (via XAMPP), raw SQL with mysql2
- Real-time: Socket.io
- Auth: JWT + bcrypt
- File uploads: Multer

## Setup

### Backend
cd server
npm install
cp .env.example .env   # then fill in your local values
npm run dev

### Frontend
cd client
npm install
cp .env.example .env
npm run dev

## API documentation

- **Swagger UI**: `GET /api-docs` (available whenever `NODE_ENV !== 'production'` — same environment-gated pattern used elsewhere in this project, e.g. the dev HTTP logger). The underlying spec is `server/docs/openapi.js`.
- **Socket.IO events**: `server/docs/socketEvents.md` — connection/auth flow, rooms, every event emitted/received, payload shapes.
- Both are hand-written from the actual route/controller/handler code, not generated from source comments — update them if the corresponding implementation changes.

## Production notes

- **CORS**: production origins come only from `CLIENT_URL` (required, must be `https://`) plus optional `ALLOWED_ORIGINS` (comma-separated). No localhost origins are included when `NODE_ENV=production`. Socket.IO uses the same origin list as the REST API (see `server/config/cors.js`).
- **Reverse proxy**: if this server sits behind a load balancer/reverse proxy, set `TRUST_PROXY` to the number of proxy hops in front of it (e.g. `1`). Leave it unset for a directly internet-facing deployment. This affects `req.ip`, which is used for rate limiting and audit logging.
- **Rate limiting** is process-local (in-memory), which is correct for a single instance but not for multiple instances/containers behind a load balancer — see the comment at the top of `server/middleware/rateLimiter.js` for what would need to change (a shared store such as `rate-limit-redis`) if this API is ever horizontally scaled.
- Required production environment variables are validated at startup by `server/config/environment.js` — the server refuses to start if any are missing or look like placeholder values.