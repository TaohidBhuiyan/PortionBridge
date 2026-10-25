const disasterIncidentModel = require('../models/disasterIncident.model');
const auditService = require('./audit.service');
const alertService = require('./disasterAlert.service');
const { recordIncidentHistory } = require('../utils/incidentHistory');
const AppError = require('../utils/AppError');
const { runInTransaction } = require('../utils/dbTransaction');
const { serializeIncident } = require('../utils/reliefSerializers');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { HTTP_STATUS, AUDIT_ACTIONS, RELIEF, USER_ROLES } = require('../constants');

const S = RELIEF.INCIDENT_STATUS;

/**
 * Allowed incident status transitions. Verification (-> verified) can only happen
 * through changeStatus(), which is admin-only at the route AND re-checked here.
 */
const TRANSITIONS = {
  [S.REPORTED]: [S.UNDER_REVIEW, S.REJECTED],
  [S.UNDER_REVIEW]: [S.VERIFIED, S.REJECTED],
  [S.VERIFIED]: [S.ACTIVE, S.RESOLVED],
  [S.ACTIVE]: [S.RESOLVED],
  [S.REJECTED]: [S.UNDER_REVIEW],
  [S.RESOLVED]: [S.ACTIVE],
};

const isAdmin = (user) => Boolean(user) && user.role === USER_ROLES.ADMIN;

/** Fields a reporter / admin may provide, mapped camelCase -> column. Never includes status or verification fields. */
const CONTENT_FIELDS = {
  title: 'title',
  description: 'description',
  disasterType: 'disaster_type',
  severity: 'severity',
  latitude: 'latitude',
  longitude: 'longitude',
  address: 'address',
  district: 'district',
  affectedArea: 'affected_area',
  sourceReference: 'source_reference',
};
const ADMIN_ONLY_FIELDS = { priority: 'priority', sourceType: 'source_type' };

function viewerLevel(row, user) {
  if (isAdmin(user)) return 'admin';
  if (user && row.reported_by === user.id) return 'owner';
  return 'public';
}

function canView(row, user) {
  if (RELIEF.PUBLIC_INCIDENT_STATUSES.includes(row.status)) return true;
  return isAdmin(user) || Boolean(user && row.reported_by === user.id);
}

function snapshot(row, columns) {
  const out = {};
  columns.forEach((c) => { out[c] = row[c] === undefined ? null : row[c]; });
  return out;
}

async function reportIncident(user, input, ctx = {}) {
  const admin = isAdmin(user);
  const id = await disasterIncidentModel.create({
    title: input.title,
    description: input.description || null,
    disasterType: input.disasterType,
    severity: input.severity || 'moderate',
    priority: admin && input.priority ? input.priority : 'normal',
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    address: input.address || null,
    district: input.district,
    affectedArea: input.affectedArea || null,
    // Non-admins can never choose the source type; everything starts as 'reported'/'unverified'.
    sourceType: admin ? (input.sourceType || 'admin_entry') : 'user_report',
    sourceReference: input.sourceReference || null,
    reportedBy: user.id,
  });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.DISASTER_INCIDENT_REPORTED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { incidentId: id, disasterType: input.disasterType, district: input.district },
  });

  const row = await disasterIncidentModel.findById(id);
  return serializeIncident(row, viewerLevel(row, user));
}

async function listIncidents(query, user) {
  const { page, limit, offset } = getPaginationParams(query);
  const admin = isAdmin(user);
  // `status` may be a comma-separated list (validated upstream); de-duplicate and drop blanks
  const requested = query.status
    ? [...new Set(String(query.status).split(',').map((x) => x.trim()).filter(Boolean))]
    : null;
  const filters = {
    disasterType: query.disasterType,
    district: query.district,
    severity: query.severity,
    priority: query.priority,
    search: query.search,
  };

  if (query.mine === 'true') {
    if (!user) throw new AppError('Authentication required.', HTTP_STATUS.UNAUTHORIZED);
    filters.reportedBy = user.id;
    if (requested) filters.statuses = requested;
  } else if (admin) {
    if (requested) filters.statuses = requested;
  } else {
    // Everyone else only ever sees publicly visible incidents.
    filters.statuses = requested
      ? RELIEF.PUBLIC_INCIDENT_STATUSES.filter((s) => requested.includes(s))
      : RELIEF.PUBLIC_INCIDENT_STATUSES;
    if (filters.statuses.length === 0) filters.statuses = ['__none__'];
  }

  const [rows, total] = await Promise.all([
    disasterIncidentModel.findAll(filters, { sort: query.sort, limit, offset }),
    disasterIncidentModel.countAll(filters),
  ]);

  return {
    incidents: rows.map((r) => serializeIncident(r, viewerLevel(r, user))),
    meta: buildPaginationMeta({ page, limit, totalItems: total }),
  };
}

async function getIncident(id, user) {
  const row = await disasterIncidentModel.findById(id);
  // 404 (not 403) for hidden incidents so their existence is not disclosed.
  if (!row || !canView(row, user)) throw new AppError('Incident not found.', HTTP_STATUS.NOT_FOUND);
  return serializeIncident(row, viewerLevel(row, user));
}

