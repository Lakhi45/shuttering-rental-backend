const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item is required'],
    },
    custom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Custom',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    days: {
      type: Number,
    },
    dailyRent: {
      type: Number,
      required: [true, 'Daily rent is required'],
      min: [0, 'Daily rent cannot be negative'],
    },
    totalRent: {
      type: Number,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'],
      default: 'pending',
    },
    returnDate: {
      type: Date,
      default: null,
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank_transfer'],
      default: 'cash',
    },
    amountPaid: {
      type: Number,
      min: [0, 'Amount paid cannot be negative'],
      default: 0,
    },
    rentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes must be under 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// Compute days / totals and validate dates before saving
rentalSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate) {
    if (this.endDate < this.startDate) {
      return next(new Error('End date must be after start date'));
    }
    const msPerDay = 24 * 60 * 60 * 1000;
    this.days = Math.ceil((this.endDate - this.startDate) / msPerDay) || 1;
    this.totalRent = this.days * (this.dailyRent || 0) * (this.quantity || 1);
  }
  next();
});

rentalSchema.index({ rentedBy: 1, createdAt: -1 });
rentalSchema.index({ item: 1, status: 1 });

module.exports = mongoose.model('Rental', rentalSchema);
