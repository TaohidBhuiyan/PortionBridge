const { pool } = require('../config/db');
const { DONATION_STATUS } = require('../constants');

/**
 * Raw SQL data-access layer for the `donation_requests` table.
 * Reads always exclude soft-deleted rows (is_deleted = 0) unless stated otherwise.
 * Note: updated_at is auto-managed by MySQL via ON UPDATE CURRENT_TIMESTAMP.
 */

const BASE_COLUMNS = `
  id, donor_id, volunteer_id, assignment_mode, team_id, assigned_member_id,
  title, category, food_type, food_name, quantity,
  quantity_unit, number_of_servings, pickup_location, pickup_time, pickup_date,
  pickup_time_slot, expiry_date, contact_phone, description, ingredients,
  allergens, storage_requirement, is_vegetarian, is_halal, refrigeration_required,
  clothing_category, gender, age_group, item_condition, brand, size, color,
  season, images, additional_notes, saved_address_id, pickup_address_details,
  photo, scheduled_at, accepted_at, completed_at, status, is_deleted, deleted_at,
  created_at, updated_at
`;

/**
 * Allowed columns for partial updates.
 * These are the only fields donors can modify on their own requests.
 */
const UPDATEABLE_COLUMNS = [
  'title', 'category', 'food_type', 'food_name', 'quantity', 'quantity_unit',
  'number_of_servings', 'pickup_location', 'pickup_time', 'pickup_date',
  'pickup_time_slot', 'expiry_date', 'contact_phone', 'description', 'ingredients',
  'allergens', 'storage_requirement', 'is_vegetarian', 'is_halal',
  'refrigeration_required', 'clothing_category', 'gender', 'age_group',
  'item_condition', 'brand', 'size', 'color', 'season', 'images',
  'additional_notes', 'saved_address_id', 'pickup_address_details', 'photo',
];

/**
 * Whitelisted sort columns to prevent SQL injection via ORDER BY.
 * Never interpolate sortBy directly into SQL.
 */
const ALLOWED_SORT_COLUMNS = ['created_at', 'pickup_time', 'quantity'];

/**
 * Separate whitelist for history listings, which additionally allow sorting
 * by the lifecycle timestamps (not relevant to the pending-only browse list).
 */
const ALLOWED_HISTORY_SORT_COLUMNS = ['created_at', 'pickup_time', 'scheduled_at', 'completed_at'];

/**
 * Creates a new donation request.
 * @param {Object} data - Donation data
 * @param {number} data.donorId - ID of the donor creating the request
 * @param {string} data.title - Donation title
 * @param {string} data.category - Donation category (food/clothes)
 * @param {number} data.quantity - Quantity of items
 * @param {string|null} data.quantityUnit - Quantity unit
 * @param {number|null} data.numberOfServings - Number of servings
 * @param {string} data.pickupLocation - Pickup location address
 * @param {string} data.pickupTime - ISO 8601 datetime for pickup
 * @param {string} data.pickupDate - Pickup date
 * @param {string} data.pickupTimeSlot - Pickup time slot
 * @param {string|null} data.expiryDate - Expiry date
 * @param {string} data.contactPhone - Contact phone number
 * @param {string|null} data.description - Optional description
 * @param {string|null} data.photo - Optional photo path/URL
 * @param {string|null} data.foodType - Food type (for food donations)
 * @param {string|null} data.foodName - Food name (for food donations)
 * @param {string|null} data.ingredients - Ingredients (for food donations)
 * @param {string|null} data.allergens - Allergens JSON (for food donations)
 * @param {string|null} data.storageRequirement - Storage requirement (for food donations)
 * @param {string|null} data.isVegetarian - Vegetarian status (for food donations)
 * @param {string|null} data.isHalal - Halal status (for food donations)
 * @param {string|null} data.refrigerationRequired - Refrigeration required (for food donations)
 * @param {string|null} data.clothingCategory - Clothing category (for clothes donations)
 * @param {string|null} data.gender - Gender (for clothes donations)
 * @param {string|null} data.ageGroup - Age group (for clothes donations)
 * @param {string|null} data.itemCondition - Item condition (for clothes donations)
 * @param {string|null} data.brand - Brand (for clothes donations)
 * @param {string|null} data.size - Size (for clothes donations)
 * @param {string|null} data.color - Color (for clothes donations)
 * @param {string|null} data.season - Season (for clothes donations)
 * @param {string|null} data.images - Images JSON
 * @param {string|null} data.additionalNotes - Additional notes
 * @param {number|null} data.savedAddressId - Saved address ID
 * @param {string|null} data.pickupAddressDetails - Pickup address details JSON
 * @returns {Promise<number>} The insert ID of the new donation
 */
