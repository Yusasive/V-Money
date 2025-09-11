const mongoose = require("mongoose");

const taskSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedTo: {
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
      enum: ["pending", "in_progress", "done", "completed", "rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Activity history: records status changes and comments with actor and timestamp
    history: [
      {
        type: {
          type: String,
          enum: ["created", "marked_done", "approved", "rejected", "updated", "deleted"],
          required: true,
        },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: { type: String, trim: true },
        at: { type: Date, default: Date.now },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        filename: String,
        originalName: String,
        cloudinaryUrl: String,
        publicId: String,
      },
    ],
    // Soft-delete fields
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);
