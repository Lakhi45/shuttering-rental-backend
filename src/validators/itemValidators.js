const mongoose = require('mongoose');
const { body, param, query } = require('express-validator');

const isObjectId = (value) => mongoose.isValidObjectId(value);

const validateCreateItem = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ max: 100 })
    .withMessage('Item name must be under 100 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('category').optional({ values: 'falsy' }).isIn(['plywood', 'beam', 'column', 'slab', 'general']).withMessage('Invalid category'),
  body('unit')
    .optional()
    .isIn(['pcs', 'sqft', 'running_m', 'set', 'bundle'])
    .withMessage('Unit must be one of: pcs, sqft, running_m, set, bundle'),
  body('totalQuantity')
    .isFloat({ min: 0 })
    .withMessage('Total quantity must be a non-negative number'),
  body('availableQuantity')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Available quantity must be a non-negative number'),
  body('dailyRent')
    .isFloat({ min: 0 })
    .withMessage('Daily rent must be a non-negative number'),
  body('securityDeposit')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Security deposit must be a non-negative number'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().isString().trim(),
];

const validateUpdateItem = [
  param('id').custom(isObjectId).withMessage('Invalid item id'),
  body('name').optional({ values: 'falsy' }).trim().isLength({ min: 1, max: 100 }),
  body('unit').optional().isIn(['pcs', 'sqft', 'running_m', 'set', 'bundle']),
  body('totalQuantity').optional().isFloat({ min: 0 }),
  body('availableQuantity').optional().isFloat({ min: 0 }),
  body('dailyRent').optional().isFloat({ min: 0 }),
  body('securityDeposit').optional().isFloat({ min: 0 }),
  body('isActive').optional().isBoolean().toBoolean(),
];

const validateGetItems = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('category').optional().isIn(['plywood', 'beam', 'column', 'slab', 'general']),
  query('search').optional().trim(),
];

const validateItemId = [param('id').custom(isObjectId).withMessage('Invalid item id')];

module.exports = {
  validateCreateItem,
  validateUpdateItem,
  validateGetItems,
  validateItemId,
};
