const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for the `volunteer_profiles` table.
 * Provides CRUD operations for volunteer-specific information.
 */

const BASE_COLUMNS = `
  id, user_id, vehicle_type, availability, service_areas, latitude, longitude, is_online, last_location_update, coverage_radius, created_at, updated_at
`;

/**
 * Creates or updates volunteer profile for a user.
 * Uses INSERT ... ON DUPLICATE KEY UPDATE for upsert behavior.
 * @param {Object} data - Volunteer profile data
 * @param {number} data.userId - ID of the user
 * @param {string|null} data.vehicleType - Vehicle type
 * @param {Array|null} data.availability - Array of availability time slots
 * @param {Array|null} data.serviceAreas - Array of service area objects
 * @returns {Promise<number>} The insert ID or existing ID
 */
async function upsert({ userId, vehicleType, availability, serviceAreas }) {
  const availabilityJson = availability && Array.isArray(availability) ? JSON.stringify(availability) : null;
  const serviceAreasJson = serviceAreas && Array.isArray(serviceAreas) ? JSON.stringify(serviceAreas) : null;

  const [result] = await pool.query(
    `INSERT INTO volunteer_profiles (user_id, vehicle_type, availability, service_areas)
     VALUES (:userId, :vehicleType, :availabilityJson, :serviceAreasJson)
     ON DUPLICATE KEY UPDATE
       vehicle_type = VALUES(vehicle_type),
       availability = VALUES(availability),
       service_areas = VALUES(service_areas)`,
    {
      userId,
      vehicleType: vehicleType || null,
      availabilityJson,
      serviceAreasJson,
    }
  );
  return result.insertId || result.affectedRows > 0 ? userId : null;
}

/**
 * Finds volunteer profile by user ID.
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Volunteer profile object or null if not found
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM volunteer_profiles WHERE user_id = :userId LIMIT 1`,
    { userId }
  );
  
  if (rows[0]) {
    // Parse JSON fields
    if (rows[0].availability) {
      rows[0].availability = JSON.parse(rows[0].availability);
    }
    if (rows[0].service_areas) {
      rows[0].service_areas = JSON.parse(rows[0].service_areas);
    }
  }
  
  return rows[0] || null;
}

/**
 * Updates specific fields of volunteer profile.
 * @param {number} userId - User ID
 * @param {Object} fields - Fields to update
 * @returns {Promise<void>}
 */
async function updateByUserId(userId, fields) {
  const setClauses = [];
  const params = { userId };

  const fieldMap = {
    vehicleType: 'vehicle_type',
    availability: 'availability',
    serviceAreas: 'service_areas',
  };

  Object.keys(fields).forEach((camelKey) => {
    if (fields[camelKey] !== undefined && fieldMap[camelKey]) {
      const snakeKey = fieldMap[camelKey];
      if (camelKey === 'availability' || camelKey === 'serviceAreas') {
        setClauses.push(`${snakeKey} = :${camelKey}Json`);
        params[`${camelKey}Json`] = Array.isArray(fields[camelKey]) 
          ? JSON.stringify(fields[camelKey]) 
          : fields[camelKey];
      } else {
        setClauses.push(`${snakeKey} = :${camelKey}`);
        params[camelKey] = fields[camelKey];
      }
    }
  });

  if (setClauses.length === 0) return;

  await pool.query(
    `UPDATE volunteer_profiles SET ${setClauses.join(', ')} WHERE user_id = :userId`,
    params
  );
}

/**
 * Deletes volunteer profile for a user.
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteByUserId(userId) {
  await pool.query(`DELETE FROM volunteer_profiles WHERE user_id = :userId`, { userId });
}

module.exports = {
  upsert,
  findByUserId,
  updateByUserId,
  deleteByUserId,
};
