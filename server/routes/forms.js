const express = require('express');
const FormSubmission = require('../models/FormSubmission');
const { adminAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Submit form (public endpoint)
router.post('/submit', upload.array('files', 10), async (req, res) => {
  try {
    const { formType, ...formData } = req.body;
    
    const files = req.files ? req.files.map(file => ({
      fieldName: file.fieldname,
      originalName: file.originalname,
      cloudinaryUrl: file.path,
      publicId: file.filename
    })) : [];

    const submission = new FormSubmission({
      formType,
      data: formData,
      files
    });

    await submission.save();
    res.status(201).json({ message: 'Form submitted successfully', id: submission._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all form submissions (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, formType, status } = req.query;
    const query = {};
    
    if (formType) query.formType = formType;
    if (status) query.status = status;

    const submissions = await FormSubmission.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FormSubmission.countDocuments(query);

    res.json({
      submissions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single form submission
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const submission = await FormSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update form submission status
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const submission = await FormSubmission.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    );
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete form submission
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await FormSubmission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;