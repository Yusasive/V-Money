const express = require('express');
const Content = require('../models/Content');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all content
router.get('/', async (req, res) => {
  try {
    const content = await Content.find();
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get content by section
router.get('/:section', async (req, res) => {
  try {
    const content = await Content.findOne({ section: req.params.section });
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update content
router.post('/:section', adminAuth, async (req, res) => {
  try {
    const { section } = req.params;
    const contentData = { section, ...req.body };

    let content = await Content.findOne({ section });
    
    if (content) {
      content = await Content.findOneAndUpdate(
        { section },
        contentData,
        { new: true, runValidators: true }
      );
    } else {
      content = new Content(contentData);
      await content.save();
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete content
router.delete('/:section', adminAuth, async (req, res) => {
  try {
    await Content.findOneAndDelete({ section: req.params.section });
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;