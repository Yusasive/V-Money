const express = require('express');
const Dispute = require('../models/Dispute');
const User = require('../models/User');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

// Create dispute (Staff/Admin)
router.post('/', authenticateToken, requireRoles(['staff', 'admin']), async (req, res) => {
  try {
    const { title, description, raised_against, priority } = req.body;

    if (!title || !description || !raised_against) {
      return res.status(400).json({ 
        message: 'Title, description, and raised_against are required' 
      });
    }

    // Validate target user exists
    const targetUser = await User.findById(raised_against);
    if (!targetUser) {
      return res.status(400).json({ message: 'Target user not found' });
    }

    const dispute = new Dispute({
      title,
      description,
      raisedAgainst: raised_against,
      createdBy: req.user._id,
      priority: priority || 'medium'
    });

    await dispute.save();
    await dispute.populate(['raisedAgainst', 'createdBy'], 'fullName email username');

    res.status(201).json({ 
      message: 'Dispute created successfully',
      dispute 
    });

  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ message: 'Failed to create dispute' });
  }
});

// List disputes (filtered by role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      priority,
      page = 1, 
      limit = 20 
    } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.role === 'aggregator') {
      // Aggregators only see disputes raised against them
      query.raisedAgainst = req.user._id;
    } else if (['staff', 'admin'].includes(req.user.role)) {
      // Staff and Admin see all disputes
      if (status) query.status = status;
      if (priority) query.priority = priority;
    }

    const disputes = await Dispute.find(query)
      .populate('raisedAgainst', 'fullName email username')
      .populate('createdBy', 'fullName email username')
      .populate('resolvedBy', 'fullName email username')
      .populate('responses.respondedBy', 'fullName email username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Dispute.countDocuments(query);

    res.json({
      disputes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('List disputes error:', error);
    res.status(500).json({ message: 'Failed to fetch disputes' });
  }
});

// Respond to dispute (target user only)
router.post('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ message: 'Response is required' });
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Only the person the dispute is raised against can respond
    if (dispute.raisedAgainst.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only respond to disputes raised against you' });
    }

    if (dispute.status === 'resolved') {
      return res.status(400).json({ message: 'Cannot respond to resolved dispute' });
    }

    // Add response
    dispute.responses.push({
      respondedBy: req.user._id,
      response: response.trim()
    });

    // Update status to in_review if it was open
    if (dispute.status === 'open') {
      dispute.status = 'in_review';
    }

    await dispute.save();
    await dispute.populate(['raisedAgainst', 'createdBy', 'responses.respondedBy'], 'fullName email username');

    res.json({ 
      message: 'Response submitted successfully',
      dispute 
    });

  } catch (error) {
    console.error('Respond to dispute error:', error);
    res.status(500).json({ message: 'Failed to submit response' });
  }
});

// Update dispute status (Staff/Admin)
router.patch('/:id', authenticateToken, requireRoles(['staff', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const updates = {};
    if (status) {
      if (!['open', 'in_review', 'resolved', 'escalated'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      updates.status = status;
      
      if (status === 'resolved') {
        updates.resolvedAt = new Date();
        updates.resolvedBy = req.user._id;
      }
      
      if (status === 'escalated') {
        updates.escalatedAt = new Date();
        updates.escalatedBy = req.user._id;
      }
    }

    if (priority) {
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority' });
      }
      updates.priority = priority;
    }

    const dispute = await Dispute.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate(['raisedAgainst', 'createdBy', 'resolvedBy'], 'fullName email username');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    res.json({ 
      message: 'Dispute updated successfully',
      dispute 
    });

  } catch (error) {
    console.error('Update dispute error:', error);
    res.status(500).json({ message: 'Failed to update dispute' });
  }
});

// Close dispute (Staff/Admin)
router.patch('/:id/close', authenticateToken, requireRoles(['staff', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const dispute = await Dispute.findByIdAndUpdate(
      id,
      { 
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: req.user._id
      },
      { new: true }
    ).populate(['raisedAgainst', 'createdBy', 'resolvedBy'], 'fullName email username');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    res.json({ 
      message: 'Dispute closed successfully',
      dispute 
    });

  } catch (error) {
    console.error('Close dispute error:', error);
    res.status(500).json({ message: 'Failed to close dispute' });
  }
});

// Delete dispute (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const dispute = await Dispute.findByIdAndDelete(id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    res.json({ message: 'Dispute deleted successfully' });

  } catch (error) {
    console.error('Delete dispute error:', error);
    res.status(500).json({ message: 'Failed to delete dispute' });
  }
});

module.exports = router;