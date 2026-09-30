const Custom = require('../models/Custom');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @route   POST /api/customs
 * @desc    Add a custom requirement/order
 * @access  Private
 */
const createCustom = async (req, res, next) => {
  try {
    const custom = await Custom.create({
      ...req.body,
      requestedBy: req.user._id,
    });

    return sendSuccess(res, 201, 'Custom requirement added successfully', { custom });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return next(new ApiError(400, 'Validation failed', errors));
    }
    next(error);
  }
};

/**
 * @route   GET /api/customs
 * @desc    List customs — user's own requests; admins see all
 * @access  Private
 */
const getCustoms = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.user.role !== 'admin') {
      filter.requestedBy = req.user._id;
    } else if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.city) {
      filter['siteLocation.city'] = { $regex: `^${req.query.city}$`, $options: 'i' };
    }

    const [customs, total] = await Promise.all([
      Custom.find(filter)
        .populate('itemsNeeded.item', 'name unit dailyRent')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Custom.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Customs fetched successfully', {
      customs,
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
 * @route   GET /api/customs/:id
 * @desc    Get a single custom requirement
 * @access  Private
 */
const getCustomById = async (req, res, next) => {
  try {
    const custom = await Custom.findById(req.params.id).populate(
      'itemsNeeded.item',
      'name unit dailyRent'
    );
    if (!custom) throw new ApiError(404, 'Custom requirement not found');

    if (
      req.user.role !== 'admin' &&
      custom.requestedBy.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(403, 'Not authorized to access this custom requirement');
    }

    return sendSuccess(res, 200, 'Custom requirement fetched successfully', { custom });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/customs/:id
 * @desc    Update a custom requirement (only while open)
 * @access  Private (owner/admin)
 */
const updateCustom = async (req, res, next) => {
  try {
    let custom = await Custom.findById(req.params.id);
    if (!custom) throw new ApiError(404, 'Custom requirement not found');

    if (
      req.user.role !== 'admin' &&
      custom.requestedBy.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(403, 'Not authorized to modify this custom requirement');
    }

    delete req.body.requestedBy;

    custom = await Custom.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, 200, 'Custom requirement updated successfully', { custom });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return next(new ApiError(400, 'Validation failed', errors));
    }
    next(error);
  }
};

/**
 * @route   DELETE /api/customs/:id
 * @desc    Cancel a custom requirement
 * @access  Private (owner/admin)
 */
const cancelCustom = async (req, res, next) => {
  try {
    const custom = await Custom.findById(req.params.id);
    if (!custom) throw new ApiError(404, 'Custom requirement not found');

    if (
      req.user.role !== 'admin' &&
      custom.requestedBy.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(403, 'Not authorized to cancel this custom requirement');
    }

    custom.status = 'cancelled';
    await custom.save({ validateBeforeSave: false });

    return sendSuccess(res, 200, 'Custom requirement cancelled successfully', { custom });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustom,
  getCustoms,
  getCustomById,
  updateCustom,
  cancelCustom,
};
