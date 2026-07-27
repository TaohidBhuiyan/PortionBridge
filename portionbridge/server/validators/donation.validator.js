const { body, param, query } = require('express-validator');
const {
  DONATION_CATEGORY,
  DONATION_STATUS,
  PAGINATION_DEFAULTS,
  FOOD_TYPE,
  QUANTITY_UNIT,
  STORAGE_REQUIREMENT,
  VEGETARIAN,
  HALAL,
  REFRIGERATION_REQUIRED,
  ALLERGENS,
  CLOTHING_CATEGORY,
  GENDER,
  AGE_GROUP,
  CONDITION,
  SIZE,
  SEASON,
  TIME_SLOT,
} = require('../constants');

const ALLOWED_SORT_FIELDS = ['created_at', 'pickup_time', 'quantity'];
const ALLOWED_HISTORY_SORT_FIELDS = ['created_at', 'pickup_time', 'scheduled_at', 'completed_at'];

/**
 * Validates that pickup time is in the future.
 * @param {string} value - ISO 8601 datetime string
 */
const isFuturePickupTime = (value) => {
  if (new Date(value).getTime() <= Date.now()) {
    throw new Error('Pickup time must be in the future.');
  }
  return true;
};

/**
 * Validates that pickup date is today or in the future.
 * @param {string} value - Date string (YYYY-MM-DD)
 */
const isFuturePickupDate = (value) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickupDate = new Date(value);
  if (pickupDate < today) {
    throw new Error('Pickup date must be today or in the future.');
  }
  return true;
};

/**
 * Validates that expiry date is in the future.
 * @param {string} value - ISO 8601 datetime string
 */
const isFutureExpiryDate = (value) => {
  if (new Date(value).getTime() <= Date.now()) {
    throw new Error('Expiry date must be in the future.');
  }
  return true;
};

const donationIdParamValidationRules = [
  param('id').isInt({ min: 1 }).withMessage('A valid donation id is required.'),
];

const createDonationValidationRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ max: 200 }).withMessage('Title must not exceed 200 characters.'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required.')
    .isIn(Object.values(DONATION_CATEGORY))
    .withMessage(`Category must be one of: ${Object.values(DONATION_CATEGORY).join(', ')}.`),

  body('quantity')
    .notEmpty().withMessage('Quantity is required.')
    .isInt({ min: 1 }).withMessage('Quantity must be a positive integer.')
    .toInt(),

  body('quantityUnit')
    .optional()
    .trim()
    .isIn(Object.values(QUANTITY_UNIT))
    .withMessage(`Quantity unit must be one of: ${Object.values(QUANTITY_UNIT).join(', ')}.`),

  body('numberOfServings')
    .optional()
    .isInt({ min: 1 }).withMessage('Number of servings must be a positive integer.')
    .toInt(),

  body('pickupTime')
    .notEmpty().withMessage('Pickup time is required.')
    .isISO8601().withMessage('Pickup time must be a valid date/time (ISO 8601).')
    .custom(isFuturePickupTime),

  body('pickupDate')
    .notEmpty().withMessage('Pickup date is required.')
    .isISO8601().withMessage('Pickup date must be a valid date (YYYY-MM-DD).')
    .custom(isFuturePickupDate),

  body('pickupTimeSlot')
    .notEmpty().withMessage('Pickup time slot is required.')
    .isIn(Object.values(TIME_SLOT))
    .withMessage(`Pickup time slot must be one of: ${Object.values(TIME_SLOT).join(', ')}.`),

  body('expiryDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Expiry date must be a valid date/time (ISO 8601).')
    .custom(isFutureExpiryDate),

  body('contactPhone')
    .trim()
    .notEmpty().withMessage('Contact phone is required.')
    .isLength({ max: 20 }).withMessage('Contact phone must not exceed 20 characters.')
    .matches(/^[+]?[\d\s-()]+$/).withMessage('Contact phone must be a valid phone number.'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.'),

  body('photo')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 }).withMessage('Photo path must not exceed 255 characters.'),

  // Food-specific fields
  body('foodType')
    .optional()
    .trim()
    .isIn(Object.values(FOOD_TYPE))
    .withMessage(`Food type must be one of: ${Object.values(FOOD_TYPE).join(', ')}.`),

  body('foodName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Food name must not exceed 200 characters.'),

  body('ingredients')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Ingredients must not exceed 500 characters.'),

  body('allergens')
    .optional()
    .isArray().withMessage('Allergens must be an array.')
    .custom((value) => {
      if (value && !value.every((a) => Object.values(ALLERGENS).includes(a))) {
        throw new Error(`Allergens must be one of: ${Object.values(ALLERGENS).join(', ')}.`);
      }
      return true;
    }),

  body('storageRequirement')
    .optional()
    .trim()
    .isIn(Object.values(STORAGE_REQUIREMENT))
    .withMessage(`Storage requirement must be one of: ${Object.values(STORAGE_REQUIREMENT).join(', ')}.`),

  body('isVegetarian')
    .optional()
    .trim()
    .isIn(Object.values(VEGETARIAN))
    .withMessage(`Vegetarian option must be one of: ${Object.values(VEGETARIAN).join(', ')}.`),

  body('isHalal')
    .optional()
    .trim()
    .isIn(Object.values(HALAL))
    .withMessage(`Halal option must be one of: ${Object.values(HALAL).join(', ')}.`),

  body('refrigerationRequired')
    .optional()
    .trim()
    .isIn(Object.values(REFRIGERATION_REQUIRED))
    .withMessage(`Refrigeration option must be one of: ${Object.values(REFRIGERATION_REQUIRED).join(', ')}.`),

  // Clothes-specific fields
  body('clothingCategory')
    .optional()
    .trim()
    .isIn(Object.values(CLOTHING_CATEGORY))
    .withMessage(`Clothing category must be one of: ${Object.values(CLOTHING_CATEGORY).join(', ')}.`),

  body('gender')
    .optional()
    .trim()
    .isIn(Object.values(GENDER))
    .withMessage(`Gender must be one of: ${Object.values(GENDER).join(', ')}.`),

  body('ageGroup')
    .optional()
    .trim()
    .isIn(Object.values(AGE_GROUP))
    .withMessage(`Age group must be one of: ${Object.values(AGE_GROUP).join(', ')}.`),

  body('itemCondition')
    .optional()
    .trim()
    .isIn(Object.values(CONDITION))
    .withMessage(`Condition must be one of: ${Object.values(CONDITION).join(', ')}.`),

  body('brand')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Brand must not exceed 100 characters.'),

  body('size')
    .optional()
    .trim()
    .isIn(Object.values(SIZE))
    .withMessage(`Size must be one of: ${Object.values(SIZE).join(', ')}.`),

  body('color')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Color must not exceed 50 characters.'),

  body('season')
    .optional()
    .trim()
    .isIn(Object.values(SEASON))
    .withMessage(`Season must be one of: ${Object.values(SEASON).join(', ')}.`),

  body('images')
    .optional()
    .isArray().withMessage('Images must be an array.'),

  body('additionalNotes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Additional notes must not exceed 1000 characters.'),

  // Address handling - either savedAddressId or pickupAddress
  body('savedAddressId')
    .optional()
    .isInt({ min: 1 }).withMessage('Saved address ID must be a positive integer.')
    .toInt(),

  body('pickupAddress')
    .optional()
    .isObject().withMessage('Pickup address must be an object.'),

  body('pickupAddress.fullAddress')
    .if(body('pickupAddress').exists())
    .notEmpty().withMessage('Full address is required.')
    .isLength({ max: 500 }).withMessage('Full address must not exceed 500 characters.'),

  body('pickupAddress.division')
    .if(body('pickupAddress').exists())
    .notEmpty().withMessage('Division is required.')
    .isLength({ max: 100 }).withMessage('Division must not exceed 100 characters.'),

  body('pickupAddress.district')
    .if(body('pickupAddress').exists())
    .notEmpty().withMessage('District is required.')
    .isLength({ max: 100 }).withMessage('District must not exceed 100 characters.'),

  body('pickupAddress.area')
    .if(body('pickupAddress').exists())
    .notEmpty().withMessage('Area is required.')
    .isLength({ max: 100 }).withMessage('Area must not exceed 100 characters.'),

  body('pickupAddress.contactPersonName')
    .if(body('pickupAddress').exists())
    .notEmpty().withMessage('Contact person name is required.')
    .isLength({ max: 100 }).withMessage('Contact person name must not exceed 100 characters.'),

  body('pickupAddress.contactPhone')
    .if(body('pickupAddress').exists())
    .notEmpty().withMessage('Contact phone is required.')
    .matches(/^[+]?[\d\s-()]+$/).withMessage('Contact phone must be a valid phone number.'),

  body('saveForFuture')
    .optional()
    .isBoolean().withMessage('Save for future must be a boolean value.'),

  // Custom validation: either savedAddressId or pickupAddress must be provided
  body().custom((value) => {
    if (!value.savedAddressId && !value.pickupAddress) {
      throw new Error('Either savedAddressId or pickupAddress must be provided.');
    }
    if (value.savedAddressId && value.pickupAddress) {
      throw new Error('Cannot provide both savedAddressId and pickupAddress. Use one approach only.');
    }
    return true;
  }),
];

