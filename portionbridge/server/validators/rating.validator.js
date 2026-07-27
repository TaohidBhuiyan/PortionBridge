const { body, param } = require('express-validator');

/**
 * Note: comment is capped at 500 chars to match the actual `ratings.comment`
 * column (VARCHAR(500)) — see the Module 9 breaking-change/schema notes for
 * why this doesn't match the spec's stated 1000-char figure.
 */
const createRatingValidationRules = [
  body('donationId')
    .notEmpty().withMessage('donationId is required.')
    .isInt({ min: 1 }).withMessage('donationId must be a positive integer.')
    .toInt(),

  body('rating')
    .notEmpty().withMessage('rating is required.')
    .isInt({ min: 1, max: 5 }).withMessage('rating must be an integer between 1 and 5.')
    .toInt(),

  body('comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('comment must not exceed 500 characters.'),
];

const getRatingValidationRules = [
  param('donationId').isInt({ min: 1 }).withMessage('A valid donationId is required.'),
];

module.exports = { createRatingValidationRules, getRatingValidationRules };
