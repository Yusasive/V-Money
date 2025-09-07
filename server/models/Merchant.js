const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  businessAddress: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'flagged', 'suspended'],
    default: 'active'
  },
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  lga: {
    type: String,
    required: true,
    trim: true
  },
  bvn: {
    type: String,
    required: true,
    length: 11
  },
  nin: {
    type: String,
    required: true,
    length: 11
  },
  serialNo: {
    type: String,
    trim: true
  },
  // Document URLs
  utilityBillUrl: {
    type: String,
    trim: true
  },
  passportUrl: {
    type: String,
    trim: true
  },
  businessPicUrl: {
    type: String,
    trim: true
  },
  ninSlipUrl: {
    type: String,
    trim: true
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  flaggedAt: {
    type: Date,
    default: null
  },
  flaggedReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
merchantSchema.index({ userId: 1 });
merchantSchema.index({ username: 1 });
merchantSchema.index({ email: 1 });
merchantSchema.index({ status: 1 });
merchantSchema.index({ lastActivityDate: 1 });

module.exports = mongoose.model('Merchant', merchantSchema);