async function create({
  donorId,
  title,
  category,
  quantity,
  quantityUnit,
  numberOfServings,
  pickupLocation,
  pickupTime,
  pickupDate,
  pickupTimeSlot,
  expiryDate,
  contactPhone,
  description,
  photo,
  foodType,
  foodName,
  ingredients,
  allergens,
  storageRequirement,
  isVegetarian,
  isHalal,
  refrigerationRequired,
  clothingCategory,
  gender,
  ageGroup,
  itemCondition,
  brand,
  size,
  color,
  season,
  images,
  additionalNotes,
  savedAddressId,
  pickupAddressDetails,
  assignmentMode,
}) {
  const [result] = await pool.query(
    `INSERT INTO donation_requests
       (donor_id, title, category, quantity, quantity_unit, number_of_servings,
        pickup_location, pickup_time, pickup_date, pickup_time_slot, expiry_date,
        contact_phone, description, photo, food_type, food_name, ingredients,
        allergens, storage_requirement, is_vegetarian, is_halal, refrigeration_required,
        clothing_category, gender, age_group, item_condition, brand, size, color,
        season, images, additional_notes, saved_address_id, pickup_address_details, assignment_mode)
     VALUES (:donorId, :title, :category, :quantity, :quantityUnit, :numberOfServings,
             :pickupLocation, :pickupTime, :pickupDate, :pickupTimeSlot, :expiryDate,
             :contactPhone, :description, :photo, :foodType, :foodName, :ingredients,
             :allergens, :storageRequirement, :isVegetarian, :isHalal, :refrigerationRequired,
             :clothingCategory, :gender, :ageGroup, :itemCondition, :brand, :size, :color,
             :season, :images, :additionalNotes, :savedAddressId, :pickupAddressDetails, :assignmentMode)`,
    {
      donorId,
      title,
      category,
      quantity,
      quantityUnit: quantityUnit || null,
      numberOfServings: numberOfServings || null,
      pickupLocation,
      pickupTime,
      pickupDate,
      pickupTimeSlot,
      expiryDate: expiryDate || null,
      contactPhone,
      description: description || null,
      photo: photo || null,
      foodType: foodType || null,
      foodName: foodName || null,
      ingredients: ingredients || null,
      allergens: allergens ? JSON.stringify(allergens) : null,
      storageRequirement: storageRequirement || null,
      isVegetarian: isVegetarian || null,
      isHalal: isHalal || null,
      refrigerationRequired: refrigerationRequired || null,
      clothingCategory: clothingCategory || null,
      gender: gender || null,
      ageGroup: ageGroup || null,
      itemCondition: itemCondition || null,
      brand: brand || null,
      size: size || null,
      color: color || null,
      season: season || null,
      images: images ? JSON.stringify(images) : null,
      additionalNotes: additionalNotes || null,
      savedAddressId: savedAddressId || null,
      pickupAddressDetails: pickupAddressDetails ? JSON.stringify(pickupAddressDetails) : null,
      assignmentMode: assignmentMode || 'individual',
    }
  );
  return result.insertId;
}

/**
 * Parses JSON fields from database rows.
 * MySQL returns JSON as strings, so we need to parse them back to objects/arrays.
 * @param {Object} row - Database row
 * @returns {Object} Row with parsed JSON fields
 */
function parseJsonFields(row) {
  if (!row) return row;

  const jsonFields = ['allergens', 'images', 'pickup_address_details'];
  const parsed = { ...row };

  jsonFields.forEach((field) => {
    if (parsed[field]) {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        // If parsing fails, leave as string
        console.warn(`Failed to parse JSON field ${field}:`, e);
      }
    }
  });

  return parsed;
}

