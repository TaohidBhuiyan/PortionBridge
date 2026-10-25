const disasterIncidentModel = require('../models/disasterIncident.model');
const reliefRequestModel = require('../models/reliefRequest.model');
const reliefItemModel = require('../models/reliefRequestItem.model');
const reliefPledgeModel = require('../models/reliefPledge.model');
const auditService = require('./audit.service');
const alertService = require('./disasterAlert.service');
const AppError = require('../utils/AppError');
const { runInTransaction } = require('../utils/dbTransaction');
const { serializeRequest, serializeItem, withItems } = require('../utils/reliefSerializers');
const {
  parseQuantity, milliToDb, dbToMilli, milliToNumber, isValidForUnit, normalizeItemKey, buildRequestSummary,
} = require('../utils/reliefQuantity');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { HTTP_STATUS, AUDIT_ACTIONS, RELIEF, USER_ROLES } = require('../constants');

const R = RELIEF.REQUEST_STATUS;
const TERMINAL = [R.REJECTED, R.COMPLETED, R.CANCELLED, R.EXPIRED];

const TRANSITIONS = {
  [R.PENDING_REVIEW]: [R.APPROVED, R.REJECTED, R.CANCELLED],
  [R.APPROVED]: [R.CANCELLED, R.EXPIRED], // 'completed' is automatic only (all items delivered)
};

const isAdmin = (user) => Boolean(user) && user.role === USER_ROLES.ADMIN;

function levelFor(row, user) {
  if (isAdmin(user)) return 'admin';
  if (user && row.requested_by === user.id) return 'owner';
  return 'public';
}

function incidentIsPublic(status) {
  return RELIEF.PUBLIC_INCIDENT_STATUSES.includes(status);
}

function canViewRequest(row, user) {
  if (isAdmin(user) || (user && row.requested_by === user.id)) return true;
  return RELIEF.PUBLIC_REQUEST_STATUSES.includes(row.status) && incidentIsPublic(row.incident_status);
}

/** Admin: any non-terminal request. Requester: only while still pending_review. */
function assertCanModify(row, user) {
  if (TERMINAL.includes(row.status)) {
    throw new AppError(`This relief request is ${row.status} and can no longer be changed.`, HTTP_STATUS.CONFLICT);
  }
  if (isAdmin(user)) return;
  if (user && row.requested_by === user.id) {
    if (row.status !== R.PENDING_REVIEW) {
      throw new AppError('You can only change a request while it is pending review.', HTTP_STATUS.CONFLICT);
    }
    return;
  }
  throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);
}

