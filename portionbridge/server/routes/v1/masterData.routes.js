const express = require('express');
const router = express.Router();

const masterDataController = require('../../controllers/masterData.controller');

/**
 * GET /api/v1/master/donation-types
 */
router.get('/donation-types', masterDataController.getDonationTypes);

/**
 * GET /api/v1/master/food-types
 */
router.get('/food-types', masterDataController.getFoodTypes);

/**
 * GET /api/v1/master/quantity-units
 */
router.get('/quantity-units', masterDataController.getQuantityUnits);

/**
 * GET /api/v1/master/storage-requirements
 */
router.get('/storage-requirements', masterDataController.getStorageRequirements);

/**
 * GET /api/v1/master/vegetarian-options
 */
router.get('/vegetarian-options', masterDataController.getVegetarianOptions);

/**
 * GET /api/v1/master/halal-options
 */
router.get('/halal-options', masterDataController.getHalalOptions);

/**
 * GET /api/v1/master/refrigeration-options
 */
router.get('/refrigeration-options', masterDataController.getRefrigerationOptions);

/**
 * GET /api/v1/master/allergens
 */
router.get('/allergens', masterDataController.getAllergens);

/**
 * GET /api/v1/master/clothing-categories
 */
router.get('/clothing-categories', masterDataController.getClothingCategories);

/**
 * GET /api/v1/master/genders
 */
router.get('/genders', masterDataController.getGenders);

/**
 * GET /api/v1/master/age-groups
 */
router.get('/age-groups', masterDataController.getAgeGroups);

/**
 * GET /api/v1/master/conditions
 */
router.get('/conditions', masterDataController.getConditions);

/**
 * GET /api/v1/master/sizes
 */
router.get('/sizes', masterDataController.getSizes);

/**
 * GET /api/v1/master/seasons
 */
router.get('/seasons', masterDataController.getSeasons);

/**
 * GET /api/v1/master/address-labels
 */
router.get('/address-labels', masterDataController.getAddressLabels);

/**
 * GET /api/v1/master/time-slots
 */
router.get('/time-slots', masterDataController.getTimeSlots);

/**
 * GET /api/v1/master/donation-statuses
 * Returns available donation statuses
 */
router.get('/donation-statuses', masterDataController.getDonationStatuses);

/**
 * GET /api/v1/master/assignment-modes
 * Returns available assignment modes
 */
router.get('/assignment-modes', masterDataController.getAssignmentModes);

/**
 * GET /api/v1/master/all
 * Returns all master data in a single response
 */
router.get('/all', masterDataController.getAllMasterData);

module.exports = router;
