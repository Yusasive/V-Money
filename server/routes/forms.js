const express = require("express");
const FormSubmission = require("../models/FormSubmission");
const { authenticateToken, requireRoles } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const { sendStatusEmail } = require("../config/email");
const User = require("../models/User");

const router = express.Router();

// Consolidated: Get current user's latest onboarding (or any) submission
router.get("/mine/latest", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    let submission = null;
    if (userId) {
      submission = await FormSubmission.findOne({ userId })
        .sort({ createdAt: -1 })
        .populate("reviewedBy", "fullName email");
    }
    // Fallback by email & onboarding type if none tied by userId
    if (!submission && userEmail) {
      submission = await FormSubmission.findOne({
        formType: "onboarding",
        "data.email": userEmail,
      })
        .sort({ createdAt: -1 })
        .populate("reviewedBy", "fullName email");
    }

    if (!submission) {
      return res.status(404).json({ message: "No submission found" });
    }

    res.json({ submission });
  } catch (error) {
    console.error("Get my latest submission error:", error);
    res.status(500).json({ message: "Failed to fetch submission" });
  }
});

// Submit form (public endpoint)
router.post("/submit", upload.array("files", 10), async (req, res) => {
  try {
    const { formType, ...formData } = req.body;

    const files = req.files
      ? req.files.map((file) => ({
          fieldName: file.fieldname,
          originalName: file.originalname,
          cloudinaryUrl: file.path,
          publicId: file.filename,
        }))
      : [];

    const submission = new FormSubmission({
      formType,
      data: formData,
      files,
      status: "pending",
      userId: req.user?.id, // Add userId if user is authenticated
    });

    await submission.save();

    res.status(201).json({
      message: "Form submitted successfully",
      id: submission._id,
    });
  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ message: "Failed to submit form" });
  }
});

// Get all form submissions (Admin/Staff)
router.get(
  "/",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, formType, status } = req.query;

      const query = {};
      if (formType) query.formType = formType;
      if (status) query.status = status;

      const submissions = await FormSubmission.find(query)
        .populate("reviewedBy", "fullName email")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await FormSubmission.countDocuments(query);

      res.json({
        submissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Get submissions error:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  }
);

// Get single form submission
router.get(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const submission = await FormSubmission.findById(id).populate(
        "reviewedBy",
        "fullName email"
      );

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      res.json(submission);
    } catch (error) {
      console.error("Get submission error:", error);
      res.status(500).json({ message: "Failed to fetch submission" });
    }
  }
);

// Update form submission status
router.patch(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, data, formType } = req.body;

      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (data !== undefined) updateData.data = data;
      if (formType !== undefined) updateData.formType = formType;

      updateData.reviewedBy = req.user._id;
      updateData.reviewedAt = new Date();

      const submission = await FormSubmission.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate("reviewedBy", "fullName email");

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      // Send email notification
      const rawEmail = submission.data?.email?.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let emailResult = { sent: false, reason: "no_email" };

      if (rawEmail && emailRegex.test(rawEmail) && status) {
        try {
          await sendStatusEmail({
            to: rawEmail,
            status,
            notes,
            formType: submission.formType,
            name: submission.data?.firstName || submission.data?.fullName,
          });

          submission.emailSent = true;
          submission.emailSentAt = new Date();
          await submission.save();

          emailResult = { sent: true, reason: "ok" };
        } catch (mailErr) {
          console.error("Email send failed:", mailErr);
          emailResult = { sent: false, reason: "send_failed" };
        }
      }

      // If approved onboarding, persist onboardingData to user record
      if (
        submission &&
        submission.formType === "onboarding" &&
        submission.status === "approved"
      ) {
        try {
          // Prefer linking by userId if stored; fallback to email inside form data
          const userQuery = submission.userId
            ? { _id: submission.userId }
            : submission.data?.email
              ? { email: submission.data.email }
              : null;

          if (userQuery) {
            await User.findOneAndUpdate(
              userQuery,
              {
                onboardingData: submission.data,
                status: "approved", // ensure status reflects approval
              },
              { new: true }
            );
          }
        } catch (syncErr) {
          console.error("Failed to sync onboarding data to user:", syncErr);
        }
      }

      res.json({ submission, email: emailResult });
    } catch (error) {
      console.error("Update submission error:", error);
      res.status(500).json({ message: "Failed to update submission" });
    }
  }
);

// Delete form submission
router.delete(
  "/:id",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const submission = await FormSubmission.findByIdAndDelete(id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      res.json({ message: "Submission deleted successfully" });
    } catch (error) {
      console.error("Delete submission error:", error);
      res.status(500).json({ message: "Failed to delete submission" });
    }
  }
);

module.exports = router;
