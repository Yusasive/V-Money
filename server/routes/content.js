const express = require('express');
const Content = require('../models/Content');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

// Get all content
router.get('/', async (req, res) => {
  try {
    const content = await Content.find({ isActive: true }).sort({ section: 1 });
    res.json(content);
  } catch (error) {
    console.error('GET /api/content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get content by section
router.get('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const content = await Content.findOne({ section, isActive: true });
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    res.json(content);
  } catch (error) {
    console.error('GET /api/content/:section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update content
router.post('/:section', authenticateToken, requireRoles(['admin', 'staff']), async (req, res) => {
  try {
    const { section } = req.params;
    const contentData = { section, ...req.body };
    
    // Upsert: update if exists, create if not
    const content = await Content.findOneAndUpdate(
      { section },
      contentData,
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json(content);
  } catch (error) {
    console.error('POST /api/content/:section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete content
router.delete('/:section', authenticateToken, requireRoles(['admin']), async (req, res) => {
  try {
    const { section } = req.params;
    
    const content = await Content.findOneAndDelete({ section });
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/content/:section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;