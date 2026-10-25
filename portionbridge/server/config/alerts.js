/**
 * Disaster-alert runtime policy (Phase 4). Read on every call so operators and
 * tests can change it without a rebuild.
 *
 * ALERT_AUTO_LOCAL_MIN_SEVERITY (default: high)
 *   When an administrator VERIFIES an incident (or raises its severity) and no
 *   live alert exists, a LOCAL alert is created automatically if the incident's
 *   own stored severity is at or above this level. low|moderate|high|critical
 *   enable it from that level up; "off" disables automatic alerts entirely.
 *   Automatic alerts are always scope "local" — nationwide scope is only ever
 *   set by an administrator.
 *
 * ALERT_SWEEP_INTERVAL_MS (default: 60000; 0 disables the sweeper)
 *   How often the in-process sweeper re-processes pending / stuck / failed events.
 *
 * ALERT_MAX_ATTEMPTS (default: 5)
 *   Automatic processing attempts per event before it waits for an admin retry.
 */
const { RELIEF } = require('../constants');

function autoLocalMinSeverity() {
  const raw = String(process.env.ALERT_AUTO_LOCAL_MIN_SEVERITY ?? 'high').trim().toLowerCase();
  if (['off', 'false', '0', 'no', 'none'].includes(raw)) return null;
  return RELIEF.ALERT.SEVERITY_ORDER.includes(raw) ? raw : 'high';
}

function positiveInt(name, fallback) {
  const n = Number.parseInt(process.env[name], 10);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

module.exports = {
  autoLocalMinSeverity,
  sweepIntervalMs: () => positiveInt('ALERT_SWEEP_INTERVAL_MS', 60000),
  maxAttempts: () => Math.max(1, positiveInt('ALERT_MAX_ATTEMPTS', 5)),
  // A 'processing' claim older than this is considered abandoned (crashed worker) and may be re-claimed.
  staleClaimSeconds: () => Math.max(5, positiveInt('ALERT_STALE_CLAIM_SECONDS', 300)),
};