/**
 * Finds a donation by ID, excluding soft-deleted rows.
 * @param {number} id - Donation ID
 * @returns {Promise<Object|null>} Donation object or null if not found
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE id = :id AND is_deleted = 0 LIMIT 1`,
    { id }
  );
  return parseJsonFields(rows[0] || null);
}

/**
 * Performs a dynamic partial update on a donation.
 * Only updates columns present in `fields` and within the allowed set.
 *
 * Now accepts an optional `connection` (defaults to `pool`) so it can run
 * inside a caller-owned transaction — see donation.service.js#updateDonation,
 * which locks the row with SELECT ... FOR UPDATE before calling this.
 * @param {number} id - Donation ID
 * @param {Object} fields - Snake_case column names to update with their values
 * @param {Object} [connection=pool] - Active transaction connection, or pool for a standalone call
 * @returns {Promise<void>}
 */
async function updateById(id, fields, connection = pool) {
  const setClauses = [];
  const params = { id };

  Object.keys(fields).forEach((key) => {
    if (UPDATEABLE_COLUMNS.includes(key) && fields[key] !== undefined) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  });

  if (setClauses.length === 0) return;

  await connection.query(`UPDATE donation_requests SET ${setClauses.join(', ')} WHERE id = :id`, params);
}

/**
 * Soft-deletes a donation request by setting is_deleted flag and deleted_at timestamp.
 * Never performs a hard DELETE to preserve audit trail.
 *
 * Now accepts an optional `connection` (defaults to `pool`) — same reason
 * as updateById above.
 * @param {number} id - Donation ID
 * @param {Object} [connection=pool] - Active transaction connection, or pool for a standalone call
 * @returns {Promise<void>}
 */
async function softDelete(id, connection = pool) {
  await connection.query(
    `UPDATE donation_requests SET is_deleted = 1, deleted_at = NOW() WHERE id = :id`,
    { id }
  );
}

/**
 * Builds the shared WHERE clause + params for the browse listing.
 * Used by both findPendingList (data) and countPendingList (total),
 * ensuring the two never drift out of sync.
 * @param {Object} filters - Filter options
 * @param {string} [filters.category] - Filter by category
 * @param {string} [filters.location] - Filter by pickup location (partial match)
 * @param {string} [filters.search] - Search across description and pickup location
 * @returns {Object} Object containing whereClause string and params object
 */
function buildBrowseFilter({ category, location, search }) {
  const conditions = [`is_deleted = 0`, `status = 'pending'`];
  const params = {};

  if (category) {
    conditions.push(`category = :category`);
    params.category = category;
  }

  if (location) {
    conditions.push(`pickup_location LIKE :location`);
    params.location = `%${location}%`;
  }

  if (search) {
    conditions.push(`(description LIKE :search OR pickup_location LIKE :search)`);
    params.search = `%${search}%`;
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Lists pending (browsable) donation requests with optional filters,
 * whitelisted sorting, and pagination.
 * @param {Object} options - Query options
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.location] - Filter by pickup location
 * @param {string} [options.search] - Search across description and location
 * @param {string} [options.sortBy] - Sort column (whitelisted)
 * @param {string} [options.sortOrder] - Sort direction (asc/desc)
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of donation objects
 */
async function findPendingList({ category, location, search, sortBy, sortOrder, limit, offset }) {
  const { whereClause, params } = buildBrowseFilter({ category, location, search });

  const orderColumn = ALLOWED_SORT_COLUMNS.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests
     WHERE ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows.map(parseJsonFields);
}

/**
 * Total count matching the same filters as findPendingList.
 * Powers pagination meta.
 * @param {Object} filters - Filter options (same as buildBrowseFilter)
 * @returns {Promise<number>} Total count of matching donations
 */
async function countPendingList({ category, location, search }) {
  const { whereClause, params } = buildBrowseFilter({ category, location, search });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM donation_requests WHERE ${whereClause}`,
    params
  );
  return rows[0].total;
}

/**
 * Transaction-safe accept.
 *
 * MUST be called with an active transaction's connection (see
 * donation.service.js#acceptDonation, which owns beginTransaction/commit/rollback).
 *
 * Locks the donation row with SELECT ... FOR UPDATE so that if two volunteers
 * race to accept the same donation, the second one blocks until the first
 * transaction commits/rolls back — then re-reads the now-updated status and
 * correctly finds it no longer pending.
 *
 * Returns the updated donation row, or null if it was not eligible to be
 * accepted (missing, soft-deleted, or status !== 'pending') by the time the
 * lock was acquired. Returning null (rather than throwing) keeps this method
 * a pure data-access function — the service layer decides what null means.
 * @param {Object} connection - Active transaction connection
 * @param {number} donationId - Donation ID to accept
 * @param {number} volunteerId - ID of the volunteer accepting
 * @returns {Promise<Object|null>} Updated donation object or null if not eligible
 */
async function acceptDonation(connection, donationId, volunteerId) {
  const [rows] = await connection.query(
    `SELECT id, status, is_deleted
     FROM donation_requests
     WHERE id = :id
     FOR UPDATE`,
    { id: donationId }
  );

  const donation = rows[0];

  if (!donation || donation.is_deleted || donation.status !== DONATION_STATUS.PENDING) {
    return null;
  }

  await connection.query(
    `UPDATE donation_requests
     SET status = :acceptedStatus,
         volunteer_id = :volunteerId,
         accepted_at = NOW()
     WHERE id = :id`,
    { acceptedStatus: DONATION_STATUS.ACCEPTED, volunteerId, id: donationId }
  );

  const [updatedRows] = await connection.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE id = :id LIMIT 1`,
    { id: donationId }
  );

  return parseJsonFields(updatedRows[0]);
}

