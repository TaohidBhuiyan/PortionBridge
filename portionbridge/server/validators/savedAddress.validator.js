const { body, param } = require('express-validator');
const { ADDRESS_LABEL } = require('../constants');

const addressIdParamValidationRules = [
  param('id').isInt({ min: 1 }).withMessage('A valid address id is required.'),
];

const createAddressValidationRules = [
  body('label')
    .trim()
    .notEmpty().withMessage('Label is required.')
    .isIn(Object.values(ADDRESS_LABEL))
    .withMessage(`Label must be one of: ${Object.values(ADDRESS_LABEL).join(', ')}.`),

  body('customLabel')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Custom label must not exceed 50 characters.')
    .custom((value, { req }) => {
      if (req.body.label === ADDRESS_LABEL.CUSTOM && !value) {
        throw new Error('Custom label is required when label is "custom".');
      }
      if (req.body.label !== ADDRESS_LABEL.CUSTOM && value) {
        throw new Error('Custom label can only be set when label is "custom".');
      }
      return true;
    }),

  body('fullAddress')
    .trim()
    .notEmpty().withMessage('Full address is required.')
    .isLength({ max: 500 }).withMessage('Full address must not exceed 500 characters.'),

  body('division')
    .trim()
    .notEmpty().withMessage('Division is required.')
    .isLength({ max: 100 }).withMessage('Division must not exceed 100 characters.'),

  body('district')
    .trim()
    .notEmpty().withMessage('District is required.')
    .isLength({ max: 100 }).withMessage('District must not exceed 100 characters.'),

  body('area')
    .trim()
    .notEmpty().withMessage('Area is required.')
    .isLength({ max: 100 }).withMessage('Area must not exceed 100 characters.'),

  body('postalCode')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Postal code must not exceed 20 characters.'),

  body('buildingName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Building name must not exceed 100 characters.'),

  body('floor')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Floor must not exceed 20 characters.'),

  body('landmark')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Landmark must not exceed 255 characters.'),

  body('deliveryInstructions')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Delivery instructions must not exceed 500 characters.'),

  body('latitude')
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),

  body('longitude')
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),

  body('contactPersonName')
    .trim()
    .notEmpty().withMessage('Contact person name is required.')
    .isLength({ max: 100 }).withMessage('Contact person name must not exceed 100 characters.'),

  body('contactPhone')
    .trim()
    .notEmpty().withMessage('Contact phone is required.')
    .isLength({ max: 20 }).withMessage('Contact phone must not exceed 20 characters.')
    .matches(/^[+]?[\d\s-()]+$/).withMessage('Contact phone must be a valid phone number.'),

  body('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean value.'),
];

const updateAddressValidationRules = [
  ...addressIdParamValidationRules,

  body('label')
    .optional()
    .trim()
    .isIn(Object.values(ADDRESS_LABEL))
    .withMessage(`Label must be one of: ${Object.values(ADDRESS_LABEL).join(', ')}.`),

  body('customLabel')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Custom label must not exceed 50 characters.'),

  body('fullAddress')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Full address must not exceed 500 characters.'),

  body('division')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Division must not exceed 100 characters.'),

  body('district')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('District must not exceed 100 characters.'),

  body('area')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Area must not exceed 100 characters.'),

  body('postalCode')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Postal code must not exceed 20 characters.'),

  body('buildingName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Building name must not exceed 100 characters.'),

  body('floor')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Floor must not exceed 20 characters.'),

  body('landmark')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Landmark must not exceed 255 characters.'),

  body('deliveryInstructions')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Delivery instructions must not exceed 500 characters.'),

  body('latitude')
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),

  body('longitude')
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),

  body('contactPersonName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Contact person name must not exceed 100 characters.'),

  body('contactPhone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Contact phone must not exceed 20 characters.')
    .matches(/^[+]?[\d\s-()]+$/).withMessage('Contact phone must be a valid phone number.'),

  body('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean value.'),
];

const deleteAddressValidationRules = [...addressIdParamValidationRules];

const setDefaultAddressValidationRules = [...addressIdParamValidationRules];

const getAddressByIdValidationRules = [...addressIdParamValidationRules];

module.exports = {
  createAddressValidationRules,
  updateAddressValidationRules,
  deleteAddressValidationRules,
  setDefaultAddressValidationRules,
  getAddressByIdValidationRules,
};
