/**
 * Computes the list of allowed CORS origins, shared by both Express
 * (app.js) and Socket.IO (server.js) so the two configurations can never
 * drift apart.
 *
 * Production: driven entirely by environment variables — CLIENT_URL
 * (required, and validated as https:// in config/environment.js) plus an
 * optional comma-separated ALLOWED_ORIGINS for any additional production
 * origins (e.g. a staging domain). No hardcoded localhost.
 *
 * Development (and any NODE_ENV other than 'production'): also includes the
 * local Vite dev server origins, so local frontend development keeps
 * working without extra configuration.
 * @returns {string[]} Allowed origins for CORS
 */
function getAllowedOrigins() {
  const isProduction = process.env.NODE_ENV === 'production';

  const additionalOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const developmentOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

  const origins = isProduction
    ? [process.env.CLIENT_URL, ...additionalOrigins]
    : [...developmentOrigins, process.env.CLIENT_URL, ...additionalOrigins];

  return origins.filter(Boolean);
}

module.exports = { getAllowedOrigins };
