const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

// Create task (Staff/Admin)
router.post('/', authenticateToken, requireRoles(['staff', 'admin']), async (req, res) => {
  try {
    const { title, description, assigned_to, due_date, priority } = req.body;

    if (!title || !assigned_to) {
      return res.status(400).json({ message: 'Title and assigned_to are required' });
    }

    // Validate assignee exists and has appropriate role
    const assignee = await User.findById(assigned_to);
    if (!assignee) {
      return res.status(400).json({ message: 'Assigned user not found' });
    }

    if (!['staff', 'aggregator'].includes(assignee.role)) {
      return res.status(400).json({ 
        message: 'Tasks can only be assigned to Staff or Aggregators' 
      });
    }

    const task = new Task({
      title,
      description: description || null,
      assignedTo: assigned_to,
      createdBy: req.user._id,
      dueDate: due_date ? new Date(due_date) : null,
      priority: priority || 'medium'
    });

    await task.save();
    await task.populate(['assignedTo', 'createdBy'], 'fullName email username');

    res.status(201).json({ 
      message: 'Task created successfully',
      task 
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// List tasks (Staff/Admin with filters)
router.get('/', authenticateToken, requireRoles(['staff', 'admin']), async (req, res) => {
  try {
    const { 
      assigned_to, 
      status, 
      priority,
      page = 1, 
      limit = 20 
    } = req.query;

    const query = {};
    if (assigned_to) query.assignedTo = assigned_to;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'fullName email username')
      .populate('createdBy', 'fullName email username')
      .populate('approvedBy', 'fullName email username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('List tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Get tasks assigned to current user
router.get('/assigned', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('createdBy', 'fullName email username')
      .populate('approvedBy', 'fullName email username')
      .sort({ createdAt: -1 });

    res.json({ tasks });

  } catch (error) {
    console.error('Assigned tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch assigned tasks' });
  }
});

// Mark task as done (assignee only)
router.patch('/:id/done', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only assignee can mark as done
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the assignee can mark this task as done' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ message: 'Task is already completed' });
    }

    task.status = 'done';
    task.completedAt = new Date();
    await task.save();

    await task.populate(['assignedTo', 'createdBy'], 'fullName email username');

    res.json({ 
      message: 'Task marked as done. Waiting for approval.',
      task 
    });

  } catch (error) {
    console.error('Mark task done error:', error);
    res.status(500).json({ message: 'Failed to mark task as done' });
  }
});

// Approve task (Staff/Admin or task creator)
router.patch('/:id/approve', authenticateToken, requireRoles(['staff', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'done') {
      return res.status(400).json({ message: 'Task must be marked as done before approval' });
    }

    task.status = 'completed';
    task.approvedBy = req.user._id;
    task.approvedAt = new Date();
    await task.save();

    await task.populate(['assignedTo', 'createdBy', 'approvedBy'], 'fullName email username');

    res.json({ 
      message: 'Task approved successfully',
      task 
    });

  } catch (error) {
    console.error('Approve task error:', error);
    res.status(500).json({ message: 'Failed to approve task' });
  }
});

// Reject task (Staff/Admin or task creator)
router.patch('/:id/reject', authenticateToken, requireRoles(['staff', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = 'rejected';
    task.notes = reason || 'Task rejected';
    task.completedAt = null; // Reset completion time
    await task.save();

    await task.populate(['assignedTo', 'createdBy'], 'fullName email username');

    res.json({ 
      message: 'Task rejected',
      task 
    });

  } catch (error) {
    console.error('Reject task error:', error);
    res.status(500).json({ message: 'Failed to reject task' });
  }
});

// Delete task (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

module.exports = router;