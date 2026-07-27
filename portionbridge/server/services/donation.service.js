const { pool } = require('../config/db');
const { HTTP_STATUS, DONATION_STATUS, NOTIFICATION_TYPES, AUDIT_ACTIONS, DONATION_CATEGORY } = require('../constants');
const AppError = require('../utils/AppError');
const donationModel = require('../models/donation.model');
const savedAddressModel = require('../models/savedAddress.model');
const notificationModel = require('../models/notification.model');
const notificationService = require('./notification.service');
const auditService = require('./audit.service');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { getIO } = require('../sockets/ioInstance');
const { broadcastTeamActivity } = require('../sockets/handlers/team.handler');
const teamMemberModel = require('../models/teamMember.model');

/**
 * Ownership check for donor-owned mutations (update/cancel). Kept separate
 * from assertEditable so a non-owning donor always gets 403, never a 409
 * that would leak the donation's current status. Same wording as
 * middleware/donation.middleware.js#restrictToDonationOwner's message, for
 * consistency between the fast pre-check and the real, transaction-safe check.
 * @param {Object} donation - Donation object with donor_id property
 * @param {number} donorId - ID of the donor attempting the mutation
 * @throws {AppError} If donor does not own this donation
 */
function assertDonorOwnership(donation, donorId) {
  if (donation.donor_id !== donorId) {
    throw new AppError('You are not allowed to modify this donation request.', HTTP_STATUS.FORBIDDEN);
  }
}

/**
 * Asserts that a donation is in an editable state (PENDING).
 * @param {Object} donation - Donation object with status property
 * @throws {AppError} If donation status is not PENDING
 */
function assertEditable(donation) {
  if (donation.status !== DONATION_STATUS.PENDING) {
    throw new AppError(
      `This donation request can no longer be edited or cancelled because its status is "${donation.status}". Only pending requests can be modified.`,
      HTTP_STATUS.CONFLICT
    );
  }
}

/**
 * Maps camelCase request fields to snake_case database columns.
 * @param {Object} updates - Updates object with camelCase keys
 * @returns {Object} Object with snake_case keys for database columns
 */
function mapToSnakeCase(updates) {
  const fieldMap = {
    title: 'title',
    category: 'category',
    foodType: 'food_type',
    foodName: 'food_name',
    quantity: 'quantity',
    quantityUnit: 'quantity_unit',
    numberOfServings: 'number_of_servings',
    pickupLocation: 'pickup_location',
    pickupTime: 'pickup_time',
    pickupDate: 'pickup_date',
    pickupTimeSlot: 'pickup_time_slot',
    expiryDate: 'expiry_date',
    contactPhone: 'contact_phone',
    description: 'description',
    photo: 'photo',
    ingredients: 'ingredients',
    allergens: 'allergens',
    storageRequirement: 'storage_requirement',
    isVegetarian: 'is_vegetarian',
    isHalal: 'is_halal',
    refrigerationRequired: 'refrigeration_required',
    clothingCategory: 'clothing_category',
    gender: 'gender',
    ageGroup: 'age_group',
    itemCondition: 'item_condition',
    brand: 'brand',
    size: 'size',
    color: 'color',
    season: 'season',
    images: 'images',
    additionalNotes: 'additional_notes',
    savedAddressId: 'saved_address_id',
    pickupAddressDetails: 'pickup_address_details',
  };

  const fields = {};
  for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
    if (updates[camelKey] !== undefined) {
      // Handle JSON fields
      if (['allergens', 'images', 'pickup_address_details'].includes(snakeKey) && updates[camelKey]) {
        fields[snakeKey] = JSON.stringify(updates[camelKey]);
      } else {
        fields[snakeKey] = updates[camelKey];
      }
    }
  }
  return fields;
}

/**
 * Creates a new donation request.
 * Handles both saved address and one-time address approaches.
 * @param {number} donorId - ID of the donor creating the request
 * @param {Object} data - Donation data
 * @returns {Promise<Object>} The newly created donation object
 */
