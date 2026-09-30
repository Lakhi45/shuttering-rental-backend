const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name must be under 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be under 500 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: ['plywood', 'beam', 'column', 'slab', 'general'],
      default: 'general',
    },
    unit: {
      type: String,
      enum: ['pcs', 'sqft', 'running_m', 'set', 'bundle'],
      default: 'pcs',
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Total quantity cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      min: [0, 'Available quantity cannot be negative'],
    },
    dailyRent: {
      type: Number,
      required: [true, 'Daily rent is required'],
      min: [0, 'Daily rent cannot be negative'],
    },
    securityDeposit: {
      type: Number,
      min: [0, 'Security deposit cannot be negative'],
      default: 0,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Keep availableQuantity in sync on create (default to totalQuantity)
itemSchema.pre('validate', function (next) {
  if (this.availableQuantity === undefined || this.availableQuantity === null) {
    this.availableQuantity = this.totalQuantity;
  }
  next();
});

module.exports = mongoose.model('Item', itemSchema);