const updateDonationValidationRules = [
  ...donationIdParamValidationRules,

  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title must not exceed 200 characters.'),

  body('category')
    .optional()
    .trim()
    .isIn(Object.values(DONATION_CATEGORY))
    .withMessage(`Category must be one of: ${Object.values(DONATION_CATEGORY).join(', ')}.`),

  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be a positive integer.')
    .toInt(),

  body('quantityUnit')
    .optional()
    .trim()
    .isIn(Object.values(QUANTITY_UNIT))
    .withMessage(`Quantity unit must be one of: ${Object.values(QUANTITY_UNIT).join(', ')}.`),

  body('numberOfServings')
    .optional()
    .isInt({ min: 1 }).withMessage('Number of servings must be a positive integer.')
    .toInt(),

  body('pickupTime')
    .optional()
    .isISO8601().withMessage('Pickup time must be a valid date/time (ISO 8601).')
    .custom(isFuturePickupTime),

  body('pickupDate')
    .optional()
    .isISO8601().withMessage('Pickup date must be a valid date (YYYY-MM-DD).')
    .custom(isFuturePickupDate),

  body('pickupTimeSlot')
    .optional()
    .trim()
    .isIn(Object.values(TIME_SLOT))
    .withMessage(`Pickup time slot must be one of: ${Object.values(TIME_SLOT).join(', ')}.`),

  body('expiryDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Expiry date must be a valid date/time (ISO 8601).')
    .custom(isFutureExpiryDate),

  body('contactPhone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Contact phone must not exceed 20 characters.')
    .matches(/^[+]?[\d\s-()]+$/).withMessage('Contact phone must be a valid phone number.'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.'),

  body('photo')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 }).withMessage('Photo path must not exceed 255 characters.'),

  // Food-specific fields
  body('foodType')
    .optional()
    .trim()
    .isIn(Object.values(FOOD_TYPE))
    .withMessage(`Food type must be one of: ${Object.values(FOOD_TYPE).join(', ')}.`),

  body('foodName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Food name must not exceed 200 characters.'),

  body('ingredients')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Ingredients must not exceed 500 characters.'),

  body('allergens')
    .optional()
    .isArray().withMessage('Allergens must be an array.')
    .custom((value) => {
      if (value && !value.every((a) => Object.values(ALLERGENS).includes(a))) {
        throw new Error(`Allergens must be one of: ${Object.values(ALLERGENS).join(', ')}.`);
      }
      return true;
    }),

  body('storageRequirement')
    .optional()
    .trim()
    .isIn(Object.values(STORAGE_REQUIREMENT))
    .withMessage(`Storage requirement must be one of: ${Object.values(STORAGE_REQUIREMENT).join(', ')}.`),

  body('isVegetarian')
    .optional()
    .trim()
    .isIn(Object.values(VEGETARIAN))
    .withMessage(`Vegetarian option must be one of: ${Object.values(VEGETARIAN).join(', ')}.`),

  body('isHalal')
    .optional()
    .trim()
    .isIn(Object.values(HALAL))
    .withMessage(`Halal option must be one of: ${Object.values(HALAL).join(', ')}.`),

  body('refrigerationRequired')
    .optional()
    .trim()
    .isIn(Object.values(REFRIGERATION_REQUIRED))
    .withMessage(`Refrigeration option must be one of: ${Object.values(REFRIGERATION_REQUIRED).join(', ')}.`),

  // Clothes-specific fields
  body('clothingCategory')
    .optional()
    .trim()
    .isIn(Object.values(CLOTHING_CATEGORY))
    .withMessage(`Clothing category must be one of: ${Object.values(CLOTHING_CATEGORY).join(', ')}.`),

  body('gender')
    .optional()
    .trim()
    .isIn(Object.values(GENDER))
    .withMessage(`Gender must be one of: ${Object.values(GENDER).join(', ')}.`),

  body('ageGroup')
    .optional()
    .trim()
    .isIn(Object.values(AGE_GROUP))
    .withMessage(`Age group must be one of: ${Object.values(AGE_GROUP).join(', ')}.`),

  body('itemCondition')
    .optional()
    .trim()
    .isIn(Object.values(CONDITION))
    .withMessage(`Condition must be one of: ${Object.values(CONDITION).join(', ')}.`),

  body('brand')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Brand must not exceed 100 characters.'),

  body('size')
    .optional()
    .trim()
    .isIn(Object.values(SIZE))
    .withMessage(`Size must be one of: ${Object.values(SIZE).join(', ')}.`),

  body('color')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Color must not exceed 50 characters.'),

  body('season')
    .optional()
    .trim()
    .isIn(Object.values(SEASON))
    .withMessage(`Season must be one of: ${Object.values(SEASON).join(', ')}.`),

  body('images')
    .optional()
    .isArray().withMessage('Images must be an array.'),

  body('additionalNotes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Additional notes must not exceed 1000 characters.'),

  body('savedAddressId')
    .optional()
    .isInt({ min: 1 }).withMessage('Saved address ID must be a positive integer.')
    .toInt(),
];

