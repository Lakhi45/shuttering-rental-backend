const express = require('express');
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');
const {
  validateCreateItem,
  validateUpdateItem,
  validateGetItems,
  validateItemId,
} = require('../validators/itemValidators');
const { handleValidationErrors } = require('../validators/authValidators');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All item routes require authentication
router.use(protect);

router.route('/').post(validateCreateItem, handleValidationErrors, createItem).get(
  validateGetItems,
  handleValidationErrors,
  getItems
);

router
  .route('/:id')
  .get(validateItemId, handleValidationErrors, getItemById)
  .put(validateUpdateItem, handleValidationErrors, updateItem)
  .delete(validateItemId, handleValidationErrors, deleteItem);

module.exports = router;
