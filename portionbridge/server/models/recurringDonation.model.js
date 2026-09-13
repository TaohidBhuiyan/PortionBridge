const { pool } = require('../config/db');

/**
 * Data access layer for recurring_donations table
 */

const BASE_COLUMNS = `
  id, donor_id, title, category, description, quantity, quantity_unit,
  pickup_location, contact_phone, frequency, interval_value, day_of_week,
  day_of_month, food_details, clothing_details, is_active, start_date,
  end_date, next_occurrence, created_at, updated_at
`;

/**
 * Creates a new recurring donation schedule
 * @param {Object} data - Recurring donation data
 * @returns {Promise<number>} Insert ID
 */
async function create(data) {
  const {
    donorId,
    title,
    category,
    description,
    quantity,
    quantityUnit,
    pickupLocation,
    contactPhone,
    frequency,
    intervalValue = 1,
    dayOfWeek,
    dayOfMonth,
    foodDetails,
    clothingDetails,
    startDate,
    endDate,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO recurring_donations (
      donor_id, title, category, description, quantity, quantity_unit,
      pickup_location, contact_phone, frequency, interval_value, day_of_week,
      day_of_month, food_details, clothing_details, start_date, end_date, next_occurrence
    ) VALUES (
      :donorId, :title, :category, :description, :quantity, :quantityUnit,
      :pickupLocation, :contactPhone, :frequency, :intervalValue, :dayOfWeek,
      :dayOfMonth, :foodDetails, :clothingDetails, :startDate, :endDate, :startDate
    )`,
    {
      donorId,
      title,
      category,
      description,
      quantity,
      quantityUnit,
      pickupLocation,
      contactPhone,
      frequency,
      intervalValue,
      dayOfWeek,
      dayOfMonth,
      foodDetails: foodDetails ? JSON.stringify(foodDetails) : null,
      clothingDetails: clothingDetails ? JSON.stringify(clothingDetails) : null,
      startDate,
      endDate,
    }
  );

  return result.insertId;
}

/**
 * Finds recurring donations by donor ID
 * @param {number} donorId - Donor user ID
 * @param {boolean} activeOnly - Only return active schedules
 * @returns {Promise<Array>} Array of recurring donations
 */
async function findByDonorId(donorId, activeOnly = false) {
  let query = `SELECT ${BASE_COLUMNS} FROM recurring_donations WHERE donor_id = :donorId`;
  const params = { donorId };

  if (activeOnly) {
    query += ` AND is_active = 1`;
  }

  query += ` ORDER BY created_at DESC`;

  const [rows] = await pool.query(query, params);
  return rows.map(parseJsonFields);
}

/**
 * Finds a recurring donation by ID
 * @param {number} id - Recurring donation ID
 * @returns {Promise<Object|null>} Recurring donation object or null
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM recurring_donations WHERE id = :id LIMIT 1`,
    { id }
  );

  if (rows.length === 0) return null;
  return parseJsonFields(rows[0]);
}

/**
 * Updates a recurring donation
 * @param {number} id - Recurring donation ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} True if updated
 */
async function updateById(id, updates) {
  const allowedFields = [
    'title', 'category', 'description', 'quantity', 'quantityUnit',
    'pickupLocation', 'contactPhone', 'frequency', 'intervalValue',
    'dayOfWeek', 'dayOfMonth', 'foodDetails', 'clothingDetails',
    'isActive', 'endDate', 'nextOccurrence'
  ];

  const setClauses = [];
  const params = { id };

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      const dbField = camelToSnake(field);
      if (field === 'foodDetails' || field === 'clothingDetails') {
        setClauses.push(`${dbField} = :${field}`);
        params[field] = updates[field] ? JSON.stringify(updates[field]) : null;
      } else {
        setClauses.push(`${dbField} = :${field}`);
        params[field] = updates[field];
      }
    }
  }

  if (setClauses.length === 0) return false;

  const [result] = await pool.query(
    `UPDATE recurring_donations SET ${setClauses.join(', ')} WHERE id = :id`,
    params
  );

  return result.affectedRows > 0;
}

/**
 * Soft deletes a recurring donation (sets is_active = false)
 * @param {number} id - Recurring donation ID
 * @returns {Promise<boolean>} True if deactivated
 */
async function deactivate(id) {
  const [result] = await pool.query(
    `UPDATE recurring_donations SET is_active = 0 WHERE id = :id`,
    { id }
  );

  return result.affectedRows > 0;
}

/**
 * Finds recurring donations due for occurrence
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of recurring donations due
 */
async function findDueForDate(date) {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS} FROM recurring_donations
     WHERE is_active = 1 AND next_occurrence <= :date
     AND (end_date IS NULL OR end_date >= :date)`,
    { date }
  );

  return rows.map(parseJsonFields);
}

/**
 * Updates the next occurrence date for a recurring donation
 * @param {number} id - Recurring donation ID
 * @param {string} nextDate - Next occurrence date (YYYY-MM-DD)
 * @returns {Promise<boolean>} True if updated
 */
async function updateNextOccurrence(id, nextDate) {
  const [result] = await pool.query(
    `UPDATE recurring_donations SET next_occurrence = :nextDate WHERE id = :id`,
    { id, nextDate }
  );

  return result.affectedRows > 0;
}

/**
 * Parses JSON fields from database
 * @param {Object} row - Database row
 * @returns {Object} Row with parsed JSON fields
 */
function parseJsonFields(row) {
  const parsed = { ...row };
  if (parsed.food_details) {
    try {
      parsed.food_details = JSON.parse(parsed.food_details);
    } catch {
      parsed.food_details = null;
    }
  }
  if (parsed.clothing_details) {
    try {
      parsed.clothing_details = JSON.parse(parsed.clothing_details);
    } catch {
      parsed.clothing_details = null;
    }
  }
  return parsed;
}

/**
 * Converts camelCase to snake_case
 * @param {string} str - camelCase string
 * @returns {string} snake_case string
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

module.exports = {
  create,
  findByDonorId,
  findById,
  updateById,
  deactivate,
  findDueForDate,
  updateNextOccurrence,
};
