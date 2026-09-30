const express = require('express');
const {
  createRental,
  getRentals,
  getRentalById,
  updateRentalStatus,
} = require('../controllers/rentalController');
const {
  validateCreateRental,
  validateUpdateRentalStatus,
  validateGetRentals,
  validateRentalId,
} = require('../validators/rentalValidators');
const { handleValidationErrors } = require('../validators/authValidators');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All rental routes require authentication
router.use(protect);

router
  .route('/')
  .post(validateCreateRental, handleValidationErrors, createRental)
  .get(validateGetRentals, handleValidationErrors, getRentals);

router.get('/:id', validateRentalId, handleValidationErrors, getRentalById);

router.patch(
  '/:id/status',
  validateUpdateRentalStatus,
  handleValidationErrors,
  updateRentalStatus
);

module.exports = router;