/**
 * Transaction-safe schedule pickup.
 *
 * MUST be called with an active transaction's connection (see
 * donation.service.js#schedulePickup, which owns beginTransaction/commit/rollback).
 *
 * Locks the donation row with SELECT ... FOR UPDATE to prevent race conditions
 * when multiple operations might affect the same donation.
 *
 * Returns the updated donation row, or null if it was not eligible to be
 * scheduled (missing, soft-deleted, or status !== 'accepted') by the time the
 * lock was acquired.
 * @param {Object} connection - Active transaction connection
 * @param {number} donationId - Donation ID to schedule
 * @param {string} scheduledAt - ISO 8601 datetime for scheduled pickup
 * @returns {Promise<Object|null>} Updated donation object or null if not eligible
 */
async function schedulePickup(connection, donationId, scheduledAt) {
  const [rows] = await connection.query(
    `SELECT id, status, volunteer_id, is_deleted
     FROM donation_requests
     WHERE id = :id
     FOR UPDATE`,
    { id: donationId }
  );

  const donation = rows[0];

  if (!donation || donation.is_deleted || donation.status !== DONATION_STATUS.ACCEPTED) {
    return null;
  }

  await connection.query(
    `UPDATE donation_requests
     SET scheduled_at = :scheduledAt,
         status = :scheduledStatus
     WHERE id = :id`,
    { scheduledAt, scheduledStatus: DONATION_STATUS.SCHEDULED, id: donationId }
  );

  const [updatedRows] = await connection.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE id = :id LIMIT 1`,
    { id: donationId }
  );

  return parseJsonFields(updatedRows[0]);
}

/**
 * Transaction-safe "mark on the way" (Module 9).
 *
 * MUST be called with an active transaction's connection (see
 * donation.service.js#markOnTheWay, which owns beginTransaction/commit/rollback).
 * Same row-lock pattern as schedulePickup: locks the row, re-verifies status
 * is still 'scheduled' at lock time, and returns null (not a throw) if it
 * isn't — the service layer decides what null means (409 Conflict).
 * @param {Object} connection - Active transaction connection
 * @param {number} donationId - Donation ID to update
 * @returns {Promise<Object|null>} Updated donation object or null if not eligible
 */
async function markOnTheWay(connection, donationId) {
  const [rows] = await connection.query(
    `SELECT id, status, volunteer_id, is_deleted
     FROM donation_requests
     WHERE id = :id
     FOR UPDATE`,
    { id: donationId }
  );

  const donation = rows[0];

  if (!donation || donation.is_deleted || donation.status !== DONATION_STATUS.SCHEDULED) {
    return null;
  }

  await connection.query(
    `UPDATE donation_requests SET status = :onTheWayStatus WHERE id = :id`,
    { onTheWayStatus: DONATION_STATUS.ON_THE_WAY, id: donationId }
  );

  const [updatedRows] = await connection.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE id = :id LIMIT 1`,
    { id: donationId }
  );

  return parseJsonFields(updatedRows[0]);
}

