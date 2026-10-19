const disasterIncidentModel = require('../models/disasterIncident.model');
const reliefRequestModel = require('../models/reliefRequest.model');
const reliefItemModel = require('../models/reliefRequestItem.model');
const reliefPledgeModel = require('../models/reliefPledge.model');
const reliefRequestService = require('./reliefRequest.service');
const { withPledgeLocks } = require('./reliefLocking');
const { notifyRelief } = require('./reliefNotify');
const donationModel = require('../models/donation.model');
const savedAddressModel = require('../models/savedAddress.model');
const reliefTaskModel = require('../models/reliefTask.model');
const { buildReliefDonationPayload } = require('../utils/reliefDonationMapping');
const auditService = require('./audit.service');
const AppError = require('../utils/AppError');
const { runInTransaction } = require('../utils/dbTransaction');
const { serializePledge, serializeItem } = require('../utils/reliefSerializers');
const { serializeDonorTracking } = require('../utils/reliefTaskSerializers');
const {
  parseQuantity, milliToDb, dbToMilli, milliToNumber, isValidForUnit,
} = require('../utils/reliefQuantity');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { HTTP_STATUS, AUDIT_ACTIONS, RELIEF, USER_ROLES } = require('../constants');

const P = RELIEF.PLEDGE_STATUS;
const isAdmin = (user) => Boolean(user) && user.role === USER_ROLES.ADMIN;
const notFound = () => new AppError('Pledge not found.', HTTP_STATUS.NOT_FOUND);

