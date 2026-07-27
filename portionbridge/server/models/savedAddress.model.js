const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `saved_addresses` table.
 * Provides CRUD operations for donor pickup addresses.
 */

const BASE_COLUMNS = `
  id, user_id, label, custom_label, full_address, division, district, area,
  postal_code, building_name, floor, landmark, delivery_instructions,
  latitude, longitude, contact_person_name, contact_phone, is_default,
  created_at, updated_at
`;

/**
 * Creates a new saved address for a user.
 * @param {Object} data - Address data
 * @param {number} data.userId - ID of the user
 * @param {string} data.label - Address label (home, office, other, custom)
 * @param {string|null} data.customLabel - Custom label (required if label is 'custom')
 * @param {string} data.fullAddress - Full address string
 * @param {string} data.division - Division
 * @param {string} data.district - District
 * @param {string} data.area - Area
 * @param {string|null} data.postalCode - Postal code
 * @param {string|null} data.buildingName - Building name
 * @param {string|null} data.floor - Floor
 * @param {string|null} data.landmark - Landmark
 * @param {string|null} data.deliveryInstructions - Delivery instructions
 * @param {number|null} data.latitude - Latitude
 * @param {number|null} data.longitude - Longitude
 * @param {string} data.contactPersonName - Contact person name
 * @param {string} data.contactPhone - Contact phone
 * @param {boolean} data.isDefault - Whether this is the default address
 * @returns {Promise<number>} The insert ID of the new address
 */
async function create({
  userId,
  label,
  customLabel,
  fullAddress,
  division,
  district,
  area,
  postalCode,
  buildingName,
  floor,
  landmark,
  deliveryInstructions,
  latitude,
  longitude,
  contactPersonName,
  contactPhone,
  isDefault,
}) {
  const [result] = await pool.query(
    `INSERT INTO saved_addresses
       (user_id, label, custom_label, full_address, division, district, area,
        postal_code, building_name, floor, landmark, delivery_instructions,
        latitude, longitude, contact_person_name, contact_phone, is_default)
     VALUES (:userId, :label, :customLabel, :fullAddress, :division, :district, :area,
             :postalCode, :buildingName, :floor, :landmark, :deliveryInstructions,
             :latitude, :longitude, :contactPersonName, :contactPhone, :isDefault)`,
    {
      userId,
      label,
      customLabel: customLabel || null,
      fullAddress,
      division,
      district,
      area,
      postalCode: postalCode || null,
      buildingName: buildingName || null,
      floor: floor || null,
      landmark: landmark || null,
      deliveryInstructions: deliveryInstructions || null,
      latitude: latitude || null,
      longitude: longitude || null,
      contactPersonName,
      contactPhone,
      isDefault: isDefault ? 1 : 0,
    }
  );
  return result.insertId;
}

/**
 * Finds a saved address by ID.
 * @param {number} id - Address ID
 * @returns {Promise<Object|null>} Address object or null if not found
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM saved_addresses WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Finds all saved addresses for a user.
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of address objects
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM saved_addresses WHERE user_id = :userId ORDER BY is_default DESC, created_at DESC`,
    { userId }
  );
  return rows;
}

/**
 * Counts the number of saved addresses for a user.
 * @param {number} userId - User ID
 * @returns {Promise<number>} Count of saved addresses
 */
async function countByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM saved_addresses WHERE user_id = :userId`,
    { userId }
  );
  return rows[0].count;
}

/**
 * Updates a saved address.
 * @param {number} id - Address ID
 * @param {Object} fields - Fields to update
 * @returns {Promise<void>}
 */
async function updateById(id, fields) {
  const setClauses = [];
  const params = { id };

  const fieldMap = {
    label: 'label',
    customLabel: 'custom_label',
    fullAddress: 'full_address',
    division: 'division',
    district: 'district',
    area: 'area',
    postalCode: 'postal_code',
    buildingName: 'building_name',
    floor: 'floor',
    landmark: 'landmark',
    deliveryInstructions: 'delivery_instructions',
    latitude: 'latitude',
    longitude: 'longitude',
    contactPersonName: 'contact_person_name',
    contactPhone: 'contact_phone',
    isDefault: 'is_default',
  };

  Object.keys(fields).forEach((camelKey) => {
    if (fields[camelKey] !== undefined && fieldMap[camelKey]) {
      const snakeKey = fieldMap[camelKey];
      setClauses.push(`${snakeKey} = :${camelKey}`);
      params[camelKey] = fields[camelKey] === true ? 1 : fields[camelKey] === false ? 0 : fields[camelKey];
    }
  });

  if (setClauses.length === 0) return;

  await pool.query(`UPDATE saved_addresses SET ${setClauses.join(', ')} WHERE id = :id`, params);
}

/**
 * Deletes a saved address.
 * @param {number} id - Address ID
 * @returns {Promise<void>}
 */
async function deleteById(id) {
  await pool.query(`DELETE FROM saved_addresses WHERE id = :id`, { id });
}

/**
 * Sets an address as the default for a user.
 * This will unset the default flag from all other addresses for the same user.
 * @param {number} id - Address ID
 * @param {number} userId - User ID (for ownership validation)
 * @returns {Promise<void>}
 */
async function setDefault(id, userId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // First, verify ownership
    const [addressRows] = await connection.query(
      `SELECT id FROM saved_addresses WHERE id = :id AND user_id = :userId LIMIT 1`,
      { id, userId }
    );

    if (!addressRows[0]) {
      await connection.rollback();
      return false;
    }

    // Unset default for all other addresses
    await connection.query(
      `UPDATE saved_addresses SET is_default = 0 WHERE user_id = :userId AND id <> :id`,
      { userId, id }
    );

    // Set this address as default
    await connection.query(
      `UPDATE saved_addresses SET is_default = 1 WHERE id = :id`,
      { id }
    );

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Gets the default address for a user.
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Default address object or null if not found
 */
async function findDefaultByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM saved_addresses WHERE user_id = :userId AND is_default = 1 LIMIT 1`,
    { userId }
  );
  return rows[0] || null;
}

module.exports = {
  create,
  findById,
  findByUserId,
  countByUserId,
  updateById,
  deleteById,
  setDefault,
  findDefaultByUserId,
};
