const mongoose = require('mongoose');
const { body, param, query } = require('express-validator');

const isObjectId = (value) => mongoose.isValidObjectId(value);
const PHONE_REGEX = /^[6-9]\d{9}$/;

const validateCreateCustom = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 120 })
    .withMessage('Title must be under 120 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description must be under 1000 characters'),
  body('siteLocation.address')
    .trim()
    .notEmpty()
    .withMessage('Site address is required'),
  body('siteLocation.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('siteLocation.state').optional({ values: 'falsy' }).trim(),
  body('siteLocation.pincode')
    .optional({ values: 'falsy' })
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),
  body('itemsNeeded')
    .optional()
    .isArray({ min: 1 })
    .withMessage('itemsNeeded must be a non-empty array'),
  body('itemsNeeded.*.item')
    .optional({ values: 'null' })
    .custom(isObjectId)
    .withMessage('Each item must be a valid item id'),
  body('itemsNeeded.*.quantity')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Each item quantity must be at least 1'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  body('durationDays')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 day'),
  body('budget').optional({ values: 'null' }).isFloat({ min: 0 }),
  body('contactPhone')
    .optional({ values: 'falsy' })
    .matches(PHONE_REGEX)
    .withMessage('Enter a valid 10-digit Indian phone number'),
];

const validateUpdateCustom = [
  param('id').custom(isObjectId).withMessage('Invalid custom id'),
  body('title').optional({ values: 'falsy' }).trim().isLength({ min: 1, max: 120 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ min: 1, max: 1000 }),
  body('startDate').optional({ values: 'falsy' }).isISO8601(),
  body('durationDays').optional().isInt({ min: 1 }),
  body('budget').optional().isFloat({ min: 0 }),
  body('status')
    .optional()
    .isIn(['open', 'matched', 'fulfilled', 'cancelled'])
    .withMessage('Status must be one of: open, matched, fulfilled, cancelled'),
  body('contactPhone').optional().matches(PHONE_REGEX),
];

const validateGetCustoms = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['open', 'matched', 'fulfilled', 'cancelled']),
  query('city').optional().trim(),
];

const validateCustomId = [param('id').custom(isObjectId).withMessage('Invalid custom id')];

module.exports = {
  validateCreateCustom,
  validateUpdateCustom,
  validateGetCustoms,
  validateCustomId,
};
