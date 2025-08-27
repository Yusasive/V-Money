const express = require("express");
const multer = require("multer");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryResources,
} = require("../utils/cloudinary");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xlsx|xls/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, PDFs, and documents are allowed."
        )
      );
    }
  },
});

// Upload single file (Admin only)
router.post(
  "/single",
  authenticateToken,
  requireAdmin,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname
      );

      res.json({
        message: "File uploaded successfully",
        file: result,
      });
    } catch (error) {
      console.error("Single file upload error:", error);
      res.status(500).json({
        message: error.message || "File upload failed",
      });
    }
  }
);

// Upload multiple files (Admin only)
router.post(
  "/multiple",
  authenticateToken,
  requireAdmin,
  upload.array("files", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, file.originalname)
      );

      const results = await Promise.all(uploadPromises);

      res.json({
        message: "Files uploaded successfully",
        files: results,
      });
    } catch (error) {
      console.error("Multiple file upload error:", error);
      res.status(500).json({
        message: error.message || "File upload failed",
      });
    }
  }
);

// Get uploaded files list (Admin only)
router.get("/list", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nextCursor } = req.query;

    const result = await getCloudinaryResources(nextCursor);

    res.json({
      resources: result.resources,
      nextCursor: result.next_cursor,
      totalCount: result.total_count,
    });
  } catch (error) {
    console.error("Get files list error:", error);
    res.status(500).json({ message: "Failed to fetch files" });
  }
});

// Delete file (Admin only)
router.delete(
  "/:publicId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { publicId } = req.params;

      // Decode the public ID (it might be URL encoded)
      const decodedPublicId = decodeURIComponent(publicId);

      const result = await deleteFromCloudinary(decodedPublicId);

      if (result.result === "ok") {
        res.json({ message: "File deleted successfully" });
      } else {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  }
);

module.exports = router;
