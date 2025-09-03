const express = require("express");
const { supabase } = require("../config/supabase");
const { authenticateToken, requireRoles } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const { sendStatusEmail } = require("../config/email");

const router = express.Router();

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
    const submissionData = {
      formType,
      data: formData,
      files,
      status: "pending",
    };
    const { data, error } = await supabase
      .from("form_submissions")
      .insert([submissionData]);
    if (error) throw error;
    res
      .status(201)
      .json({ message: "Form submitted successfully", id: data[0]?.id });
  } catch (error) {
    console.error("POST /api/forms/submit error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all form submissions (admin only)
router.get(
  "/",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, formType, status } = req.query;
      let query = supabase.from("form_submissions").select("*");
      if (formType) query = query.eq("formType", formType);
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      // Pagination (client-side)
      const total = data.length;
      const paged = data.slice((page - 1) * limit, page * limit);
      res.json({
        submissions: paged,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (error) {
      console.error("GET /api/forms error:", error);
      res.status(500).json({ message: "Server error" });
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
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(data);
    } catch (error) {
      console.error("GET /api/forms/:id error:", error);
      res.status(500).json({ message: "Server error" });
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
      const { status, notes } = req.body;
      const { data, error } = await supabase
        .from("form_submissions")
        .update({ status, notes })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ message: "Submission not found" });
      }
      // Attempt to send an email notification to the submitter
      const rawEmail = (data?.data?.email || "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let emailResult = { sent: false, reason: "no_email" };
      if (rawEmail) {
        if (emailRegex.test(rawEmail)) {
          if (status) {
            try {
              await sendStatusEmail({
                to: rawEmail,
                status,
                notes,
                formType: data.formType,
              });
              emailResult = { sent: true, reason: "ok" };
            } catch (mailErr) {
              console.error("Email send failed:", mailErr);
              emailResult = { sent: false, reason: "send_failed" };
            }
          } else {
            emailResult = { sent: false, reason: "no_status" };
          }
        } else {
          emailResult = { sent: false, reason: "invalid_email" };
        }
      } else {
        emailResult = { sent: false, reason: "no_email" };
      }
      res.json({ submission: data, email: emailResult });
    } catch (error) {
      console.error("PATCH /api/forms/:id error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete form submission
router.delete(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from("form_submissions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      res.json({ message: "Submission deleted successfully" });
    } catch (error) {
      console.error("DELETE /api/forms/:id error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
