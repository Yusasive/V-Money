const express = require("express");
const { cloudinary, upload } = require("../config/cloudinary");
const { authenticateToken, requireRoles } = require("../middleware/auth");

const router = express.Router();

// Upload single file
router.post(
  "/single",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      res.json({
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
      });
    } catch (error) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

// Upload multiple files
router.post(
  "/multiple",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  upload.array("files", 10),
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const files = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
        originalName: file.originalname,
      }));

      res.json({ files });
    } catch (error) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

// List images from Cloudinary (basic browser)
router.get(
  "/list",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { nextCursor } = req.query;
      const result = await cloudinary.search
        .expression("folder:vmonie")
        .max_results(50)
        .next_cursor(nextCursor || undefined)
        .execute();

      const files = (result.resources || []).map((r) => ({
        url: r.secure_url,
        publicId: r.public_id,
        format: r.format,
        bytes: r.bytes,
        width: r.width,
        height: r.height,
        createdAt: r.created_at,
      }));

      res.json({ files, nextCursor: result.next_cursor || null });
    } catch (error) {
      res.status(500).json({ message: "Failed to list files" });
    }
  }
);

module.exports = router;
