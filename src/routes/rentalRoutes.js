const express = require('express');
const {
  createRental,
  getRentals,
  getRentalById,
  updateRentalStatus,
  recordRentalPayment,
} = require('../controllers/rentalController');
const {
  validateCreateRental,
  validateUpdateRentalStatus,
  validateRentalPayment,
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

router.post(
  '/:id/payment',
  validateRentalPayment,
  handleValidationErrors,
  recordRentalPayment
);

module.exports = router;