/**
 * Transaction-safe "mark picked up" (Module 9).
 *
 * MUST be called with an active transaction's connection (see
 * donation.service.js#markPickedUp, which owns beginTransaction/commit/rollback).
 * Same row-lock pattern as markOnTheWay: locks the row, re-verifies status
 * is still 'on_the_way' at lock time, and returns null if it isn't.
 * @param {Object} connection - Active transaction connection
 * @param {number} donationId - Donation ID to update
 * @returns {Promise<Object|null>} Updated donation object or null if not eligible
 */
async function markPickedUp(connection, donationId) {
  const [rows] = await connection.query(
    `SELECT id, status, volunteer_id, is_deleted
     FROM donation_requests
     WHERE id = :id
     FOR UPDATE`,
    { id: donationId }
  );

  const donation = rows[0];

  if (!donation || donation.is_deleted || donation.status !== DONATION_STATUS.ON_THE_WAY) {
    return null;
  }

  await connection.query(
    `UPDATE donation_requests SET status = :pickedUpStatus WHERE id = :id`,
    { pickedUpStatus: DONATION_STATUS.PICKED_UP, id: donationId }
  );

  const [updatedRows] = await connection.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE id = :id LIMIT 1`,
    { id: donationId }
  );

  return parseJsonFields(updatedRows[0]);
}

/**
 * Locks a donation row for an in-progress transaction (SELECT ... FOR UPDATE)
 * and returns it as-is, including soft-delete state, with NO status filtering.
 * Deliberately generic/reusable — unlike acceptDonation's all-in-one method,
 * this one just locks + reads, letting the caller (service layer) run
 * whatever ownership/status checks its specific business rule needs and
 * throw the correct 403 vs 409 vs 404, since "invalid" means something
 * different for each write operation.
 *
 * Returns null if no row exists with this id at all.
 * @param {Object} connection - Active transaction connection
 * @param {number} id - Donation ID to lock and read
 * @returns {Promise<Object|null>} Donation object or null if not found
 */
async function findByIdForUpdate(connection, id) {
  const [rows] = await connection.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE id = :id FOR UPDATE`,
    { id }
  );
  return parseJsonFields(rows[0] || null);
}

/**
 * Marks a donation as completed: status -> 'completed', completed_at -> NOW().
 * Ownership and status preconditions are already verified by the service
 * layer (using the locked row from findByIdForUpdate) before this runs.
 * Must be called with the same transaction connection that holds the lock.
 *
 * Module 9 note: the precondition this now sits behind changed from
 * 'scheduled' (volunteer-driven) to 'picked_up' (donor-driven) — see
 * donation.service.js#completeDonation — but this function's own SQL is
 * unchanged, since it never encoded the precondition itself.
 * @param {Object} connection - Active transaction connection
 * @param {number} id - Donation ID to complete
 * @returns {Promise<Object>} The updated donation object
 */
