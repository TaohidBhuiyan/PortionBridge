const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const savedAddressService = require('../services/savedAddress.service');

/**
 * POST /api/v1/saved-addresses
 * Create a new saved address
 */
const createAddress = asyncHandler(async (req, res) => {
  const address = await savedAddressService.createAddress(req.user.id, req.body);

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Address saved successfully.',
    data: { address },
  });
});

/**
 * GET /api/v1/saved-addresses
 * Get all saved addresses for the authenticated user
 */
const getUserAddresses = asyncHandler(async (req, res) => {
  const addresses = await savedAddressService.getUserAddresses(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Addresses retrieved successfully.',
    data: { addresses },
  });
});

/**
 * GET /api/v1/saved-addresses/default
 * Get the default address for the authenticated user
 */
const getDefaultAddress = asyncHandler(async (req, res) => {
  const address = await savedAddressService.getDefaultAddress(req.user.id);

  if (!address) {
    return success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'No default address found.',
      data: { address: null },
    });
  }

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Default address retrieved successfully.',
    data: { address },
  });
});

/**
 * GET /api/v1/saved-addresses/:id
 * Get a single saved address by ID
 */
const getAddressById = asyncHandler(async (req, res) => {
  const address = await savedAddressService.getAddressById(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Address retrieved successfully.',
    data: { address },
  });
});

/**
 * PATCH /api/v1/saved-addresses/:id
 * Update a saved address
 */
const updateAddress = asyncHandler(async (req, res) => {
  const address = await savedAddressService.updateAddress(req.params.id, req.user.id, req.body);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Address updated successfully.',
    data: { address },
  });
});

/**
 * DELETE /api/v1/saved-addresses/:id
 * Delete a saved address
 */
const deleteAddress = asyncHandler(async (req, res) => {
  await savedAddressService.deleteAddress(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Address deleted successfully.',
  });
});

/**
 * PATCH /api/v1/saved-addresses/:id/set-default
 * Set an address as the default
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await savedAddressService.setDefaultAddress(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Default address set successfully.',
    data: { address },
  });
});

module.exports = {
  createAddress,
  getUserAddresses,
  getDefaultAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
