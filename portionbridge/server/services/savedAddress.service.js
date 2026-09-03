const { HTTP_STATUS, ADDRESS_LABEL } = require('../constants');
const AppError = require('../utils/AppError');
const savedAddressModel = require('../models/savedAddress.model');

const MAX_ADDRESSES_PER_USER = 3;

/**
 * Creates a new saved address for a user.
 * Validates that the user doesn't exceed the maximum of 3 addresses.
 * @param {number} userId - ID of the user
 * @param {Object} data - Address data
 * @returns {Promise<Object>} The newly created address object
 */
async function createAddress(userId, data) {
  // Check if user has reached the maximum limit
  const currentCount = await savedAddressModel.countByUserId(userId);
  if (currentCount >= MAX_ADDRESSES_PER_USER) {
    throw new AppError(
      `Maximum ${MAX_ADDRESSES_PER_USER} saved addresses allowed per user.`,
      HTTP_STATUS.CONFLICT
    );
  }

  // If this is the first address, make it default
  if (currentCount === 0) {
    data.isDefault = true;
  } else if (data.isDefault) {
    // BUG FIX (Phase 12 QA): explicitly creating a 2nd/3rd address with
    // isDefault=true previously left TWO rows with is_default=1, since only
    // the "first address" branch above ever cleared an existing default.
    // A matching DB trigger was attempted for this but is impossible in
    // MySQL/MariaDB (a trigger can't modify the table that fired it on
    // INSERT) — see database/triggers.sql — so this must be handled here.
    await savedAddressModel.clearDefaultForUser(userId);
  }

  // If label is 'custom', custom_label is required
  if (data.label === ADDRESS_LABEL.CUSTOM && !data.customLabel) {
    throw new AppError(
      'Custom label is required when label is set to "custom".',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // If label is not 'custom', custom_label should be null
  if (data.label !== ADDRESS_LABEL.CUSTOM && data.customLabel) {
    throw new AppError(
      'Custom label can only be set when label is "custom".',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const insertId = await savedAddressModel.create({
    userId,
    ...data,
  });

  return savedAddressModel.findById(insertId);
}

/**
 * Gets all saved addresses for a user.
 * @param {number} userId - ID of the user
 * @returns {Promise<Array>} Array of address objects
 */
async function getUserAddresses(userId) {
  return savedAddressModel.findByUserId(userId);
}

/**
 * Gets a single saved address by ID.
 * Validates ownership before returning.
 * @param {number} addressId - Address ID
 * @param {number} userId - ID of the user requesting
 * @returns {Promise<Object>} Address object
 */
async function getAddressById(addressId, userId) {
  const address = await savedAddressModel.findById(addressId);

  if (!address) {
    throw new AppError('Address not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (address.user_id !== userId) {
    throw new AppError('You are not allowed to access this address.', HTTP_STATUS.FORBIDDEN);
  }

  return address;
}

/**
 * Updates a saved address.
 * Validates ownership before updating.
 * @param {number} addressId - Address ID
 * @param {number} userId - ID of the user requesting
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated address object
 */
async function updateAddress(addressId, userId, updates) {
  const address = await savedAddressModel.findById(addressId);

  if (!address) {
    throw new AppError('Address not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (address.user_id !== userId) {
    throw new AppError('You are not allowed to modify this address.', HTTP_STATUS.FORBIDDEN);
  }

  // Validate label/custom_label consistency
  if (updates.label === ADDRESS_LABEL.CUSTOM && !updates.customLabel && !address.custom_label) {
    throw new AppError(
      'Custom label is required when label is set to "custom".',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (updates.label && updates.label !== ADDRESS_LABEL.CUSTOM) {
    updates.customLabel = null;
  }

  await savedAddressModel.updateById(addressId, updates);

  return savedAddressModel.findById(addressId);
}

/**
 * Deletes a saved address.
 * Validates ownership before deleting.
 * @param {number} addressId - Address ID
 * @param {number} userId - ID of the user requesting
 * @returns {Promise<void>}
 */
async function deleteAddress(addressId, userId) {
  const address = await savedAddressModel.findById(addressId);

  if (!address) {
    throw new AppError('Address not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (address.user_id !== userId) {
    throw new AppError('You are not allowed to delete this address.', HTTP_STATUS.FORBIDDEN);
  }

  await savedAddressModel.deleteById(addressId);

  // If the deleted address was default, set another address as default if any exist
  if (address.is_default) {
    const remainingAddresses = await savedAddressModel.findByUserId(userId);
    if (remainingAddresses.length > 0) {
      await savedAddressModel.setDefault(remainingAddresses[0].id, userId);
    }
  }
}

/**
 * Sets an address as the default for a user.
 * Validates ownership before setting.
 * @param {number} addressId - Address ID
 * @param {number} userId - ID of the user requesting
 * @returns {Promise<Object>} Updated address object
 */
async function setDefaultAddress(addressId, userId) {
  const address = await savedAddressModel.findById(addressId);

  if (!address) {
    throw new AppError('Address not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (address.user_id !== userId) {
    throw new AppError('You are not allowed to modify this address.', HTTP_STATUS.FORBIDDEN);
  }

  // If already default, no action needed
  if (address.is_default) {
    return address;
  }

  const success = await savedAddressModel.setDefault(addressId, userId);

  if (!success) {
    throw new AppError('Failed to set default address.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return savedAddressModel.findById(addressId);
}

/**
 * Gets the default address for a user.
 * @param {number} userId - ID of the user
 * @returns {Promise<Object|null>} Default address object or null if not found
 */
async function getDefaultAddress(userId) {
  return savedAddressModel.findDefaultByUserId(userId);
}

module.exports = {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
};
