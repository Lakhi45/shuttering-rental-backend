const mongoose = require('mongoose');
const Item = require('../models/Item');
const Rental = require('../models/Rental');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @route   POST /api/rentals
 * @desc    Create a rental booking for an item
 * @access  Private
 */
const createRental = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { item: itemId, quantity, startDate, endDate, custom, notes } = req.body;

    const item = await Item.findById(itemId);
    if (!item) throw new ApiError(404, 'Item not found');
    if (!item.isActive) throw new ApiError(400, 'This item is not available for rent');

    const available = item.availableQuantity || 0;
    if (quantity > available) {
      throw new ApiError(
        400,
        `Only ${available} ${item.unit || 'units'} available, requested ${quantity}`
      );
    }

    let result;

    await session.withTransaction(async () => {
      // Reserve stock atomically
      const updated = await Item.findOneAndUpdate(
        { _id: itemId, availableQuantity: { $gte: quantity } },
        { $inc: { availableQuantity: -quantity } },
        { new: true, session }
      );
      if (!updated) {
        throw new ApiError(409, 'Item quantity changed concurrently. Please retry.');
      }

      const [rental] = await Rental.create(
        [
          {
            item: itemId,
            custom: custom || undefined,
            quantity,
            startDate,
            endDate,
            dailyRent: updated.dailyRent,
            securityDeposit: updated.securityDeposit,
            owner: updated.createdBy,
            rentedBy: req.user._id,
            notes: notes || '',
          },
        ],
        { session }
      );

      result = rental;
    });

    await result.populate('item', 'name unit images category');

    return sendSuccess(res, 201, 'Rental booked successfully', { rental: result });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return next(new ApiError(400, 'Validation failed', errors));
    }
    // MongoDB transactions require a replica set — fall back gracefully in dev
    if (/Transaction numbers|replica set/i.test(error.message)) {
      return next(
        new ApiError(500, 'Rental creation requires a transaction-capable MongoDB deployment')
      );
    }
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * @route   GET /api/rentals
 * @desc    List rentals for the logged-in user (as renter or owner)
 * @access  Private
 */
const getRentals = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.user.role !== 'admin') {
      filter.$or = [{ rentedBy: req.user._id }, { owner: req.user._id }];
    }
    if (req.query.status) filter.status = req.query.status;

    const [rentals, total] = await Promise.all([
      Rental.find(filter)
        .populate('item', 'name unit images category')
        .populate('rentedBy', 'name phone')
        .populate('owner', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Rental.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Rentals fetched successfully', {
      rentals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rentals/:id
 * @desc    Get a single rental
 * @access  Private
 */
const getRentalById = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('item')
      .populate('rentedBy', 'name phone')
      .populate('owner', 'name phone');

    if (!rental) throw new ApiError(404, 'Rental not found');

    const isParty =
      rental.rentedBy?._id?.toString() === req.user._id.toString() ||
      rental.owner?._id?.toString() === req.user._id.toString();
    if (!isParty && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to access this rental');
    }

    return sendSuccess(res, 200, 'Rental fetched successfully', { rental });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/rentals/:id/status
 * @desc    Update rental status (confirm/ongoing/completed/cancelled).
 *          Cancelling or completing returns stock to the item.
 * @access  Private (owner/admin)
 */
const updateRentalStatus = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) throw new ApiError(404, 'Rental not found');

    if (
      req.user.role !== 'admin' &&
      rental.owner?.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(403, 'Only the item owner can change the rental status');
    }

    const { status, returnDate, actualReturnDate } = req.body;
    const previousStatus = rental.status;
    rental.status = status;
    if (returnDate) rental.returnDate = returnDate;
    if (status === 'completed' && !rental.actualReturnDate) {
      rental.actualReturnDate = actualReturnDate || new Date();
    }
    await rental.save({ validateBeforeSave: false });

    // Return stock when a live booking ends without having been completed before
    const releasesStock = ['completed', 'cancelled'].includes(status);
    const wasHoldingStock = ['pending', 'confirmed', 'ongoing'].includes(previousStatus);

    if (releasesStock && wasHoldingStock) {
      await Item.findByIdAndUpdate(rental.item, {
        $inc: { availableQuantity: rental.quantity },
      });
    }

    return sendSuccess(res, 200, 'Rental status updated successfully', { rental });
  } catch (error) {
    next(error);
  }
};

// Record a payment against a rental (supports the app's "Final Bill / Payment" screen)
const recordRentalPayment = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) throw new ApiError(404, 'Rental not found');

    if (
      req.user.role !== 'admin' &&
      rental.owner?.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(403, 'Only the item owner can record payments');
    }

    if (rental.paymentStatus === 'paid') {
      throw new ApiError(400, 'This rental is already fully paid');
    }

    const { amount, method } = req.body;
    const payable =
      (rental.totalRent || 0) +
      (rental.securityDeposit || 0) +
      (rental.deliveryCharges || 0);

    if (amount > payable - (rental.amountPaid || 0)) {
      throw new ApiError(
        400,
        `Amount exceeds the outstanding balance of ${payable - (rental.amountPaid || 0)}`
      );
    }

    rental.amountPaid = (rental.amountPaid || 0) + amount;
    rental.paymentMethod = method || rental.paymentMethod;
    rental.paymentStatus = rental.amountPaid >= payable ? 'paid' : 'partial';
    await rental.save({ validateBeforeSave: false });

    return sendSuccess(res, 200, 'Payment recorded successfully', {
      rental,
      balanceDue: Math.max(payable - rental.amountPaid, 0),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRental,
  getRentals,
  getRentalById,
  updateRentalStatus,
  recordRentalPayment,
};