function quantityOrThrow(value, unit, label = 'Quantity') {
  const milli = parseQuantity(value);
  if (milli === null) {
    throw new AppError(`${label} must be a positive number with at most 3 decimals.`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
  if (!isValidForUnit(milli, unit)) {
    throw new AppError(`${label} must be a whole number for unit "${unit}".`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
  return milli;
}

/** committed = activePledged + delivered — see utils/reliefQuantity.js. */
async function committedMilli(itemId, connection) {
  const totals = await reliefItemModel.getTotals(itemId, connection);
  return dbToMilli(totals.active_pledged) + dbToMilli(totals.delivered);
}

async function itemSummary(requestId, itemId) {
  const rows = await reliefItemModel.findWithTotalsByRequestIds([requestId], { includeCancelled: true });
  const row = rows.find((r) => r.id === itemId);
  return row ? serializeItem(row) : null;
}

async function assertRequestOpenForPledging(request, connection) {
  if (request.status !== RELIEF.REQUEST_STATUS.APPROVED) {
    throw new AppError('This relief request is not open for pledges.', HTTP_STATUS.CONFLICT, 'REQUEST_NOT_OPEN');
  }
  if (request.expires_at && new Date(request.expires_at).getTime() <= Date.now()) {
    throw new AppError('This relief request has expired.', HTTP_STATUS.CONFLICT, 'REQUEST_EXPIRED');
  }
  const incident = await disasterIncidentModel.findById(request.incident_id, connection);
  if (!incident || !RELIEF.OPEN_INCIDENT_STATUSES.includes(incident.status)) {
    throw new AppError('The related incident is no longer open for relief.', HTTP_STATUS.CONFLICT, 'INCIDENT_NOT_OPEN');
  }
}

/**
 * Resolves the donor's pickup details (a saved address of theirs, or a one-time address)
 * into the shape the existing donation record stores. Mirrors the rules of the normal
 * donation form: saved addresses must belong to the donor and carry coordinates, because
 * volunteers are matched by distance.
 */
async function resolvePickup(donorId, pickup) {
  if (pickup.savedAddressId) {
    const saved = await savedAddressModel.findById(pickup.savedAddressId);
    if (!saved) throw new AppError('Saved address not found.', HTTP_STATUS.NOT_FOUND);
    if (saved.user_id !== donorId) throw new AppError('You are not allowed to use this saved address.', HTTP_STATUS.FORBIDDEN);
    if (saved.latitude === null || saved.longitude === null) {
      throw new AppError('This saved address has no location coordinates. Please add a location to it first.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    return {
      pickupLocation: saved.full_address,
      savedAddressId: saved.id,
      contactPhone: pickup.contactPhone || saved.contact_phone,
      pickupAddressDetails: {
        label: saved.label, district: saved.district, area: saved.area, division: saved.division,
        landmark: saved.landmark, deliveryInstructions: saved.delivery_instructions,
        latitude: saved.latitude, longitude: saved.longitude,
        contactPersonName: saved.contact_person_name, contactPhone: saved.contact_phone,
      },
    };
  }
  const a = pickup.pickupAddress;
  return {
    pickupLocation: a.fullAddress,
    savedAddressId: null,
    contactPhone: pickup.contactPhone,
    pickupAddressDetails: {
      district: a.district, area: a.area, landmark: a.landmark, deliveryInstructions: a.deliveryInstructions,
      latitude: a.latitude, longitude: a.longitude, contactPersonName: a.contactPersonName,
    },
  };
}

// ----------------------------------------------------------------------------
// Create
// ----------------------------------------------------------------------------

async function createPledge(user, itemId, input, { idempotencyKey = null, ctx = {} } = {}) {
  const item0 = await reliefItemModel.findById(itemId);
  if (!item0) throw new AppError('Relief item not found.', HTTP_STATUS.NOT_FOUND);
  const requestId = item0.relief_request_id;

  let outcome;
  try {
    outcome = await runInTransaction(async (connection) => {
      const request = await reliefRequestModel.findByIdForShare(requestId, connection);
      // THE mutex: nobody else can pledge/alter this item until we commit.
      const item = await reliefItemModel.findByIdForUpdate(itemId, connection);
      if (!request || !item || item.status !== 'active') {
        throw new AppError('Relief item not found.', HTTP_STATUS.NOT_FOUND);
      }

      const milli = quantityOrThrow(input.quantity, item.unit);

      // Idempotent replay: same key + same request => return the original pledge.
      if (idempotencyKey) {
        const prior = await reliefPledgeModel.findByIdempotencyKey(user.id, idempotencyKey, connection);
        if (prior) {
          if (prior.relief_request_item_id !== itemId || dbToMilli(prior.quantity_pledged) !== milli) {
            throw new AppError('This Idempotency-Key was already used for a different pledge.', HTTP_STATUS.CONFLICT, 'IDEMPOTENCY_KEY_REUSED');
          }
          return { pledgeId: prior.id, replay: true };
        }
      }

      await assertRequestOpenForPledging(request, connection);

      const open = await reliefPledgeModel.findOpenByDonorAndItem(user.id, itemId, connection);
      if (open) {
        throw new AppError('You already have an open pledge for this item. Update or cancel it instead.', HTTP_STATUS.CONFLICT, 'DUPLICATE_PLEDGE');
      }

      const remaining = dbToMilli(item.quantity_requested) - (await committedMilli(itemId, connection));
      if (milli > remaining) {
        throw new AppError(
          `Only ${milliToNumber(Math.max(0, remaining))} ${item.unit} of "${item.item_name}" is still needed.`,
          HTTP_STATUS.CONFLICT,
          'OVER_PLEDGE'
        );
      }

      if (input.pickup && input.donationRequestId) {
        throw new AppError('Provide either new pickup details or an existing donation to link, not both.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
      }

      let donationRequestId = null;
      if (input.pickup) {
        // The pledge's logistics record: a normal donation_requests row, created in THIS transaction,
        // so a pledge and its pickup task either both exist or neither does.
        if (!input.pickup.contactPhone && !input.pickup.savedAddressId) {
          throw new AppError('A contact phone number is required for pickup.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
        const incident = await disasterIncidentModel.findById(request.incident_id, connection);
        const address = await resolvePickup(user.id, input.pickup);
        if (!address.contactPhone) throw new AppError('A contact phone number is required for pickup.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
        donationRequestId = await donationModel.create(
          buildReliefDonationPayload({ donorId: user.id, item, request, incident, quantityMilli: milli, address, pickup: input.pickup }),
          connection
        );
      } else if (input.donationRequestId) {
        const donation = await reliefPledgeModel.findDonationForLink(input.donationRequestId, connection);
        if (!donation || donation.is_deleted || donation.donor_id !== user.id) {
          throw new AppError('Donation record not found.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
        if (['cancelled', 'completed'].includes(donation.status)) {
          throw new AppError(`A ${donation.status} donation cannot be linked to a pledge.`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
        donationRequestId = donation.id;
      }

      const pledgeId = await reliefPledgeModel.create({
        itemId,
        donorId: user.id,
        quantityPledged: milliToDb(milli),
        donationRequestId,
        idempotencyKey,
        notes: input.notes || null,
      }, connection);
      return { pledgeId, replay: false, milli };
    });
  } catch (err) {
    // DB-level backstops (unique keys) surface as ER_DUP_ENTRY; translate to clean API errors.
    if (err && err.code === 'ER_DUP_ENTRY') {
      if (/uq_relief_pledges_idempotency/.test(err.message)) {
        const prior = await reliefPledgeModel.findByIdempotencyKey(user.id, idempotencyKey);
        if (prior) outcome = { pledgeId: prior.id, replay: true };
      } else if (/uq_relief_pledges_donation_request/.test(err.message)) {
        throw new AppError('That donation is already linked to another pledge.', HTTP_STATUS.CONFLICT, 'DONATION_ALREADY_LINKED');
      } else if (/one_open_per_donor_item/.test(err.message)) {
        throw new AppError('You already have an open pledge for this item. Update or cancel it instead.', HTTP_STATUS.CONFLICT, 'DUPLICATE_PLEDGE');
      }
    }
    if (!outcome) throw err;
  }

  if (!outcome.replay) {
    await auditService.record({
      userId: user.id,
      action: AUDIT_ACTIONS.RELIEF_PLEDGE_CREATED,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        pledgeId: outcome.pledgeId, itemId, requestId,
        quantity: milliToNumber(outcome.milli), linkedDonation: Boolean(input.donationRequestId),
        idempotent: Boolean(idempotencyKey),
      },
    });
  }

  const row = await reliefPledgeModel.findById(outcome.pledgeId);
  const tracking = row.donation_request_id ? serializeDonorTracking(await reliefTaskModel.findByPledgeId(outcome.pledgeId)) : null;
  return { pledge: { ...serializePledge(row), tracking }, item: await itemSummary(requestId, itemId), idempotentReplay: outcome.replay };
}

// ----------------------------------------------------------------------------
// Update / cancel (donor)
// ----------------------------------------------------------------------------

async function updatePledge(user, pledgeId, input, ctx = {}) {
  const { before, requestId, itemId } = await withPledgeLocks(pledgeId, {}, async ({ connection, request, item, pledge, donation }) => {
    if (pledge.donor_id !== user.id) throw notFound();
    if (pledge.status !== P.PLEDGED || dbToMilli(pledge.quantity_collected) > 0) {
      throw new AppError('Only a pledge that has not been collected yet can be changed.', HTTP_STATUS.CONFLICT, 'PLEDGE_NOT_EDITABLE');
    }
    await assertRequestOpenForPledging(request, connection);
    // Once a volunteer has accepted the pickup, the quantity they were asked to collect is fixed.
    if (donation && input.quantity !== undefined && donation.status !== 'pending') {
      throw new AppError(
        'A volunteer has already accepted this pickup, so the quantity can no longer be changed. You can cancel the pledge instead.',
        HTTP_STATUS.CONFLICT,
        'PLEDGE_LOCKED'
      );
    }

    const fields = {};
    const prior = { quantity: Number(pledge.quantity_pledged), notes: pledge.notes };
    if (input.quantity !== undefined) {
      const milli = quantityOrThrow(input.quantity, item.unit);
      const currentMilli = dbToMilli(pledge.quantity_pledged);
      const committedOthers = (await committedMilli(item.id, connection)) - currentMilli;
      const room = dbToMilli(item.quantity_requested) - committedOthers;
      if (milli > room) {
        throw new AppError(
          `Only ${milliToNumber(Math.max(0, room))} ${item.unit} of "${item.item_name}" can be pledged by you.`,
          HTTP_STATUS.CONFLICT,
          'OVER_PLEDGE'
        );
      }
      fields.quantity_pledged = milliToDb(milli);
    }
    if (input.notes !== undefined) fields.notes = input.notes === '' ? null : input.notes;
    if (Object.keys(fields).length === 0) throw new AppError('No valid fields provided to update.', HTTP_STATUS.BAD_REQUEST);

    await reliefPledgeModel.updateById(pledgeId, fields, connection);
    if (donation && fields.quantity_pledged !== undefined) {
      await donationModel.updateById(donation.id, { quantity: Math.max(1, Math.ceil(dbToMilli(fields.quantity_pledged) / 1000)) }, connection);
    }
    return { before: prior, requestId: request.id, itemId: item.id, after: fields };
  });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_PLEDGE_UPDATED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { pledgeId, itemId, requestId, before },
  });
  return viewPledge(pledgeId, user, itemId, requestId);
}

async function cancelPledge(user, pledgeId, { reason } = {}, ctx = {}) {
  const info = await withPledgeLocks(pledgeId, {}, async ({ connection, request, item, pledge, donation }) => {
    const admin = isAdmin(user);
    if (!admin && pledge.donor_id !== user.id) throw notFound();

    if (pledge.status === P.CANCELLED) {
      throw new AppError('This pledge is already cancelled.', HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    const cancellable = admin ? [P.PLEDGED, P.COLLECTED] : [P.PLEDGED];
    if (!cancellable.includes(pledge.status) || dbToMilli(pledge.quantity_delivered) > 0) {
      throw new AppError(
        pledge.status === P.COLLECTED && !admin
          ? 'Goods have already been collected; please contact an administrator to cancel.'
          : `A ${pledge.status} pledge cannot be cancelled.`,
        HTTP_STATUS.CONFLICT,
        'PLEDGE_NOT_CANCELLABLE'
      );
    }

    await reliefPledgeModel.updateById(pledgeId, {
      status: P.CANCELLED,
      cancelled_at: new Date(),
      cancelled_by: user.id,
      cancellation_reason: reason || null,
    }, connection);
    // The linked pickup task is cancelled with the pledge (existing 'cancelled' donation state).
    let notifyVolunteers = [];
    if (donation && !donation.is_deleted && ['pending', 'accepted', 'scheduled', 'on_the_way', 'picked_up'].includes(donation.status)) {
      await donationModel.softDelete(donation.id, connection, user.id);
      notifyVolunteers = [donation.volunteer_id, donation.assigned_member_id].filter(Boolean);
    }
    return { requestId: request.id, itemId: item.id, from: pledge.status, quantity: Number(pledge.quantity_pledged), donationId: donation ? donation.id : null, notifyVolunteers };
  });

  for (const volunteerId of new Set(info.notifyVolunteers)) {
    await notifyRelief(volunteerId, {
      title: 'Relief pickup cancelled',
      message: `The donor cancelled the relief pledge for pickup #${info.donationId}. You no longer need to collect it.`,
      relatedId: info.donationId,
    });
  }

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_PLEDGE_CANCELLED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { pledgeId, itemId: info.itemId, requestId: info.requestId, from: info.from, releasedQuantity: info.quantity, hasReason: Boolean(reason) },
  });
  return viewPledge(pledgeId, user, info.itemId, info.requestId);
}

// ----------------------------------------------------------------------------
// Fulfilment (admin or the volunteer assigned on the linked donation)
// ----------------------------------------------------------------------------

/**
 * Direct quantity entry is an ADMIN override (an administrator's entry is verified by
 * definition and audited). Volunteers never write delivered totals directly: they report
 * through the task endpoints and an admin verifies. Pledges that have a linked pickup task
 * must go through that flow so the donation lifecycle and the pledge cannot diverge.
 */
async function assertFulfiller(user, pledgeId, connection, pledge) {
  if (!isAdmin(user)) throw new AppError('Only an administrator can record quantities directly.', HTTP_STATUS.FORBIDDEN);
  if (pledge && pledge.donation_request_id) {
    throw new AppError(
      'This pledge has a pickup task. Use the task reports and delivery verification instead of recording quantities directly.',
      HTTP_STATUS.CONFLICT,
      'USE_TASK_FLOW'
    );
  }
}

async function recordCollection(user, pledgeId, input, ctx = {}) {
  const info = await withPledgeLocks(pledgeId, {}, async ({ connection, request, item, pledge }) => {
    await assertFulfiller(user, pledgeId, connection, pledge);
    if (![P.PLEDGED, P.COLLECTED].includes(pledge.status)) {
      throw new AppError(`Cannot record collection on a ${pledge.status} pledge.`, HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    const delta = quantityOrThrow(input.quantity, item.unit);
    const collected = dbToMilli(pledge.quantity_collected);
    const next = collected + delta;
    if (next > dbToMilli(pledge.quantity_pledged)) {
      throw new AppError(
        `Collected quantity cannot exceed the pledged ${Number(pledge.quantity_pledged)} ${item.unit}.`,
        HTTP_STATUS.CONFLICT,
        'COLLECTION_EXCEEDS_PLEDGE'
      );
    }
    await reliefPledgeModel.updateById(pledgeId, {
      quantity_collected: milliToDb(next),
      status: P.COLLECTED,
      collected_at: pledge.collected_at || new Date(),
    }, connection);
    return { requestId: request.id, itemId: item.id, added: milliToNumber(delta), total: milliToNumber(next) };
  });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_PLEDGE_COLLECTED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { pledgeId, itemId: info.itemId, requestId: info.requestId, added: info.added, collectedTotal: info.total },
  });
  return viewPledge(pledgeId, user, info.itemId, info.requestId);
}

async function recordDelivery(user, pledgeId, input, ctx = {}) {
  // exclusive request lock: the request may flip to 'completed' in this transaction
  const info = await withPledgeLocks(pledgeId, { requestExclusive: true }, async ({ connection, request, item, pledge }) => {
    await assertFulfiller(user, pledgeId, connection, pledge);
    if (pledge.status !== P.COLLECTED) {
      throw new AppError(
        pledge.status === P.PLEDGED
          ? 'Goods must be recorded as collected before they can be delivered.'
          : `Cannot record delivery on a ${pledge.status} pledge.`,
        HTTP_STATUS.CONFLICT,
        'INVALID_STATE_TRANSITION'
      );
    }
    const delta = quantityOrThrow(input.quantity, item.unit);
    const next = dbToMilli(pledge.quantity_delivered) + delta;
    if (next > dbToMilli(pledge.quantity_collected)) {
      throw new AppError(
        `Delivered quantity cannot exceed the ${Number(pledge.quantity_collected)} ${item.unit} collected.`,
        HTTP_STATUS.CONFLICT,
        'DELIVERY_EXCEEDS_COLLECTED'
      );
    }
    const full = next === dbToMilli(pledge.quantity_pledged);
    await reliefPledgeModel.updateById(pledgeId, {
      quantity_delivered: milliToDb(next),
      ...(full ? { status: P.DELIVERED, delivered_at: new Date() } : {}),
    }, connection);
    const requestCompleted = await reliefRequestService.completeRequestIfFulfilled(request.id, connection);
    return { requestId: request.id, itemId: item.id, added: milliToNumber(delta), total: milliToNumber(next), full, requestCompleted };
  });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_PLEDGE_DELIVERED,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { pledgeId, itemId: info.itemId, requestId: info.requestId, added: info.added, deliveredTotal: info.total, fullyDelivered: info.full },
  });
  if (info.requestCompleted) {
    await auditService.record({
      userId: user.id,
      action: AUDIT_ACTIONS.RELIEF_REQUEST_STATUS_CHANGED,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { requestId: info.requestId, from: 'approved', to: 'completed', automatic: true },
    });
  }
  return viewPledge(pledgeId, user, info.itemId, info.requestId);
}

/**
 * Ends a partly delivered pledge. Everything collected must already be delivered;
 * the undelivered shortfall is released (committed drops to what was delivered)
 * so other donors can pledge it.
 */
async function closePledgePartial(user, pledgeId, ctx = {}) {
  const info = await withPledgeLocks(pledgeId, { requestExclusive: true }, async ({ connection, request, item, pledge }) => {
    await assertFulfiller(user, pledgeId, connection, pledge);
    const pledged = dbToMilli(pledge.quantity_pledged);
    const collected = dbToMilli(pledge.quantity_collected);
    const delivered = dbToMilli(pledge.quantity_delivered);
    if (pledge.status !== P.COLLECTED) {
      throw new AppError(`Cannot close a ${pledge.status} pledge as partially fulfilled.`, HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    if (delivered === 0) {
      throw new AppError('Nothing has been delivered; cancel the pledge instead.', HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    if (delivered !== collected) {
      throw new AppError('Deliver everything that was collected before closing the pledge.', HTTP_STATUS.CONFLICT, 'COLLECTED_NOT_DELIVERED');
    }
    if (delivered >= pledged) {
      throw new AppError('This pledge is fully delivered.', HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    await reliefPledgeModel.updateById(pledgeId, { status: P.PARTIALLY_FULFILLED, delivered_at: new Date() }, connection);
    const requestCompleted = await reliefRequestService.completeRequestIfFulfilled(request.id, connection);
    return { requestId: request.id, itemId: item.id, delivered: milliToNumber(delivered), released: milliToNumber(pledged - delivered), requestCompleted };
  });

  await auditService.record({
    userId: user.id,
    action: AUDIT_ACTIONS.RELIEF_PLEDGE_CLOSED_PARTIAL,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    metadata: { pledgeId, itemId: info.itemId, requestId: info.requestId, delivered: info.delivered, releasedQuantity: info.released },
  });
  return viewPledge(pledgeId, user, info.itemId, info.requestId);
}

// ----------------------------------------------------------------------------
// Reads
// ----------------------------------------------------------------------------

async function viewPledge(pledgeId, user, itemId, requestId) {
  const row = await reliefPledgeModel.findById(pledgeId);
  const tracking = row.donation_request_id ? serializeDonorTracking(await reliefTaskModel.findByPledgeId(pledgeId)) : null;
  return {
    pledge: { ...serializePledge(row, { admin: isAdmin(user) }), tracking },
    item: await itemSummary(requestId || row.relief_request_id, itemId || row.relief_request_item_id),
  };
}

async function getPledge(user, pledgeId) {
  const row = await reliefPledgeModel.findById(pledgeId);
  if (!row) throw notFound();
  const allowed = isAdmin(user) || row.donor_id === user.id || (await reliefPledgeModel.isAssignedFulfiller(pledgeId, user.id));
  if (!allowed) throw notFound();
  return viewPledge(pledgeId, user, row.relief_request_item_id, row.relief_request_id);
}

async function listMyPledges(user, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const filters = { status: query.status };
  const [rows, total] = await Promise.all([
    reliefPledgeModel.findByDonor(user.id, { ...filters, limit, offset }),
    reliefPledgeModel.countByDonor(user.id, filters),
  ]);
  const pledges = await Promise.all(rows.map(async (r) => ({
    ...serializePledge(r),
    tracking: r.donation_request_id ? serializeDonorTracking(await reliefTaskModel.findByPledgeId(r.id)) : null,
  })));
  return { pledges, meta: buildPaginationMeta({ page, limit, totalItems: total }) };
}

async function listRequestPledges(requestId, query) {
  const request = await reliefRequestModel.findById(requestId);
  if (!request) throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);
  const { page, limit, offset } = getPaginationParams(query);
  const [rows, total] = await Promise.all([
    reliefPledgeModel.findByRequestId(requestId, { limit, offset }),
    reliefPledgeModel.countByRequestId(requestId),
  ]);
  return { pledges: rows.map((r) => serializePledge(r, { admin: true })), meta: buildPaginationMeta({ page, limit, totalItems: total }) };
}

module.exports = {
  createPledge, updatePledge, cancelPledge, recordCollection, recordDelivery, closePledgePartial,
  getPledge, listMyPledges, listRequestPledges,
};
