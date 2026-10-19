const AppError = require('./AppError');
const { parseQuantity, isValidForUnit } = require('./reliefQuantity');
const { HTTP_STATUS } = require('../constants');

/** Parses a client quantity into milli-units or throws a 422 (positive, <= 3 decimals, whole for indivisible units). */
function quantityOrThrow(value, unit, label = 'Quantity') {
  const milli = parseQuantity(value);
  if (milli === null) {
    throw new AppError(`${label} must be a positive number with at most 3 decimals.`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
  if (!isValidForUnit(milli, unit)) {
    throw new AppError(`${label} must be a whole number for unit "${unit}".`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
  return milli;
}

module.exports = { quantityOrThrow };
