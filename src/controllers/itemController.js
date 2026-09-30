const Item = require('../models/Item');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @route   POST /api/items
 * @desc    Add a new rental item (owner's inventory)
 * @access  Private
 */
const createItem = async (req, res, next) => {
  try {
    const item = await Item.create({
      ...req.body,
      createdBy: req.user._id,
    });

    return sendSuccess(res, 201, 'Item added successfully', { item });
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
 * @route   GET /api/items
 * @desc    List items (own items for owner; all active items publicly searchable)
 * @access  Private
 */
const getItems = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    // Owners see their own inventory; admins see everything.
    if (req.user.role !== 'admin') {
      filter.createdBy = req.user._id;
    }

    if (req.query.category) filter.category = req.query.category;
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Item.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Items fetched successfully', {
      items,
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
 * @route   GET /api/items/:id
 * @desc    Get a single item
 * @access  Private
 */
const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) throw new ApiError(404, 'Item not found');

    // Only owner (or admin) can view their item details
    if (req.user.role !== 'admin' && item.createdBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Not authorized to access this item');
    }

    return sendSuccess(res, 200, 'Item fetched successfully', { item });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/items/:id
 * @desc    Update an item
 * @access  Private (owner/admin)
 */
const updateItem = async (req, res, next) => {
  try {
    let item = await Item.findById(req.params.id);
    if (!item) throw new ApiError(404, 'Item not found');

    if (req.user.role !== 'admin' && item.createdBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Not authorized to modify this item');
    }

    // Prevent changing ownership fields
    delete req.body.createdBy;

    item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, 200, 'Item updated successfully', { item });
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
 * @route   DELETE /api/items/:id
 * @desc    Soft-delete / deactivate an item
 * @access  Private (owner/admin)
 */
const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) throw new ApiError(404, 'Item not found');

    if (req.user.role !== 'admin' && item.createdBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Not authorized to delete this item');
    }

    item.isActive = false;
    await item.save({ validateBeforeSave: false });

    return sendSuccess(res, 200, 'Item deactivated successfully', { item });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
};
