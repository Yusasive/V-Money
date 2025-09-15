const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema(
  {
    // Minimal merchant: only username required
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Optional metadata (kept for future expansion)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      unique: false,
    },
    businessName: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive", "flagged", "suspended"],
      default: "active",
    },
    // Personal Information (optional)
    firstName: { type: String, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    state: { type: String, trim: true },
    lga: { type: String, trim: true },
    bvn: { type: String, length: 11 },
    nin: { type: String, length: 11 },
    serialNo: { type: String, trim: true },
    // Document URLs (optional)
    utilityBillUrl: { type: String, trim: true },
    passportUrl: { type: String, trim: true },
    businessPicUrl: { type: String, trim: true },
    ninSlipUrl: { type: String, trim: true },
    lastActivityDate: { type: Date, default: Date.now },
    flaggedAt: { type: Date, default: null },
    flaggedReason: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
merchantSchema.index({ userId: 1 });
merchantSchema.index({ username: 1 });
merchantSchema.index({ email: 1 });
merchantSchema.index({ status: 1 });
merchantSchema.index({ lastActivityDate: 1 });

module.exports = mongoose.model("Merchant", merchantSchema);