const cancelDonationValidationRules = [...donationIdParamValidationRules];

const acceptDonationValidationRules = [...donationIdParamValidationRules];

const schedulePickupValidationRules = [
  ...donationIdParamValidationRules,

  body('scheduledAt')
    .notEmpty().withMessage('scheduledAt is required.')
    .isISO8601().withMessage('scheduledAt must be a valid date/time (ISO 8601).')
    .custom((value) => {
      if (new Date(value).getTime() <= Date.now()) {
        throw new Error('scheduledAt must be in the future.');
      }
      return true;
    }),
];

// (Module 9) Both new transition endpoints only take the id param — no body.
const onTheWayValidationRules = [...donationIdParamValidationRules];
const pickedUpValidationRules = [...donationIdParamValidationRules];

const completeDonationValidationRules = [...donationIdParamValidationRules];

const browseDonationsValidationRules = [
  query('category')
    .optional()
    .trim()
    .isIn(Object.values(DONATION_CATEGORY))
    .withMessage(`Category must be one of: ${Object.values(DONATION_CATEGORY).join(', ')}.`),

  query('location')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Location filter must not exceed 255 characters.'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search keyword must not exceed 255 characters.'),

  query('sortBy')
    .optional()
    .trim()
    .isIn(ALLOWED_SORT_FIELDS)
    .withMessage(`sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}.`),

  query('sortOrder')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['asc', 'desc']).withMessage('sortOrder must be either "asc" or "desc".'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer.')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION_DEFAULTS.MAX_LIMIT })
    .withMessage(`limit must be between 1 and ${PAGINATION_DEFAULTS.MAX_LIMIT}.`)
    .toInt(),
];

/**
 * Shared query-param rules for both /my-history and /assigned-history.
 * `status` is validated against the FULL DONATION_STATUS list (not just
 * pending, unlike browse) since history intentionally spans every status
 * a donation can be in.
 */
const historyQueryValidationRules = [
  query('status')
    .optional()
    .trim()
    .isIn(Object.values(DONATION_STATUS))
    .withMessage(`status must be one of: ${Object.values(DONATION_STATUS).join(', ')}.`),

  query('category')
    .optional()
    .trim()
    .isIn(Object.values(DONATION_CATEGORY))
    .withMessage(`Category must be one of: ${Object.values(DONATION_CATEGORY).join(', ')}.`),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search keyword must not exceed 255 characters.'),

  query('sortBy')
    .optional()
    .trim()
    .isIn(ALLOWED_HISTORY_SORT_FIELDS)
    .withMessage(`sortBy must be one of: ${ALLOWED_HISTORY_SORT_FIELDS.join(', ')}.`),

  query('sortOrder')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['asc', 'desc']).withMessage('sortOrder must be either "asc" or "desc".'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer.')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION_DEFAULTS.MAX_LIMIT })
    .withMessage(`limit must be between 1 and ${PAGINATION_DEFAULTS.MAX_LIMIT}.`)
    .toInt(),
];

// Summary endpoints take no input (no :id, no query params) — kept as an
// explicit empty rule set + validateRequest in the routes for consistency
// with every other endpoint's shape, rather than special-casing these two.
const historySummaryValidationRules = [];

module.exports = {
  createDonationValidationRules,
  updateDonationValidationRules,
  cancelDonationValidationRules,
  browseDonationsValidationRules,
  acceptDonationValidationRules,
  schedulePickupValidationRules,
  onTheWayValidationRules,
  pickedUpValidationRules,
  completeDonationValidationRules,
  historyQueryValidationRules,
  historySummaryValidationRules,
};