async function completeDonation(connection, id) {
  await connection.query(
    `UPDATE donation_requests
     SET status = :completedStatus,
         completed_at = NOW()
     WHERE id = :id`,
    { completedStatus: DONATION_STATUS.COMPLETED, id }
  );

  const [rows] = await connection.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE id = :id LIMIT 1`,
    { id }
  );
  return parseJsonFields(rows[0]);
}

/**
 * Builds the shared WHERE clause + params for donor/volunteer history
 * listings — used by both the data query and the count query, so the two
 * never drift out of sync (same pattern as buildBrowseFilter).
 *
 * `ownerColumn` is always an internally-supplied literal ('donor_id' or
 * 'volunteer_id'), never derived from request input, so it's safe to
 * interpolate directly into the SQL.
 * @param {Object} filters - Filter options
 * @param {string} filters.ownerColumn - Column name to filter by (donor_id or volunteer_id)
 * @param {number} filters.ownerId - ID of the owner
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.category] - Filter by category
 * @param {string} [filters.search] - Search across description and pickup location
 * @returns {Object} Object containing whereClause string and params object
 */
function buildHistoryFilter({ ownerColumn, ownerId, status, category, search }) {
  const conditions = [`is_deleted = 0`, `${ownerColumn} = :ownerId`];
  const params = { ownerId };

  if (status) {
    conditions.push(`status = :status`);
    params.status = status;
  }

  if (category) {
    conditions.push(`category = :category`);
    params.category = category;
  }

  if (search) {
    conditions.push(`(description LIKE :search OR pickup_location LIKE :search)`);
    params.search = `%${search}%`;
  }

  return { whereClause: conditions.join(' AND '), params };
}

/**
 * Generic, reusable history data query — shared by both donor and volunteer
 * history so the SQL shape (SELECT + ORDER BY + LIMIT/OFFSET) is written once.
 * @param {Object} options - Query options
 * @param {string} options.ownerColumn - Column name to filter by (donor_id or volunteer_id)
 * @param {number} options.ownerId - ID of the owner
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.search] - Search across description and location
 * @param {string} [options.sortBy] - Sort column (whitelisted)
 * @param {string} [options.sortOrder] - Sort direction (asc/desc)
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of donation objects
 */
async function queryHistory({ ownerColumn, ownerId, status, category, search, sortBy, sortOrder, limit, offset }) {
  const { whereClause, params } = buildHistoryFilter({ ownerColumn, ownerId, status, category, search });

  const orderColumn = ALLOWED_HISTORY_SORT_COLUMNS.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests
     WHERE ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return rows.map(parseJsonFields);
}

/**
 * Generic, reusable history count query — mirrors queryHistory's filters
 * exactly, powering pagination meta for both donor and volunteer history.
 * @param {Object} filters - Filter options (same as buildHistoryFilter)
 * @param {string} filters.ownerColumn - Column name to filter by (donor_id or volunteer_id)
 * @param {number} filters.ownerId - ID of the owner
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.category] - Filter by category
 * @param {string} [filters.search] - Search across description and location
 * @returns {Promise<number>} Total count of matching donations
 */
async function countHistory({ ownerColumn, ownerId, status, category, search }) {
  const { whereClause, params } = buildHistoryFilter({ ownerColumn, ownerId, status, category, search });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM donation_requests WHERE ${whereClause}`,
    params
  );
  return rows[0].total;
}

/**
 * All non-deleted donations created by this donor (any status), filtered/
 * sorted/paginated. Uses the indexed donor_id + status + category columns.
 * @param {number} donorId - ID of the donor
 * @param {Object} options - Query options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.search] - Search across description and location
 * @param {string} [options.sortBy] - Sort column (whitelisted)
 * @param {string} [options.sortOrder] - Sort direction (asc/desc)
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of donation objects
 */
async function findDonorHistory(donorId, { status, category, search, sortBy, sortOrder, limit, offset }) {
  return queryHistory({ ownerColumn: 'donor_id', ownerId: donorId, status, category, search, sortBy, sortOrder, limit, offset });
}

/**
 * Count of donations for a donor with the same filters as findDonorHistory.
 * @param {number} donorId - ID of the donor
 * @param {Object} filters - Filter options
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.category] - Filter by category
 * @param {string} [filters.search] - Search across description and location
 * @returns {Promise<number>} Total count of matching donations
 */
async function countDonorHistory(donorId, { status, category, search }) {
  return countHistory({ ownerColumn: 'donor_id', ownerId: donorId, status, category, search });
}

/**
 * All non-deleted donations assigned to this volunteer (any status they've
 * touched: accepted/scheduled/completed), filtered/sorted/paginated.
 * @param {number} volunteerId - ID of the volunteer
 * @param {Object} options - Query options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.search] - Search across description and location
 * @param {string} [options.sortBy] - Sort column (whitelisted)
 * @param {string} [options.sortOrder] - Sort direction (asc/desc)
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of donation objects
 */
async function findVolunteerHistory(volunteerId, { status, category, search, sortBy, sortOrder, limit, offset }) {
  return queryHistory({ ownerColumn: 'volunteer_id', ownerId: volunteerId, status, category, search, sortBy, sortOrder, limit, offset });
}

