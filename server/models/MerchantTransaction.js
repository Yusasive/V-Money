const mongoose = require("mongoose");

function toUTCStartOfDay(input) {
  if (!input) return input;
  const d = new Date(input);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

const merchantTransactionSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    transactionDate: {
      type: Date,
      required: true,
    },
    transactionCount: {
      type: Number,
      required: true,
      min: 0,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate entries for same merchant on same date
merchantTransactionSchema.index(
  { merchantId: 1, transactionDate: 1 },
  { unique: true }
);

// Index for performance
merchantTransactionSchema.index({ transactionDate: 1 });
merchantTransactionSchema.index({ merchantId: 1, transactionDate: -1 });

// Normalize transactionDate to UTC start-of-day on save
merchantTransactionSchema.pre("save", function (next) {
  if (this.transactionDate) {
    this.transactionDate = toUTCStartOfDay(this.transactionDate);
  }
  next();
});

// Normalize transactionDate on findOneAndUpdate
merchantTransactionSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  // Support $set wrapper or direct assignment
  if (update.$set && update.$set.transactionDate) {
    update.$set.transactionDate = toUTCStartOfDay(update.$set.transactionDate);
  } else if (update.transactionDate) {
    update.transactionDate = toUTCStartOfDay(update.transactionDate);
  }
  this.setUpdate(update);
  next();
});

module.exports = mongoose.model(
  "MerchantTransaction",
  merchantTransactionSchema
);
