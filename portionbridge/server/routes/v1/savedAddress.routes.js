const express = require('express');
const router = express.Router();

const savedAddressController = require('../../controllers/savedAddress.controller');
const savedAddressValidator = require('../../validators/savedAddress.validator');
const validateRequest = require('../../middleware/validateRequest');
const { authenticate } = require('../../middleware/auth');

// All saved address routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/saved-addresses
 * Create a new saved address
 */
router.post(
  '/',
  savedAddressValidator.createAddressValidationRules,
  validateRequest,
  savedAddressController.createAddress
);

/**
 * GET /api/v1/saved-addresses
 * Get all saved addresses for the authenticated user
 */
router.get(
  '/',
  savedAddressController.getUserAddresses
);

/**
 * GET /api/v1/saved-addresses/default
 * Get the default address for the authenticated user
 */
router.get(
  '/default',
  savedAddressController.getDefaultAddress
);

/**
 * GET /api/v1/saved-addresses/:id
 * Get a single saved address by ID
 */
router.get(
  '/:id',
  savedAddressValidator.getAddressByIdValidationRules,
  validateRequest,
  savedAddressController.getAddressById
);

/**
 * PATCH /api/v1/saved-addresses/:id
 * Update a saved address
 */
router.patch(
  '/:id',
  savedAddressValidator.updateAddressValidationRules,
  validateRequest,
  savedAddressController.updateAddress
);

/**
 * DELETE /api/v1/saved-addresses/:id
 * Delete a saved address
 */
router.delete(
  '/:id',
  savedAddressValidator.deleteAddressValidationRules,
  validateRequest,
  savedAddressController.deleteAddress
);

/**
 * PATCH /api/v1/saved-addresses/:id/set-default
 * Set an address as the default
 */
router.patch(
  '/:id/set-default',
  savedAddressValidator.setDefaultAddressValidationRules,
  validateRequest,
  savedAddressController.setDefaultAddress
);

module.exports = router;