function itemInputToRow(input, unit) {
  const milli = parseQuantity(input.quantity);
  if (milli === null) throw new AppError('Quantity must be a positive number with at most 3 decimals.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
  if (!isValidForUnit(milli, unit)) {
    throw new AppError(`Quantity must be a whole number for unit "${unit}".`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
  return milli;
}

async function insertOrReactivateItem(requestId, input, connection) {
  const itemKey = normalizeItemKey(input.name);
  const milli = itemInputToRow(input, input.unit);
  const existing = await reliefItemModel.findByKey(requestId, itemKey, input.unit, connection);

  if (existing && existing.status === 'active') {
    throw new AppError(
      `"${input.name}" (${input.unit}) is already on this request. Update its quantity instead of adding it again.`,
      HTTP_STATUS.CONFLICT,
      'DUPLICATE_ITEM'
    );
  }
  if (existing) {
    // previously removed (cancelled) and never had live pledges — safe to reuse the row
    await reliefItemModel.updateById(existing.id, {
      item_name: input.name,
      item_category: input.category,
      quantity_requested: milliToDb(milli),
      priority: input.priority || 'normal',
      notes: input.notes || null,
      status: 'active',
    }, connection);
    return { id: existing.id, milli };
  }
  const id = await reliefItemModel.create({
    requestId,
    itemName: input.name,
    itemKey,
    itemCategory: input.category,
    unit: input.unit,
    quantityRequested: milliToDb(milli),
    priority: input.priority || 'normal',
    notes: input.notes || null,
  }, connection);
  return { id, milli };
}

async function createRequest(user, incidentId, input, ctx = {}) {
  if (![USER_ROLES.ADMIN, USER_ROLES.VOLUNTEER].includes(user.role)) {
    throw new AppError('Only volunteers and administrators can create relief requests.', HTTP_STATUS.FORBIDDEN);
  }

  const items = input.items || [];
  const seen = new Set();
  items.forEach((it) => {
    const key = `${normalizeItemKey(it.name)}|${it.unit}`;
    if (seen.has(key)) {
      throw new AppError(`Duplicate item in request: "${it.name}" (${it.unit}).`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    seen.add(key);
  });

  const requestId = await runInTransaction(async (connection) => {
    const incident = await disasterIncidentModel.findByIdForUpdate(incidentId, connection);
    if (!incident || (!isAdmin(user) && !incidentIsPublic(incident.status))) {
      throw new AppError('Incident not found.', HTTP_STATUS.NOT_FOUND);
    }
    if (!RELIEF.OPEN_INCIDENT_STATUSES.includes(incident.status)) {
      throw new AppError('Relief requests can only be created for verified, active incidents.', HTTP_STATUS.CONFLICT, 'INCIDENT_NOT_OPEN');
    }

    const id = await reliefRequestModel.create({
      incidentId,
      title: input.title,
      description: input.description || null,
      locationName: input.locationName,
      address: input.address || null,
      deliveryInstructions: input.deliveryInstructions || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      priority: input.priority || 'normal',
      requestedBy: user.id,
      requestingOrganization: input.requestingOrganization || null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    }, connection);

    for (const item of items) {
      const { id: itemId } = await insertOrReactivateItem(id, item, connection);
      // Phase 5: the requested quantities as first submitted are part of the quantity history
      await recordQuantityHistory(connection, {
        request: { id, status: R.PENDING_REVIEW }, itemId, name: item.name, unit: item.unit, changeType: 'added',
        oldMilli: null, newMilli: parseQuantity(item.quantity), reason: 'Initial request', userId: user.id,
      });
    }
    return id;
  });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_REQUEST_CREATED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { requestId, incidentId, itemCount: items.length },
  });

  return getRequest(requestId, user);
}

async function attachItems(rows, user) {
  const itemRows = await reliefItemModel.findWithTotalsByRequestIds(rows.map((r) => r.id));
  const byRequest = new Map();
  itemRows.forEach((i) => {
    if (!byRequest.has(i.relief_request_id)) byRequest.set(i.relief_request_id, []);
    byRequest.get(i.relief_request_id).push(i);
  });
  return rows.map((r) => withItems(serializeRequest(r, levelFor(r, user)), byRequest.get(r.id) || []));
}

async function listRequests({ incidentId } = {}, query, user) {
  const { page, limit, offset } = getPaginationParams(query);
  const filters = { incidentId, priority: query.priority };

  if (incidentId) {
    const incident = await disasterIncidentModel.findById(incidentId);
    const visible = incident && (incidentIsPublic(incident.status) || isAdmin(user) || (user && incident.reported_by === user.id));
    if (!visible) throw new AppError('Incident not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (query.mine === 'true') {
    if (!user) throw new AppError('Authentication required.', HTTP_STATUS.UNAUTHORIZED);
    filters.requestedBy = user.id;
    if (query.status) filters.statuses = [query.status];
  } else if (isAdmin(user)) {
    if (query.status) filters.statuses = [query.status];
  } else {
    filters.statuses = query.status
      ? RELIEF.PUBLIC_REQUEST_STATUSES.filter((s) => s === query.status)
      : RELIEF.PUBLIC_REQUEST_STATUSES;
    if (filters.statuses.length === 0) filters.statuses = ['__none__'];
  }

  let [rows, total] = await Promise.all([
    reliefRequestModel.findAll(filters, { limit, offset }),
    reliefRequestModel.countAll(filters),
  ]);
  // public listings never include requests whose incident is not public
  if (!isAdmin(user) && query.mine !== 'true') rows = rows.filter((r) => incidentIsPublic(r.incident_status));

  return { requests: await attachItems(rows, user), meta: buildPaginationMeta({ page, limit, totalItems: total }) };
}

async function getRequest(id, user) {
  const row = await reliefRequestModel.findById(id);
  if (!row || !canViewRequest(row, user)) throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);
  const [serialized] = await attachItems([row], user);
  return serialized;
}

async function getFulfillmentSummary(id, user) {
  const request = await getRequest(id, user);
  return { requestId: request.id, status: request.status, summary: request.summary, items: request.items };
}

async function updateRequest(id, user, input, ctx = {}) {
  const map = {
    title: 'title', description: 'description', locationName: 'location_name', address: 'address', deliveryInstructions: 'delivery_instructions',
    latitude: 'latitude', longitude: 'longitude', priority: 'priority',
    requestingOrganization: 'requesting_organization', expiresAt: 'expires_at',
  };

  const { before, fields } = await runInTransaction(async (connection) => {
    const row = await reliefRequestModel.findByIdForUpdate(id, connection);
    if (!row) throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);
    assertCanModify(row, user);

    const updates = {};
    Object.entries(map).forEach(([key, column]) => {
      if (input[key] === undefined) return;
      if (column === 'expires_at') updates[column] = input[key] ? new Date(input[key]) : null;
      else updates[column] = input[key] === '' ? null : input[key];
    });
    const columns = Object.keys(updates);
    if (columns.length === 0) throw new AppError('No valid fields provided to update.', HTTP_STATUS.BAD_REQUEST);
    // Phase 5: the requester resubmitting after an admin asked for corrections clears that request.
    const clearCorrection = !isAdmin(user) && row.correction_requested_at;

    const lat = updates.latitude !== undefined ? updates.latitude : row.latitude;
    const lng = updates.longitude !== undefined ? updates.longitude : row.longitude;
    if ((lat === null) !== (lng === null)) {
      throw new AppError('Latitude and longitude must be provided together.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    await reliefRequestModel.updateById(id, clearCorrection ? { ...updates, correction_requested_at: null, correction_note: null } : updates, connection);
    const prior = {};
    columns.forEach((c) => { prior[c] = row[c] === undefined ? null : row[c]; });
    return { before: prior, fields: updates };
  });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_REQUEST_UPDATED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { requestId: id, changedFields: Object.keys(fields), before, after: fields },
  });
  return getRequest(id, user);
}

/**
 * Approve / reject / cancel / expire. Admin-only. Approval is NEVER implied by
 * creation: a request is created as pending_review and only this action can
 * make it open for pledges.
 */
async function changeRequestStatus(id, user, { status, notes }, ctx = {}) {
  if (!isAdmin(user)) throw new AppError('Only an administrator can change a relief request status.', HTTP_STATUS.FORBIDDEN);

  const result = await runInTransaction(async (connection) => {
    const row = await reliefRequestModel.findByIdForUpdate(id, connection);
    if (!row) throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);

    const allowed = TRANSITIONS[row.status] || [];
    if (!allowed.includes(status)) {
      throw new AppError(
        `Invalid status transition: ${row.status} -> ${status}. Allowed: ${allowed.join(', ') || 'none'}.`,
        HTTP_STATUS.CONFLICT,
        'INVALID_STATUS_TRANSITION'
      );
    }
    if ((status === R.REJECTED || status === R.CANCELLED) && !notes) {
      throw new AppError('A reason (notes) is required.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    const fields = { status };
    if (notes !== undefined) fields.review_notes = notes;
    let releasedPledges = 0;

    if (status === R.APPROVED) {
      const incident = await disasterIncidentModel.findById(row.incident_id, connection);
      if (!incident || !RELIEF.OPEN_INCIDENT_STATUSES.includes(incident.status)) {
        throw new AppError('The incident must be verified or active before its requests can be approved.', HTTP_STATUS.CONFLICT, 'INCIDENT_NOT_OPEN');
      }
      const items = await reliefItemModel.findWithTotalsByRequestIds([id], {}, connection);
      if (items.length === 0) {
        throw new AppError('A relief request needs at least one item before it can be approved.', HTTP_STATUS.CONFLICT);
      }
      fields.approved_by = user.id;
      fields.approved_at = new Date();
    } else {
      fields.closed_at = new Date();
      if (status === R.CANCELLED || status === R.EXPIRED) {
        // lock order: request -> items -> pledges
        await reliefItemModel.lockByRequestId(id, connection);
        const inTransit = await reliefPledgeModel.lockByRequestAndStatus(id, 'collected', connection);
        if (inTransit.length > 0) {
          throw new AppError(
            'Goods have already been collected for this request. Deliver or close those pledges first.',
            HTTP_STATUS.CONFLICT,
            'PLEDGES_IN_TRANSIT'
          );
        }
        const open = await reliefPledgeModel.lockByRequestAndStatus(id, 'pledged', connection);
        for (const pledge of open) {
          await reliefPledgeModel.updateById(pledge.id, {
            status: 'cancelled',
            cancelled_at: new Date(),
            cancelled_by: user.id,
            cancellation_reason: `Relief request ${status}`,
          }, connection);
        }
        releasedPledges = open.length;
      }
    }

    await reliefRequestModel.updateById(id, fields, connection);
    const alertEventIds = status === R.APPROVED
      ? await alertService.onReliefRequestApproved(connection, { requestId: id, incidentId: row.incident_id, actorId: user.id })
      : [];
    return { from: row.status, releasedPledges, alertEventIds };
  });
  alertService.dispatch(result.alertEventIds);

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_REQUEST_STATUS_CHANGED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { requestId: id, from: result.from, to: status, releasedPledges: result.releasedPledges, hasNotes: Boolean(notes) },
  });
  return getRequest(id, user);
}

/**
 * Marks an approved request completed when EVERY active item has been fully
 * DELIVERED (pledged/collected is not enough). Callers must already hold the
 * request row lock (findByIdForUpdate) so two concurrent final deliveries
 * cannot each miss the other. Returns true if the request was completed.
 */
async function completeRequestIfFulfilled(requestId, connection) {
  const request = await reliefRequestModel.findByIdForUpdate(requestId, connection);
  if (!request || request.status !== R.APPROVED) return false;
  const itemRows = await reliefItemModel.findWithTotalsByRequestIds([requestId], {}, connection);
  const summary = buildRequestSummary(itemRows.map((i) => serializeItem(i).quantities));
  if (!summary.isFullyFulfilled) return false;
  await reliefRequestModel.updateById(requestId, { status: R.COMPLETED, closed_at: new Date() }, connection);
  return true;
}

// ----------------------------------------------------------------------------
// Items
// ----------------------------------------------------------------------------


/**
 * Phase 5: every change to a requested quantity is written to relief_item_quantity_history
 * inside the same transaction. On an APPROVED request (pledges may already rely on the numbers)
 * an administrator must give a reason.
 */
function assertQuantityChangeReason(request, reason) {
  if (request.status === R.APPROVED && !(typeof reason === 'string' && reason.trim().length >= 3)) {
    throw new AppError('A reason is required when changing items or quantities of an approved request.', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'REASON_REQUIRED');
  }
}

async function recordQuantityHistory(connection, { request, itemId, name, unit, changeType, oldMilli, newMilli, reason, userId }) {
  await connection.query(
    `INSERT INTO relief_item_quantity_history
       (relief_request_id, item_id, item_name, unit, change_type, old_quantity, new_quantity, request_status, reason, changed_by)
     VALUES (:requestId, :itemId, :name, :unit, :changeType, :oldQ, :newQ, :status, :reason, :userId)`,
    {
      requestId: request.id, itemId, name, unit, changeType,
      oldQ: oldMilli === null ? null : milliToDb(oldMilli), newQ: newMilli === null ? null : milliToDb(newMilli),
      status: request.status, reason: reason ? String(reason).trim().slice(0, 500) : null, userId,
    }
  );
}

async function addItem(requestId, user, input, ctx = {}) {
  const itemId = await runInTransaction(async (connection) => {
    const request = await reliefRequestModel.findByIdForUpdate(requestId, connection);
    if (!request) throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);
    assertCanModify(request, user);
    assertQuantityChangeReason(request, input.reason);
    const { id } = await insertOrReactivateItem(requestId, input, connection);
    await recordQuantityHistory(connection, {
      request, itemId: id, name: input.name, unit: input.unit, changeType: 'added',
      oldMilli: null, newMilli: parseQuantity(input.quantity), reason: input.reason, userId: user.id,
    });
    return id;
  });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_ITEM_ADDED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { requestId, itemId, name: input.name, unit: input.unit, quantity: parseQuantity(input.quantity) / RELIEF.QUANTITY_SCALE },
  });
  return getItem(requestId, itemId, user);
}

