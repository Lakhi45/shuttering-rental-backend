const mongoose = require('mongoose');

const customSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Custom requirement title is required'],
      trim: true,
      maxlength: [120, 'Title must be under 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description must be under 1000 characters'],
    },
    siteLocation: {
      address: {
        type: String,
        required: [true, 'Site address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        trim: true,
        default: '',
      },
      pincode: {
        type: String,
        trim: true,
        match: [/^\d{6}$/, 'Enter a valid 6-digit pincode'],
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    itemsNeeded: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
        },
        itemName: { type: String, trim: true },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1'],
        },
      },
    ],
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    durationDays: {
      type: Number,
      required: [true, 'Duration (in days) is required'],
      min: [1, 'Duration must be at least 1 day'],
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
    },
    status: {
      type: String,
      enum: ['open', 'matched', 'fulfilled', 'cancelled'],
      default: 'open',
    },
    contactPhone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number'],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

customSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Custom', customSchema);