/**
 * Count of donations for a volunteer with the same filters as findVolunteerHistory.
 * @param {number} volunteerId - ID of the volunteer
 * @param {Object} filters - Filter options
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.category] - Filter by category
 * @param {string} [filters.search] - Filter by search
 * @returns {Promise<number>} Total count of matching donations
 */
async function countVolunteerHistory(volunteerId, { status, category, search }) {
  return countHistory({ ownerColumn: 'volunteer_id', ownerId: volunteerId, status, category, search });
}

/**
 * Generic status-count aggregate: one query, one pass over the table
 * (indexed on ownerColumn), returns { total, <status1>, <status2>, ... }.
 * Uses SUM(status = :x) conditional aggregation rather than N separate
 * COUNT queries — avoids N+1 round trips for the summary endpoints.
 * @param {string} ownerColumn - Column name to filter by (donor_id or volunteer_id)
 * @param {number} ownerId - ID of the owner
 * @param {Array<string>} statuses - Array of status values to count
 * @returns {Promise<Object>} Object with total and status counts
 */
async function getSummaryCounts(ownerColumn, ownerId, statuses) {
  const sumClauses = statuses.map((status) => `SUM(status = :status_${status}) AS ${status}`).join(', ');
  const params = { ownerId };
  statuses.forEach((status) => {
    params[`status_${status}`] = status;
  });

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total, ${sumClauses}
     FROM donation_requests
     WHERE ${ownerColumn} = :ownerId AND is_deleted = 0`,
    params
  );
  return rows[0];
}

/**
 * Donor summary: total + pending/accepted/scheduled/completed counts.
 * @param {number} donorId - ID of the donor
 * @returns {Promise<Object>} Object with total and status counts
 */
async function getDonorSummary(donorId) {
  return getSummaryCounts('donor_id', donorId, [
    DONATION_STATUS.PENDING,
    DONATION_STATUS.ACCEPTED,
    DONATION_STATUS.SCHEDULED,
    DONATION_STATUS.COMPLETED,
  ]);
}

/**
 * Volunteer summary: total + accepted/scheduled/completed counts.
 * No 'pending' bucket — volunteer_id is only ever set once a donation
 * has already moved past pending (see acceptDonation), so a volunteer
 * can never have a pending donation assigned to them.
 * @param {number} volunteerId - ID of the volunteer
 * @returns {Promise<Object>} Object with total and status counts
 */
async function getVolunteerSummary(volunteerId) {
  return getSummaryCounts('volunteer_id', volunteerId, [
    DONATION_STATUS.ACCEPTED,
    DONATION_STATUS.SCHEDULED,
    DONATION_STATUS.COMPLETED,
  ]);
}

/**
 * Finds all donations for a donor (including soft-deleted for statistics).
 * Used for calculating donor statistics.
 * @param {number} donorId - ID of the donor
 * @returns {Promise<Array>} Array of all donation objects
 */
async function findByDonorId(donorId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE donor_id = :donorId`,
    { donorId }
  );
  return rows.map(parseJsonFields);
}

/**
 * Finds all donations for a volunteer (including soft-deleted for statistics).
 * Used for calculating volunteer statistics.
 * @param {number} volunteerId - ID of the volunteer
 * @returns {Promise<Array>} Array of all donation objects
 */
