const express = require('express');
const {
  createCustom,
  getCustoms,
  getCustomById,
  updateCustom,
  cancelCustom,
} = require('../controllers/customController');
const {
  validateCreateCustom,
  validateUpdateCustom,
  validateGetCustoms,
  validateCustomId,
} = require('../validators/customValidators');
const { handleValidationErrors } = require('../validators/authValidators');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All custom routes require authentication
router.use(protect);

router
  .route('/')
  .post(validateCreateCustom, handleValidationErrors, createCustom)
  .get(validateGetCustoms, handleValidationErrors, getCustoms);

router
  .route('/:id')
  .get(validateCustomId, handleValidationErrors, getCustomById)
  .put(validateUpdateCustom, handleValidationErrors, updateCustom)
  .delete(validateCustomId, handleValidationErrors, cancelCustom);

module.exports = router;