async function getItem(requestId, itemId, user) {
  const request = await getRequest(requestId, user);
  const item = request.items.find((i) => i.id === itemId);
  if (!item) throw new AppError('Item not found.', HTTP_STATUS.NOT_FOUND);
  return item;
}

async function updateItem(requestId, itemId, user, input, ctx = {}) {
  const { before, after, alertEventIds } = await runInTransaction(async (connection) => {
    // lock order: request -> item (same as every pledge operation)
    const request = await reliefRequestModel.findByIdForUpdate(requestId, connection);
    if (!request) throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);
    assertCanModify(request, user);

    const item = await reliefItemModel.findByIdForUpdate(itemId, connection);
    if (!item || item.relief_request_id !== requestId) throw new AppError('Item not found.', HTTP_STATUS.NOT_FOUND);
    if (item.status !== 'active') throw new AppError('This item has been removed from the request.', HTTP_STATUS.CONFLICT);

    const pledges = await reliefItemModel.countPledges(itemId, connection);
    const updates = {};

    const identityChange = [
      input.name !== undefined && normalizeItemKey(input.name) !== item.item_key,
      input.unit !== undefined && input.unit !== item.unit,
      input.category !== undefined && input.category !== item.item_category,
    ].some(Boolean);
    if (identityChange && pledges.total > 0) {
      throw new AppError('Name, unit and category cannot be changed once pledges exist for this item.', HTTP_STATUS.CONFLICT);
    }
    if (input.name !== undefined) { updates.item_name = input.name; updates.item_key = normalizeItemKey(input.name); }
    if (input.unit !== undefined) updates.unit = input.unit;
    if (input.category !== undefined) updates.item_category = input.category;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.notes !== undefined) updates.notes = input.notes === '' ? null : input.notes;

    const finalUnit = updates.unit || item.unit;
    let newMilli = dbToMilli(item.quantity_requested);
    if (input.quantity !== undefined) newMilli = itemInputToRow(input, finalUnit);
    else if (updates.unit && !isValidForUnit(newMilli, finalUnit)) {
      throw new AppError(`Existing quantity is not valid for unit "${finalUnit}".`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    if (input.quantity !== undefined) {
      const totals = await reliefItemModel.getTotals(itemId, connection);
      const committed = dbToMilli(totals.active_pledged) + dbToMilli(totals.delivered);
      if (newMilli < committed) {
        throw new AppError(
          `Requested quantity cannot be lower than the ${milliToNumber(committed)} already pledged or delivered.`,
          HTTP_STATUS.CONFLICT,
          'QUANTITY_BELOW_COMMITTED'
        );
      }
      updates.quantity_requested = milliToDb(newMilli);
    }

    if (updates.item_key || updates.unit) {
      const dup = await reliefItemModel.findByKey(requestId, updates.item_key || item.item_key, finalUnit, connection);
      if (dup && dup.id !== itemId) {
        throw new AppError('Another item with the same name and unit already exists on this request.', HTTP_STATUS.CONFLICT, 'DUPLICATE_ITEM');
      }
    }
    if (Object.keys(updates).length === 0) throw new AppError('No valid fields provided to update.', HTTP_STATUS.BAD_REQUEST);

    if (updates.quantity_requested !== undefined && milliToDb(dbToMilli(item.quantity_requested)) !== updates.quantity_requested) {
      assertQuantityChangeReason(request, input.reason);
    }
    await reliefItemModel.updateById(itemId, updates, connection);
    if (updates.quantity_requested !== undefined && milliToDb(dbToMilli(item.quantity_requested)) !== updates.quantity_requested) {
      await recordQuantityHistory(connection, {
        request, itemId, name: updates.item_name || item.item_name, unit: updates.unit || item.unit, changeType: 'quantity_changed',
        oldMilli: dbToMilli(item.quantity_requested), newMilli: dbToMilli(updates.quantity_requested), reason: input.reason, userId: user.id,
      });
    }
    // Phase 4: a changed requested quantity on an APPROVED request is worth one relief update.
    const alertEventIds = (updates.quantity_requested !== undefined && request.status === R.APPROVED)
      ? await alertService.onReliefQuantityChanged(connection, { requestId, incidentId: request.incident_id, actorId: user.id })
      : [];
    return {
      before: { name: item.item_name, unit: item.unit, category: item.item_category, quantityRequested: Number(item.quantity_requested), priority: item.priority },
      after: { ...updates },
      alertEventIds,
    };
  });
  alertService.dispatch(alertEventIds);

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_ITEM_UPDATED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { requestId, itemId, before, after },
  });
  return getItem(requestId, itemId, user);
}