async function createDonation(donorId, data) {
  let pickupLocation = data.pickupLocation;
  let savedAddressId = data.savedAddressId || null;
  let pickupAddressDetails = null;

  // Handle saved address approach
  if (data.savedAddressId) {
    const savedAddress = await savedAddressModel.findById(data.savedAddressId);
    
    if (!savedAddress) {
      throw new AppError('Saved address not found.', HTTP_STATUS.NOT_FOUND);
    }

    if (savedAddress.user_id !== donorId) {
      throw new AppError('You are not allowed to use this saved address.', HTTP_STATUS.FORBIDDEN);
    }

    pickupLocation = savedAddress.full_address;
    savedAddressId = savedAddress.id;
    pickupAddressDetails = {
      label: savedAddress.label,
      customLabel: savedAddress.custom_label,
      division: savedAddress.division,
      district: savedAddress.district,
      area: savedAddress.area,
      postalCode: savedAddress.postal_code,
      buildingName: savedAddress.building_name,
      floor: savedAddress.floor,
      landmark: savedAddress.landmark,
      deliveryInstructions: savedAddress.delivery_instructions,
      latitude: savedAddress.latitude,
      longitude: savedAddress.longitude,
      contactPersonName: savedAddress.contact_person_name,
      contactPhone: savedAddress.contact_phone,
    };
  }
  // Handle one-time address approach
  else if (data.pickupAddress) {
    pickupLocation = data.pickupAddress.fullAddress;
    pickupAddressDetails = data.pickupAddress;

    // Save for future if requested
    if (data.saveForFuture) {
      const currentCount = await savedAddressModel.countByUserId(donorId);
      if (currentCount >= 3) {
        throw new AppError(
          'Maximum 3 saved addresses allowed. Cannot save this address.',
          HTTP_STATUS.CONFLICT
        );
      }

      await savedAddressModel.create({
        userId: donorId,
        label: data.pickupAddress.label || 'other',
        customLabel: data.pickupAddress.customLabel,
        fullAddress: data.pickupAddress.fullAddress,
        division: data.pickupAddress.division,
        district: data.pickupAddress.district,
        area: data.pickupAddress.area,
        postalCode: data.pickupAddress.postalCode,
        buildingName: data.pickupAddress.buildingName,
        floor: data.pickupAddress.floor,
        landmark: data.pickupAddress.landmark,
        deliveryInstructions: data.pickupAddress.deliveryInstructions,
        latitude: data.pickupAddress.latitude,
        longitude: data.pickupAddress.longitude,
        contactPersonName: data.pickupAddress.contactPersonName,
        contactPhone: data.pickupAddress.contactPhone,
        isDefault: currentCount === 0,
      });
    }
  }

  // Validate category-specific required fields
  if (data.category === DONATION_CATEGORY.FOOD) {
    if (!data.foodType || !data.foodName) {
      throw new AppError(
        'Food type and food name are required for food donations.',
        HTTP_STATUS.BAD_REQUEST
      );
    }
  } else if (data.category === DONATION_CATEGORY.CLOTHES) {
    if (!data.clothingCategory || !data.gender || !data.ageGroup || !data.itemCondition) {
      throw new AppError(
        'Clothing category, gender, age group, and condition are required for clothes donations.',
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  const insertId = await donationModel.create({
    donorId,
    title: data.title,
    category: data.category,
    quantity: data.quantity,
    quantityUnit: data.quantityUnit,
    numberOfServings: data.numberOfServings,
    pickupLocation,
    pickupTime: data.pickupTime,
    pickupDate: data.pickupDate,
    pickupTimeSlot: data.pickupTimeSlot,
    expiryDate: data.expiryDate,
    contactPhone: data.contactPhone,
    description: data.description,
    photo: data.photo,
    foodType: data.foodType,
    foodName: data.foodName,
    ingredients: data.ingredients,
    allergens: data.allergens,
    storageRequirement: data.storageRequirement,
    isVegetarian: data.isVegetarian,
    isHalal: data.isHalal,
    refrigerationRequired: data.refrigerationRequired,
    clothingCategory: data.clothingCategory,
    gender: data.gender,
    ageGroup: data.ageGroup,
    itemCondition: data.itemCondition,
    brand: data.brand,
    size: data.size,
    color: data.color,
    season: data.season,
    images: data.images,
    additionalNotes: data.additionalNotes,
    savedAddressId,
    pickupAddressDetails,
  });

  return donationModel.findById(insertId);
}

/**
 * Updates an existing donation request.
 *
 * RACE CONDITION FIX: previously trusted the `donation` object loaded by
 * the loadDonation middleware earlier in the request pipeline — a
 * volunteer could accept the donation between that unlocked read and this
 * write, and the edit would still incorrectly succeed against a donation
 * that was no longer pending.
 *
 * Now locks the row with SELECT ... FOR UPDATE inside a real transaction,
 * re-reads it, and re-verifies existence + ownership + not-deleted +
 * still-pending before writing. loadDonation + restrictToDonationOwner
 * still run first in the route (unchanged) as a fast, non-transactional
 * pre-check/404 for the common case — this is now the actual source of
 * truth, re-checked against a row a concurrent request can't modify out
 * from under it.
 * @param {number} donationId - Donation ID to update
 * @param {number} donorId - ID of the donor requesting the update
 * @param {Object} updates - Fields to update (camelCase)
 * @returns {Promise<Object>} The updated donation object
 */
async function updateDonation(donationId, donorId, updates) {
  const fields = mapToSnakeCase(updates);

  const connection = await pool.getConnection();
  let updatedDonation;

  try {
    await connection.beginTransaction();

    const donation = await donationModel.findByIdForUpdate(connection, donationId);

    if (!donation || donation.is_deleted) {
      throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
    }

    assertDonorOwnership(donation, donorId);
    assertEditable(donation);

    // MODULE 8 FINAL AUDIT: moved after the ownership/status checks above
    // — a non-owning donor, or one targeting a non-pending donation,
    // should always get 403/409 rather than a 400 about an empty request
    // body, regardless of what else is also wrong with the request.
    if (Object.keys(fields).length === 0) {
      throw new AppError('No valid fields provided to update.', HTTP_STATUS.BAD_REQUEST);
    }

    await donationModel.updateById(donationId, fields, connection);
    updatedDonation = await donationModel.findByIdForUpdate(connection, donationId);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return updatedDonation;
}

/**
 * Cancels (soft-deletes) a donation request.
 *
 * RACE CONDITION FIX: same reasoning as updateDonation above — locks and
 * re-verifies inside a transaction instead of trusting the middleware's
 * earlier, unlocked read.
 * @param {number} donationId - Donation ID to cancel
 * @param {number} donorId - ID of the donor requesting cancellation
 * @returns {Promise<void>}
 */
async function cancelDonation(donationId, donorId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const donation = await donationModel.findByIdForUpdate(connection, donationId);

    if (!donation || donation.is_deleted) {
      throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
    }

    assertDonorOwnership(donation, donorId);
    assertEditable(donation);

    await donationModel.softDelete(donationId, connection);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Lists pending donations for volunteers to browse, with search/filter/sort/pagination.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing donations array and pagination meta
 */
async function browseDonations(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { category, location, search, sortBy, sortOrder } = query;

  const filters = { category, location, search };

  const [donations, totalItems] = await Promise.all([
    donationModel.findPendingList({ ...filters, sortBy, sortOrder, limit, offset }),
    donationModel.countPendingList(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { donations, meta };
}

/**
 * Accepts a pending donation on behalf of a volunteer.
 *
 * Wraps the row-locking model call in a real DB transaction:
 *   - BEGIN
 *   - SELECT ... FOR UPDATE (inside the model) to serialize concurrent accepts
 *   - UPDATE if still pending, or bail out with null
 *   - COMMIT on success / ROLLBACK on any failure (including "no longer pending")
 *
 * If a second volunteer's request loses the race — the first volunteer's
 * transaction already committed the status change — this throws a 409
 * Conflict with a message explaining the donation is no longer available.
 * @param {number} donationId - Donation ID to accept
 * @param {number} volunteerId - ID of the volunteer accepting
 * @returns {Promise<Object>} The accepted donation object
 * @throws {AppError} If donation is no longer available to accept
 */
async function acceptDonation(donationId, volunteerId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const donation = await donationModel.acceptDonation(connection, donationId, volunteerId);

    if (!donation) {
      throw new AppError(
        'This donation request is no longer available to accept. It may have already been accepted, completed, cancelled, or removed.',
        HTTP_STATUS.CONFLICT
      );
    }

    await connection.commit();

    // trg_donation_status_update already inserted a 'donation_accepted'
    // notification for the donor as part of this same transaction —
    // fetch and deliver it now rather than inserting a duplicate.
    await notificationService.deliverLatestForRelated(donation.donor_id, donation.id);

    return donation;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Ownership check shared by every volunteer-driven status transition
 * (schedule, on-the-way, picked-up). Deliberately separate from the
 * status assertions so the two failure modes stay distinguishable
 * (403 vs 409) instead of collapsing into one generic error.
 * Supports both individual mode (volunteer_id) and team mode (assigned_member_id).
 * @param {Object} donation - Donation object with volunteer_id and assignment_mode properties
 * @param {number} volunteerId - ID of the volunteer attempting the action
 * @throws {AppError} If volunteer is not the assigned volunteer
 */
function assertAssignedVolunteer(donation, volunteerId) {
  // For team mode, check assigned_member_id
  if (donation.assignment_mode === 'team') {
    if (donation.assigned_member_id !== volunteerId) {
      throw new AppError(
        'You are not the assigned team member for this donation request.',
        HTTP_STATUS.FORBIDDEN
      );
    }
  } else {
    // For individual mode, check volunteer_id
    if (donation.volunteer_id !== volunteerId) {
      throw new AppError(
        'You are not the assigned volunteer for this donation request.',
        HTTP_STATUS.FORBIDDEN
      );
    }
  }
}

/**
 * Ownership check for the donor-driven completion step (Module 9).
 * Mirrors assertAssignedVolunteer's reasoning: kept separate from the
 * status assertion so a non-owning donor always gets 403, never a 409
 * that would leak the donation's current status.
 * @param {Object} donation - Donation object with donor_id property
 * @param {number} donorId - ID of the donor attempting to complete
 * @throws {AppError} If donor does not own this donation
 */
function assertDonationOwner(donation, donorId) {
  if (donation.donor_id !== donorId) {
    throw new AppError(
      'You are not allowed to complete this donation request.',
      HTTP_STATUS.FORBIDDEN
    );
  }
}

/**
 * Asserts that a donation is in ACCEPTED status (required for scheduling).
 * @param {Object} donation - Donation object with status property
 * @throws {AppError} If donation status is not ACCEPTED
 */
function assertAcceptedStatus(donation) {
  if (donation.status !== DONATION_STATUS.ACCEPTED) {
    throw new AppError(
      `This donation request cannot be scheduled because its status is "${donation.status}". Only accepted requests can be scheduled.`,
      HTTP_STATUS.CONFLICT
    );
  }
}

/**
 * Asserts that a donation is in SCHEDULED status (required to mark on-the-way).
 * @param {Object} donation - Donation object with status property
 * @throws {AppError} If donation status is not SCHEDULED
 */
function assertScheduledStatus(donation) {
  if (donation.status !== DONATION_STATUS.SCHEDULED) {
    throw new AppError(
      `This donation request cannot be marked as on the way because its status is "${donation.status}". Only scheduled requests can move to on-the-way.`,
      HTTP_STATUS.CONFLICT
    );
  }
}

/**
 * Asserts that a donation is in ON_THE_WAY status (required to mark picked up).
 * @param {Object} donation - Donation object with status property
 * @throws {AppError} If donation status is not ON_THE_WAY
 */
function assertOnTheWayStatus(donation) {
  if (donation.status !== DONATION_STATUS.ON_THE_WAY) {
    throw new AppError(
      `This donation request cannot be marked as picked up because its status is "${donation.status}". Only donations that are on the way can be marked picked up.`,
      HTTP_STATUS.CONFLICT
    );
  }
}

/**
 * Asserts that a donation is in PICKED_UP status (required for completion).
 * Module 9: this is now the precondition for completeDonation — it used to
 * be SCHEDULED, back when the volunteer completed directly after scheduling.
 * @param {Object} donation - Donation object with status property
 * @throws {AppError} If donation status is not PICKED_UP
 */
function assertPickedUpStatus(donation) {
  if (donation.status !== DONATION_STATUS.PICKED_UP) {
    throw new AppError(
      `This donation request cannot be completed because its status is "${donation.status}". Only picked-up requests can be completed.`,
      HTTP_STATUS.CONFLICT
    );
  }
}

/**
 * The assigned volunteer schedules a pickup time for a donation they've
 * already accepted.
 * @param {Object} donation - Donation object from middleware
 * @param {number} volunteerId - ID of the volunteer scheduling
 * @param {string} scheduledAt - ISO 8601 datetime for scheduled pickup
 * @returns {Promise<Object>} The updated donation object
 */
async function schedulePickup(donation, volunteerId, scheduledAt) {
  // MODULE 8 FINAL AUDIT: authorization/status checks now run before
  // input-shape validation — defense-in-depth for any future non-REST
  // caller. Via the current REST route this is unreachable in practice,
  // since schedulePickupValidationRules already rejects an invalid/past
  // scheduledAt before this service function is ever called.
  assertAssignedVolunteer(donation, volunteerId);
  assertAcceptedStatus(donation);

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new AppError('scheduledAt must be a valid date/time.', HTTP_STATUS.BAD_REQUEST);
  }
  if (scheduledDate.getTime() <= Date.now()) {
    throw new AppError('scheduledAt must be in the future.', HTTP_STATUS.BAD_REQUEST);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updatedDonation = await donationModel.schedulePickup(connection, donation.id, scheduledAt);

    if (!updatedDonation) {
      throw new AppError(
        'This donation request cannot be scheduled. It may have already been scheduled, completed, cancelled, or removed.',
        HTTP_STATUS.CONFLICT
      );
    }

    // Not covered by trg_donation_status_update (which only handles
    // 'accepted' and 'completed') — inserted explicitly here, inside the
    // same transaction as the status update, same pattern already used
    // by markOnTheWay/markPickedUp below.
    const notificationId = await notificationModel.create(connection, {
      userId: updatedDonation.donor_id,
      type: NOTIFICATION_TYPES.STATUS_UPDATED,
      title: 'Pickup scheduled',
      message: `A pickup has been scheduled for your donation request #${updatedDonation.id}.`,
      relatedId: updatedDonation.id,
    });

    await connection.commit();

    await notificationService.deliverById(updatedDonation.donor_id, notificationId);

    return updatedDonation;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * The assigned volunteer marks a scheduled donation as "on the way" (Module 9,
 * step 1 of the expanded live status flow: scheduled -> on_the_way).
 *
 * Same transaction-safe row-lock pattern as schedulePickup. The DB trigger
 * (trg_donation_status_update) only creates notifications for 'accepted' and
 * 'completed' transitions, so the donor notification is created explicitly
 * here, inside the same transaction as the status update, for atomicity.
 * Audit logging happens after commit, following the existing non-transactional
 * audit.service.js convention (failures there must never break this flow).
 * @param {Object} donation - Donation object from middleware
 * @param {number} volunteerId - ID of the volunteer marking on-the-way
 * @param {Object} [auditContext]
 * @param {string} [auditContext.ipAddress]
 * @param {string} [auditContext.userAgent]
 * @returns {Promise<Object>} The updated donation object
 */
async function markOnTheWay(donation, volunteerId, { ipAddress, userAgent } = {}) {
  assertAssignedVolunteer(donation, volunteerId);
  assertScheduledStatus(donation);

  const connection = await pool.getConnection();
  let updatedDonation;

  try {
    await connection.beginTransaction();

    updatedDonation = await donationModel.markOnTheWay(connection, donation.id);

    if (!updatedDonation) {
      throw new AppError(
        'This donation request can no longer be marked as on the way. Its status may have changed.',
        HTTP_STATUS.CONFLICT
      );
    }

    const notificationId = await notificationModel.create(connection, {
      userId: updatedDonation.donor_id,
      type: NOTIFICATION_TYPES.STATUS_UPDATED,
      title: 'Your volunteer is on the way',
      message: `The volunteer is on the way to pick up donation request #${updatedDonation.id}.`,
      relatedId: updatedDonation.id,
    });

    await connection.commit();

    // Real-time delivery happens AFTER commit — never tell a connected
    // client about a notification that might still be rolled back.
    await notificationService.deliverById(updatedDonation.donor_id, notificationId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  await auditService.record({
    userId: volunteerId,
    action: AUDIT_ACTIONS.DONATION_ON_THE_WAY,
    ipAddress,
    userAgent,
    metadata: { donationId: donation.id },
  });

  return updatedDonation;
}

/**
 * The assigned volunteer marks an on-the-way donation as "picked up"
 * (Module 9, step 2: on_the_way -> picked_up).
 *
 * Same pattern as markOnTheWay: transaction-wrapped status update + explicit
 * donor notification (not covered by the DB trigger), audit logged post-commit.
 * @param {Object} donation - Donation object from middleware
 * @param {number} volunteerId - ID of the volunteer marking picked-up
 * @param {Object} [auditContext]
 * @param {string} [auditContext.ipAddress]
 * @param {string} [auditContext.userAgent]
 * @returns {Promise<Object>} The updated donation object
 */
async function markPickedUp(donation, volunteerId, { ipAddress, userAgent } = {}) {
  assertAssignedVolunteer(donation, volunteerId);
  assertOnTheWayStatus(donation);

  const connection = await pool.getConnection();
  let updatedDonation;

  try {
    await connection.beginTransaction();

    updatedDonation = await donationModel.markPickedUp(connection, donation.id);

    if (!updatedDonation) {
      throw new AppError(
        'This donation request can no longer be marked as picked up. Its status may have changed.',
        HTTP_STATUS.CONFLICT
      );
    }

    const notificationId = await notificationModel.create(connection, {
      userId: updatedDonation.donor_id,
      type: NOTIFICATION_TYPES.STATUS_UPDATED,
      title: 'Your donation has been picked up',
      message: `Donation request #${updatedDonation.id} has been picked up by the volunteer.`,
      relatedId: updatedDonation.id,
    });

    await connection.commit();

    await notificationService.deliverById(updatedDonation.donor_id, notificationId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  await auditService.record({
    userId: volunteerId,
    action: AUDIT_ACTIONS.DONATION_PICKED_UP,
    ipAddress,
    userAgent,
    metadata: { donationId: donation.id },
  });

  return updatedDonation;
}

/**
 * The donor marks a picked-up donation as completed (Module 9, final step:
 * picked_up -> completed).
 *
 * BEHAVIOR CHANGE (Module 9): previously the ASSIGNED VOLUNTEER completed a
 * SCHEDULED donation directly. The live status flow now runs
 * scheduled -> on_the_way -> picked_up -> completed, and completion is the
 * DONOR's confirmation step, not the volunteer's — see markOnTheWay/
 * markPickedUp above for the two new volunteer-driven steps in between.
 *
 * Same transaction-safe pattern as before: locks the row with
 * SELECT ... FOR UPDATE inside a real DB transaction before validating.
 * Ownership is checked before status, so a non-owning donor always gets
 * 403, never a 409 that would leak the donation's current status.
 *
 * Does NOT insert an app-level notification — trg_donation_status_update
 * already notifies both the donor and the volunteer when status becomes
 * 'completed', so doing it here too would duplicate it.
 * @param {number} donationId - Donation ID to complete
 * @param {number} donorId - ID of the donor completing it
 * @param {Object} [auditContext]
 * @param {string} [auditContext.ipAddress]
 * @param {string} [auditContext.userAgent]
 * @returns {Promise<Object>} The updated donation object
 */
async function completeDonation(donationId, donorId, { ipAddress, userAgent } = {}) {
  const connection = await pool.getConnection();
  let updatedDonation;

  try {
    await connection.beginTransaction();

    const donation = await donationModel.findByIdForUpdate(connection, donationId);

    if (!donation || donation.is_deleted) {
      throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
    }

    assertDonationOwner(donation, donorId);
    assertPickedUpStatus(donation);

    updatedDonation = await donationModel.completeDonation(connection, donationId);

    await connection.commit();

    // trg_donation_status_update already inserted the 'completed'
    // notifications (donor always, volunteer too when assigned) as part
    // of this same transaction — fetch and deliver both now rather than
    // inserting duplicates.
    await notificationService.deliverLatestForRelated(updatedDonation.donor_id, updatedDonation.id);

    // If team mode, broadcast to team
    if (updatedDonation.assignment_mode === 'team' && updatedDonation.team_id) {
      const io = getIO();
      if (io) {
        broadcastTeamActivity(io, updatedDonation.team_id, 'donation_completed', {
          donationId: updatedDonation.id,
          completedBy: donorId,
        });
      }
    }
    if (updatedDonation.volunteer_id) {
      await notificationService.deliverLatestForRelated(updatedDonation.volunteer_id, updatedDonation.id);
    }
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  await auditService.record({
    userId: donorId,
    action: AUDIT_ACTIONS.DONATION_COMPLETED,
    ipAddress,
    userAgent,
    metadata: { donationId },
  });

  return updatedDonation;
}

/**
 * Full donation history for a donor (any status, excluding soft-deleted),
 * with search/filter/sort/pagination. Pure orchestration — all SQL lives
 * in the model.
 * @param {number} donorId - ID of the donor
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing donations array and pagination meta
 */
async function getDonorHistory(donorId, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { status, category, search, sortBy, sortOrder } = query;
  const filters = { status, category, search };

  const [donations, totalItems] = await Promise.all([
    donationModel.findDonorHistory(donorId, { ...filters, sortBy, sortOrder, limit, offset }),
    donationModel.countDonorHistory(donorId, filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { donations, meta };
}

/**
 * Full donation history for a volunteer (donations assigned to them,
 * excluding soft-deleted), with the same search/filter/sort/pagination
 * contract as getDonorHistory.
 * @param {number} volunteerId - ID of the volunteer
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing donations array and pagination meta
 */
async function getVolunteerHistory(volunteerId, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { status, category, search, sortBy, sortOrder } = query;
  const filters = { status, category, search };

  const [donations, totalItems] = await Promise.all([
    donationModel.findVolunteerHistory(volunteerId, { ...filters, sortBy, sortOrder, limit, offset }),
    donationModel.countVolunteerHistory(volunteerId, filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { donations, meta };
}

/**
 * mysql2 returns SUM(...) aggregate results as DECIMAL, which the driver
 * surfaces as strings — this normalizes every field on the summary row
 * into a plain JS number before it reaches the API response.
 * @param {Object} row - Summary row from database
 * @returns {Object} Normalized summary object with number values
 */
function normalizeSummaryCounts(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));
}

/**
 * Gets summary counts for a donor's donation history.
 * @param {number} donorId - ID of the donor
 * @returns {Promise<Object>} Normalized summary object with total and status counts
 */
async function getDonorHistorySummary(donorId) {
  const summary = await donationModel.getDonorSummary(donorId);
  return normalizeSummaryCounts(summary);
}

/**
 * Gets summary counts for a volunteer's assigned donation history.
 * @param {number} volunteerId - ID of the volunteer
 * @returns {Promise<Object>} Normalized summary object with total and status counts
 */
async function getVolunteerHistorySummary(volunteerId) {
  const summary = await donationModel.getVolunteerSummary(volunteerId);
  return normalizeSummaryCounts(summary);
}

/**
 * Accepts a pending donation on behalf of a team.
 * @param {number} donationId - Donation ID to accept
 * @param {number} teamId - Team ID accepting the donation
 * @param {number} leaderId - Team leader ID
 * @returns {Promise<Object>} The accepted donation object
 * @throws {AppError} If donation is no longer available to accept
 */
async function acceptDonationForTeam(donationId, teamId, leaderId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const donation = await donationModel.acceptDonationForTeam(connection, donationId, teamId, leaderId);

    if (!donation) {
      throw new AppError(
        'This donation request is no longer available to accept. It may have already been accepted, completed, cancelled, or removed.',
        HTTP_STATUS.CONFLICT
      );
    }

    await connection.commit();

    // Notify donor
    await notificationService.createNotification(donation.donor_id, {
      type: NOTIFICATION_TYPES.DONATION_ACCEPTED,
      title: 'Donation Accepted',
      message: 'Your donation has been accepted by a team.',
      relatedId: donation.id,
    });

    // Log audit
    await auditService.logAudit(leaderId, 'team_donation_accepted', { donationId, teamId });

    return donation;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Assigns a team member to a team-assigned donation.
 * @param {number} donationId - Donation ID
 * @param {number} teamId - Team ID
 * @param {number} memberId - Member ID to assign
 * @param {number} assignedBy - User ID assigning the member (leader)
 * @returns {Promise<void>}
 */
async function assignTeamMemberToDonation(donationId, teamId, memberId, assignedBy) {
  const donation = await donationModel.findById(donationId);

  if (!donation) {
    throw new AppError('Donation not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (donation.assignment_mode !== 'team' || donation.team_id !== teamId) {
    throw new AppError('This donation is not assigned to this team.', HTTP_STATUS.FORBIDDEN);
  }

  await donationModel.assignTeamMember(donationId, teamId, memberId, assignedBy);

  // Notify the assigned member
  await notificationService.createNotification(memberId, {
    type: NOTIFICATION_TYPES.TEAM_DONATION_ASSIGNED,
    title: 'Donation Assigned',
    message: 'You have been assigned to a donation pickup.',
    relatedId: donationId,
  });

  // Broadcast team activity
  const io = getIO();
  if (io) {
    broadcastTeamActivity(io, teamId, 'donation_assigned', {
      donationId,
      memberId,
      assignedBy,
    });
  }

  // Log audit
  await auditService.logAudit(assignedBy, 'team_member_assigned', { donationId, teamId, memberId });
}

/**
 * Gets donations assigned to a team.
 * @param {number} teamId - Team ID
 * @param {string} [status] - Optional status filter
 * @returns {Promise<Array>} Array of donation objects
 */
async function getTeamDonations(teamId, status = null) {
  return await donationModel.findByTeamId(teamId, status);
}

/**
 * Gets donations assigned to a specific team member.
 * @param {number} memberId - Member user ID
 * @param {string} [status] - Optional status filter
 * @returns {Promise<Array>} Array of donation objects
 */
async function getMemberAssignments(memberId, status = null) {
  return await donationModel.findByAssignedMember(memberId, status);
}

/**
 * Gets all team assignments with details.
 * @param {number} teamId - Team ID
 * @returns {Promise<Array>} Array of assignment objects
 */
async function getTeamAssignments(teamId) {
  return await donationModel.findTeamAssignments(teamId);
}

module.exports = {
  createDonation,
  updateDonation,
  cancelDonation,
  browseDonations,
  acceptDonation,
  acceptDonationForTeam,
  assignTeamMemberToDonation,
  schedulePickup,
  markOnTheWay,
  markPickedUp,
  completeDonation,
  getDonorHistory,
  getVolunteerHistory,
  getDonorHistorySummary,
  getVolunteerHistorySummary,
  getTeamDonations,
  getMemberAssignments,
  getTeamAssignments,
};
