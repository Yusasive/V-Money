const express = require('express');
const { upload } = require('../config/cloudinary');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Upload single file
router.post('/single', adminAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Upload multiple files
router.post('/multiple', adminAuth, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname
    }));

    res.json({ files });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;