async function removeItem(requestId, itemId, user, ctx = {}, reason = null) {
  const mode = await runInTransaction(async (connection) => {
    const request = await reliefRequestModel.findByIdForUpdate(requestId, connection);
    if (!request) throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);
    assertCanModify(request, user);

    const item = await reliefItemModel.findByIdForUpdate(itemId, connection);
    if (!item || item.relief_request_id !== requestId) throw new AppError('Item not found.', HTTP_STATUS.NOT_FOUND);
    if (item.status !== 'active') throw new AppError('This item has already been removed.', HTTP_STATUS.CONFLICT);

    assertQuantityChangeReason(request, reason);
    const pledges = await reliefItemModel.countPledges(itemId, connection);
    if (pledges.nonCancelled > 0) {
      throw new AppError('This item has active or delivered pledges and cannot be removed. Cancel those pledges first.', HTTP_STATUS.CONFLICT, 'ITEM_HAS_PLEDGES');
    }
    await recordQuantityHistory(connection, {
      request, itemId, name: item.item_name, unit: item.unit, changeType: 'removed',
      oldMilli: dbToMilli(item.quantity_requested), newMilli: null, reason, userId: user.id,
    });
    if (pledges.total > 0) {
      await reliefItemModel.updateById(itemId, { status: 'cancelled' }, connection); // keep pledge history
      return 'cancelled';
    }
    await reliefItemModel.deleteById(itemId, connection); // history row keeps item_name/unit (item_id FK-free)
    return 'deleted';
  });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_ITEM_REMOVED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { requestId, itemId, mode },
  });
  return { itemId, mode };
}

module.exports = {
  createRequest, listRequests, getRequest, getFulfillmentSummary, updateRequest, changeRequestStatus,
  completeRequestIfFulfilled, addItem, updateItem, removeItem, TRANSITIONS,
};
