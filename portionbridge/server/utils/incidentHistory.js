const { pool } = require('../config/db');

/**
 * Append-only verification / status / correction timeline for an incident
 * (disaster_incident_history). Written INSIDE the caller's transaction so a history row
 * exists if and only if the change committed. Never contains tokens or passwords.
 */
async function recordIncidentHistory(connection, { incidentId, action, fromStatus = null, toStatus = null, reason = null, details = null, actorId = null }) {
  await (connection || pool).query(
    `INSERT INTO disaster_incident_history (incident_id, action, from_status, to_status, reason, details, actor_id)
     VALUES (:incidentId, :action, :fromStatus, :toStatus, :reason, :details, :actorId)`,
    {
      incidentId, action, fromStatus, toStatus,
      reason: reason ? String(reason).slice(0, 1000) : null,
      details: details ? JSON.stringify(details).slice(0, 8000) : null,
      actorId,
    }
  );
}

module.exports = { recordIncidentHistory };
