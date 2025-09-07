const mongoose = require('mongoose');

const merchantTransactionSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  transactionDate: {
    type: Date,
    required: true
  },
  transactionCount: {
    type: Number,
    required: true,
    min: 0
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate entries for same merchant on same date
merchantTransactionSchema.index({ merchantId: 1, transactionDate: 1 }, { unique: true });

// Index for performance
merchantTransactionSchema.index({ transactionDate: 1 });
merchantTransactionSchema.index({ merchantId: 1, transactionDate: -1 });

module.exports = mongoose.model('MerchantTransaction', merchantTransactionSchema);