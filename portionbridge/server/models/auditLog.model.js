const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `audit_logs` table.
 * Append-only — no update/delete operations are exposed, since audit trails
 * must not be mutable.
 */

/**
 * Inserts a new audit log entry.
 * @param {object} params
 * @param {number|null} params.userId - nullable (e.g. failed login with unknown email)
 * @param {string} params.action - one of AUDIT_ACTIONS in constants/index.js
 * @param {string|null} params.ipAddress
 * @param {string|null} params.userAgent
 * @param {object|null} params.metadata - arbitrary JSON-serializable context
 */
async function logEvent({ userId, action, ipAddress, userAgent, metadata }) {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, metadata)
     VALUES (:userId, :action, :ipAddress, :userAgent, :metadata)`,
    {
      userId: userId || null,
      action,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    }
  );
}

module.exports = { logEvent };
