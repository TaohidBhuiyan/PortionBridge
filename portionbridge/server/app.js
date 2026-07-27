const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const v1Routes = require('./routes/v1/index');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { ensureUploadDirsExist, UPLOAD_ROOT } = require('./utils/uploadConfig');
const { success } = require('./utils/apiResponse');
const { getAllowedOrigins } = require('./config/cors');
const openapiSpec = require('./docs/openapi');

const app = express();

// --- Trusted proxy configuration ---
// Controls how Express interprets X-Forwarded-* headers for req.ip,
// req.protocol, and req.secure. Defaults to NOT trusting any proxy
// (false) — the safe choice when this server is directly internet-facing,
// where trusting these headers would let any client spoof their own IP
// (used for audit logging in utils/helpers.js#getClientIp and, indirectly,
// for rate limiting via express-rate-limit's default req.ip key).
// In production behind a reverse proxy/load balancer, set TRUST_PROXY to
// the exact number of hops in front of this server (e.g. "1" for a single
// Nginx/ELB hop) so req.ip correctly resolves to the real client IP instead
// of the proxy's. See https://expressjs.com/en/guide/behind-proxies.html.
const trustProxyEnv = process.env.TRUST_PROXY;
if (trustProxyEnv) {
  const hops = Number(trustProxyEnv);
  app.set('trust proxy', Number.isInteger(hops) ? hops : trustProxyEnv);
} else {
  app.set('trust proxy', false);
}

// --- Security ---
app.use(
  helmet({
    // helmet's default Cross-Origin-Resource-Policy is 'same-origin', which
    // would make browsers block the frontend (a different origin) from
    // loading donation/profile images served from /uploads, or from reading
    // API responses as sub-resources. This app is deliberately consumed
    // cross-origin by its own frontend, so this is relaxed API-wide rather
    // than only for /uploads, to avoid two different helmet configs.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// --- CORS ---
app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
  })
);

// --- Performance ---
app.use(compression());

// --- Body / cookie parsing ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Logging ---
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// --- Static file serving for uploaded images ---
// Uses the same absolute UPLOAD_ROOT that utils/uploadConfig.js writes
// files to (path.join(__dirname, '..', 'uploads')). A plain relative
// express.static('uploads') resolves against process.cwd() instead of this
// file's location — harmless when started via `cd server && npm run dev`,
// but a real risk in production if the process is launched from a
// different working directory (systemd WorkingDirectory, PM2, a Docker
// WORKDIR, etc.), where it would silently serve a different — possibly
// nonexistent — folder than the one uploads are actually written to.
app.use('/uploads', express.static(UPLOAD_ROOT));

// --- Rate limiting (applies to all API routes) ---
app.use('/api', apiLimiter);

// --- Root health endpoint ---
app.get('/', (req, res) => {
  return success(res, {
    message: 'PortionBridge API is running',
    data: {
      service: 'PortionBridge API',
      version: 'v1',
      healthEndpoint: '/api/v1/health',
    },
  });
});

// --- Versioned API routes ---
app.use('/api/v1', v1Routes);

// --- API documentation (Swagger UI) ---
// Same environment-gating pattern already used for morgan('dev') above,
// but checking !== 'production' rather than === 'development' — docs are
// useful in any non-production environment (e.g. staging), whereas the
// dev HTTP logger is intentionally narrower. Never mounted in production,
// so the API contract isn't publicly browsable there.
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
}

ensureUploadDirsExist();

// --- Fallback + error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
