const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  DONATION_CATEGORY,
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
  ADDRESS_LABEL,
  TIME_SLOT,
} = require('../constants');

/**
 * GET /api/v1/master/donation-types
 * Returns available donation types
 */
const getDonationTypes = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation types retrieved successfully.',
    data: {
      donationTypes: Object.values(DONATION_CATEGORY),
    },
  });
});

/**
 * GET /api/v1/master/food-types
 * Returns available food types
 */
const getFoodTypes = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Food types retrieved successfully.',
    data: {
      foodTypes: Object.values(FOOD_TYPE),
    },
  });
});

/**
 * GET /api/v1/master/quantity-units
 * Returns available quantity units
 */
const getQuantityUnits = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Quantity units retrieved successfully.',
    data: {
      quantityUnits: Object.values(QUANTITY_UNIT),
    },
  });
});

/**
 * GET /api/v1/master/storage-requirements
 * Returns available storage requirements
 */
const getStorageRequirements = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Storage requirements retrieved successfully.',
    data: {
      storageRequirements: Object.values(STORAGE_REQUIREMENT),
    },
  });
});

/**
 * GET /api/v1/master/vegetarian-options
 * Returns available vegetarian options
 */
const getVegetarianOptions = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Vegetarian options retrieved successfully.',
    data: {
      vegetarianOptions: Object.values(VEGETARIAN),
    },
  });
});

/**
 * GET /api/v1/master/halal-options
 * Returns available halal options
 */
const getHalalOptions = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Halal options retrieved successfully.',
    data: {
      halalOptions: Object.values(HALAL),
    },
  });
});

/**
 * GET /api/v1/master/refrigeration-options
 * Returns available refrigeration options
 */
const getRefrigerationOptions = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Refrigeration options retrieved successfully.',
    data: {
      refrigerationOptions: Object.values(REFRIGERATION_REQUIRED),
    },
  });
});

/**
 * GET /api/v1/master/allergens
 * Returns available allergens (for multi-select)
 */
const getAllergens = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Allergens retrieved successfully.',
    data: {
      allergens: Object.values(ALLERGENS),
    },
  });
});

/**
 * GET /api/v1/master/clothing-categories
 * Returns available clothing categories
 */
const getClothingCategories = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Clothing categories retrieved successfully.',
    data: {
      clothingCategories: Object.values(CLOTHING_CATEGORY),
    },
  });
});

/**
 * GET /api/v1/master/genders
 * Returns available gender options
 */
const getGenders = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Gender options retrieved successfully.',
    data: {
      genders: Object.values(GENDER),
    },
  });
});

/**
 * GET /api/v1/master/age-groups
 * Returns available age groups
 */
const getAgeGroups = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Age groups retrieved successfully.',
    data: {
      ageGroups: Object.values(AGE_GROUP),
    },
  });
});

/**
 * GET /api/v1/master/conditions
 * Returns available item conditions
 */
const getConditions = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Item conditions retrieved successfully.',
    data: {
      conditions: Object.values(CONDITION),
    },
  });
});

/**
 * GET /api/v1/master/sizes
 * Returns available size options
 */
const getSizes = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Size options retrieved successfully.',
    data: {
      sizes: Object.values(SIZE),
    },
  });
});

/**
 * GET /api/v1/master/seasons
 * Returns available season options
 */
const getSeasons = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Season options retrieved successfully.',
    data: {
      seasons: Object.values(SEASON),
    },
  });
});

/**
 * GET /api/v1/master/address-labels
 * Returns available address labels
 */
const getAddressLabels = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Address labels retrieved successfully.',
    data: {
      addressLabels: Object.values(ADDRESS_LABEL),
    },
  });
});

/**
 * GET /api/v1/master/time-slots
 * Returns available time slots
 */
const getTimeSlots = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Time slots retrieved successfully.',
    data: {
      timeSlots: Object.values(TIME_SLOT),
    },
  });
});

/**
 * GET /api/v1/master/all
 * Returns all master data in a single response
 * Useful for frontend initialization
 */
const getAllMasterData = asyncHandler(async (req, res) => {
  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'All master data retrieved successfully.',
    data: {
      donationTypes: Object.values(DONATION_CATEGORY),
      foodTypes: Object.values(FOOD_TYPE),
      quantityUnits: Object.values(QUANTITY_UNIT),
      storageRequirements: Object.values(STORAGE_REQUIREMENT),
      vegetarianOptions: Object.values(VEGETARIAN),
      halalOptions: Object.values(HALAL),
      refrigerationOptions: Object.values(REFRIGERATION_REQUIRED),
      allergens: Object.values(ALLERGENS),
      clothingCategories: Object.values(CLOTHING_CATEGORY),
      genders: Object.values(GENDER),
      ageGroups: Object.values(AGE_GROUP),
      conditions: Object.values(CONDITION),
      sizes: Object.values(SIZE),
      seasons: Object.values(SEASON),
      addressLabels: Object.values(ADDRESS_LABEL),
      timeSlots: Object.values(TIME_SLOT),
    },
  });
});

module.exports = {
  getDonationTypes,
  getFoodTypes,
  getQuantityUnits,
  getStorageRequirements,
  getVegetarianOptions,
  getHalalOptions,
  getRefrigerationOptions,
  getAllergens,
  getClothingCategories,
  getGenders,
  getAgeGroups,
  getConditions,
  getSizes,
  getSeasons,
  getAddressLabels,
  getTimeSlots,
  getAllMasterData,
};