async function updateIncident(id, user, input, ctx = {}) {
  const admin = isAdmin(user);
  const { before, after, changed, alertEventIds } = await runInTransaction(async (connection) => {
    const row = await disasterIncidentModel.findByIdForUpdate(id, connection);
    if (!row) throw new AppError('Incident not found.', HTTP_STATUS.NOT_FOUND);
    // a merged duplicate is a read-only record: its data lives on the surviving incident
    if (row.status === S.MERGED) {
      throw new AppError('This incident was merged into another incident and can no longer be edited.', HTTP_STATUS.CONFLICT, 'INCIDENT_MERGED');
    }

    const isOwner = row.reported_by === user.id;
    if (!admin) {
      if (!isOwner) throw new AppError('Incident not found.', HTTP_STATUS.NOT_FOUND);
      if (row.status !== S.REPORTED) {
        throw new AppError('You can only edit an incident while it is still awaiting review.', HTTP_STATUS.CONFLICT);
      }
    }

    const fields = {};
    Object.entries(CONTENT_FIELDS).forEach(([key, column]) => {
      if (input[key] !== undefined) fields[column] = input[key] === '' ? null : input[key];
    });
    if (admin) {
      Object.entries(ADMIN_ONLY_FIELDS).forEach(([key, column]) => {
        if (input[key] !== undefined) fields[column] = input[key];
      });
    }
    const columns = Object.keys(fields);
    if (columns.length === 0) throw new AppError('No valid fields provided to update.', HTTP_STATUS.BAD_REQUEST);

    // coordinates must stay a pair
    const lat = fields.latitude !== undefined ? fields.latitude : row.latitude;
    const lng = fields.longitude !== undefined ? fields.longitude : row.longitude;
    if ((lat === null) !== (lng === null)) {
      throw new AppError('Latitude and longitude must be provided together.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    await disasterIncidentModel.updateById(id, fields, connection);
    // Phase 4: an admin raising the severity of a verified incident escalates its live alert
    // (outbox row written in this same transaction; delivery happens after commit).
    let alertEventIds = [];
    if (admin && fields.severity !== undefined) {
      alertEventIds = await alertService.onIncidentSeverityChange(connection, {
        before: row, after: { ...row, ...fields }, actorId: user.id,
      });
    }
    if (admin) {
      await recordIncidentHistory(connection, {
        incidentId: id, action: 'corrected', fromStatus: row.status, toStatus: row.status, reason: input.reason,
        details: { changedFields: columns, before: snapshot(row, columns), after: fields }, actorId: user.id,
      });
    }
    return { before: snapshot(row, columns), after: fields, changed: columns, alertEventIds };
  });
  alertService.dispatch(alertEventIds);

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.DISASTER_INCIDENT_UPDATED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { incidentId: id, changedFields: changed, before, after },
  });

  return getIncident(id, user);
}

/**
 * The ONLY path that verifies, activates, resolves or rejects an incident.
 * Admin-only; records the acting admin as verifier and writes an audit entry.
 */
async function changeStatus(id, user, { status, notes }, ctx = {}) {
  if (!isAdmin(user)) throw new AppError('Only an administrator can change an incident status.', HTTP_STATUS.FORBIDDEN);

  const { from, alertEventIds } = await runInTransaction(async (connection) => {
    const row = await disasterIncidentModel.findByIdForUpdate(id, connection);
    if (!row) throw new AppError('Incident not found.', HTTP_STATUS.NOT_FOUND);

    const allowed = TRANSITIONS[row.status] || [];
    if (!allowed.includes(status)) {
      throw new AppError(
        `Invalid status transition: ${row.status} -> ${status}. Allowed: ${allowed.join(', ') || 'none'}.`,
        HTTP_STATUS.CONFLICT,
        'INVALID_STATUS_TRANSITION'
      );
    }
    if (status === S.REJECTED && !notes) {
      throw new AppError('A reason (notes) is required when rejecting an incident.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    const fields = { status };
    const now = new Date();
    if (status === S.VERIFIED) {
      fields.verification_status = 'verified';
      fields.verified_by = user.id;
      fields.verified_at = now;
    } else if (status === S.REJECTED) {
      fields.verification_status = 'rejected';
      fields.verified_by = user.id;
      fields.verified_at = now;
    } else if (status === S.UNDER_REVIEW) {
      fields.verification_status = 'unverified';
      fields.verified_by = null;
      fields.verified_at = null;
    }
    if (status === S.RESOLVED) fields.resolved_at = now;
    if (row.status === S.RESOLVED && status === S.ACTIVE) fields.resolved_at = null;
    if (notes !== undefined) fields.verification_notes = notes;

    await disasterIncidentModel.updateById(id, fields, connection);
    const alertEventIds = await alertService.onIncidentStatusChange(connection, {
      incident: { ...row, ...fields }, to: status, actorId: user.id,
    });
    const historyAction = status === S.VERIFIED ? 'verified' : status === S.REJECTED ? 'rejected'
      : (row.status === S.RESOLVED && status === S.ACTIVE) ? 'reopened' : status === S.RESOLVED ? 'resolved' : 'status_change';
    await recordIncidentHistory(connection, {
      incidentId: id, action: historyAction, fromStatus: row.status, toStatus: status, reason: notes, actorId: user.id,
    });
    return { from: row.status, alertEventIds };
  });
  alertService.dispatch(alertEventIds);

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.DISASTER_INCIDENT_STATUS_CHANGED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { incidentId: id, from, to: status, hasNotes: Boolean(notes) },
  });

  return getIncident(id, user);
}

module.exports = {
  reportIncident, listIncidents, getIncident, updateIncident, changeStatus, TRANSITIONS,
};
