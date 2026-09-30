const mongoose = require('mongoose');
const { body, param, query } = require('express-validator');

const isObjectId = (value) => mongoose.isValidObjectId(value);

const validateCreateRental = [
  body('item')
    .customSanitizer((v) => v)
    .notEmpty()
    .withMessage('Item is required')
    .bail()
    .custom(isObjectId)
    .withMessage('Invalid item id'),
  body('custom')
    .optional({ values: 'null' })
    .custom(isObjectId)
    .withMessage('Invalid custom id'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('dailyRent')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Daily rent must be a non-negative number'),
  body('deliveryCharges').optional({ values: 'null' }).isFloat({ min: 0 }),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
];

const validateUpdateRentalStatus = [
  param('id').custom(isObjectId).withMessage('Invalid rental id'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'])
    .withMessage(
      'Status must be one of: pending, confirmed, ongoing, completed, cancelled'
    ),
  body('returnDate').optional({ values: 'null' }).isISO8601().withMessage('Return date must be a valid ISO date'),
  body('actualReturnDate').optional({ values: 'null' }).isISO8601().withMessage('Actual return date must be a valid ISO date'),
];

const validateRentalPayment = [
  param('id').custom(isObjectId).withMessage('Invalid rental id'),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Payment amount must be a positive number'),
  body('method')
    .optional({ values: 'falsy' })
    .isIn(['cash', 'upi', 'card', 'bank_transfer'])
    .withMessage('Invalid payment method'),
];

const validateGetRentals = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn([
    'pending',
    'confirmed',
    'ongoing',
    'completed',
    'cancelled',
  ]),
];

const validateRentalId = [param('id').custom(isObjectId).withMessage('Invalid rental id')];

module.exports = {
  validateCreateRental,
  validateUpdateRentalStatus,
  validateRentalPayment,
  validateGetRentals,
  validateRentalId,
};
