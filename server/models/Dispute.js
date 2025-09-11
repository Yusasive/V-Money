const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    raisedAgainst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in_review", "resolved", "escalated"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    responses: [
      {
        respondedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        response: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: { type: Date, default: null },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    escalatedAt: { type: Date, default: null },
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Soft-delete
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Optional history for administrative edits
    history: [
      {
        type: {
          type: String,
          enum: ["created", "updated", "status_changed", "deleted"],
          required: true,
        },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: { type: String, trim: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

disputeSchema.index({ raisedAgainst: 1, status: 1 });
disputeSchema.index({ createdBy: 1 });
disputeSchema.index({ status: 1 });

module.exports = mongoose.model("Dispute", disputeSchema);