async function findByVolunteerId(volunteerId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE volunteer_id = :volunteerId`,
    { volunteerId }
  );
  return rows.map(parseJsonFields);
}

/**
 * Accepts a donation for a team (team mode).
 * @param {Object} connection - Database connection for transaction
 * @param {number} donationId - Donation ID
 * @param {number} teamId - Team ID accepting the donation
 * @param {number} leaderId - Team leader ID
 * @returns {Promise<Object|null>} Accepted donation or null if not available
 */
async function acceptDonationForTeam(connection, donationId, teamId, leaderId) {
  const [result] = await connection.query(
    `UPDATE donation_requests
     SET volunteer_id = :leaderId, assignment_mode = 'team', team_id = :teamId,
         accepted_at = NOW(), status = 'accepted'
     WHERE id = :donationId AND status = 'pending' AND is_deleted = 0`,
    { donationId, teamId, leaderId }
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await connection.query(
    `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE id = :donationId LIMIT 1`,
    { donationId }
  );
  return parseJsonFields(rows[0]);
}

/**
 * Assigns a team member to a team-assigned donation.
 * @param {number} donationId - Donation ID
 * @param {number} teamId - Team ID
 * @param {number} memberId - Member ID to assign
 * @param {number} assignedBy - User ID assigning the member
 * @returns {Promise<number>} Insert ID
 */
async function assignTeamMember(donationId, teamId, memberId, assignedBy) {
  const [result] = await pool.query(
    `INSERT INTO donation_assignments (donation_id, team_id, member_id, assigned_by)
     VALUES (:donationId, :teamId, :memberId, :assignedBy)
     ON DUPLICATE KEY UPDATE assigned_by = VALUES(assigned_by), assigned_at = NOW()`,
    { donationId, teamId, memberId, assignedBy }
  );

  // Update donation_requests assigned_member_id
  await pool.query(
    `UPDATE donation_requests SET assigned_member_id = :memberId WHERE id = :donationId`,
    { memberId, donationId }
  );

  return result.insertId;
}

/**
 * Finds donations assigned to a team.
 * @param {number} teamId - Team ID
 * @param {string} [status] - Optional status filter
 * @returns {Promise<Array>} Array of donation objects
 */
async function findByTeamId(teamId, status = null) {
  let query = `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE team_id = :teamId AND is_deleted = 0`;
  const params = { teamId };

  if (status) {
    query += ` AND status = :status`;
    params.status = status;
  }

  query += ` ORDER BY created_at DESC`;

  const [rows] = await pool.query(query, params);
  return rows.map(parseJsonFields);
}

/**
 * Finds donations assigned to a specific team member.
 * @param {number} memberId - Member user ID
 * @param {string} [status] - Optional status filter
 * @returns {Promise<Array>} Array of donation objects
 */
async function findByAssignedMember(memberId, status = null) {
  let query = `SELECT ${BASE_COLUMNS} FROM donation_requests WHERE assigned_member_id = :memberId AND is_deleted = 0`;
  const params = { memberId };

  if (status) {
    query += ` AND status = :status`;
    params.status = status;
  }

  query += ` ORDER BY created_at DESC`;

  const [rows] = await pool.query(query, params);
  return rows.map(parseJsonFields);
}

/**
 * Finds donation assignments for a team.
 * @param {number} teamId - Team ID
 * @returns {Promise<Array>} Array of assignment objects
 */
async function findTeamAssignments(teamId) {
  const [rows] = await pool.query(
    `SELECT da.id, da.donation_id, da.team_id, da.member_id, da.assigned_by,
            da.assigned_at, da.status, da.completed_at,
            u.name AS member_name, u.email AS member_email, u.profile_photo,
            dr.title AS donation_title, dr.status AS donation_status, dr.pickup_location
     FROM donation_assignments da
     JOIN users u ON da.member_id = u.id
     JOIN donation_requests dr ON da.donation_id = dr.id
     WHERE da.team_id = :teamId
     ORDER BY da.assigned_at DESC`,
    { teamId }
  );
  return rows;
}

/**
 * Updates assignment status.
 * @param {number} assignmentId - Assignment ID
 * @param {string} status - New status
 * @param {Date|null} completedAt - Completion timestamp
 * @returns {Promise<void>}
 */
async function updateAssignmentStatus(assignmentId, status, completedAt = null) {
  await pool.query(
    `UPDATE donation_assignments SET status = :status, completed_at = :completedAt WHERE id = :assignmentId`,
    { status, completedAt, assignmentId }
  );
}

module.exports = {
  create,
  findById,
  updateById,
  softDelete,
  findPendingList,
  countPendingList,
  acceptDonation,
  acceptDonationForTeam,
  assignTeamMember,
  schedulePickup,
  markOnTheWay,
  markPickedUp,
  findByIdForUpdate,
  completeDonation,
  findDonorHistory,
  countDonorHistory,
  findVolunteerHistory,
  countVolunteerHistory,
  getDonorSummary,
  getVolunteerSummary,
  findByDonorId,
  findByVolunteerId,
  findByTeamId,
  findByAssignedMember,
  findTeamAssignments,
  updateAssignmentStatus,
};
