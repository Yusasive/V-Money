const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const Dispute = require('../models/Dispute');
const Merchant = require('../models/Merchant');
const MerchantTransaction = require('../models/MerchantTransaction');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

// Overview analytics (Admin/Staff)
router.get('/overview', authenticateToken, requireRoles(['admin', 'staff']), async (req, res) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      totalTasks,
      completedTasks,
      totalDisputes,
      openDisputes,
      totalMerchants,
      activeMerchants,
      flaggedMerchants
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'pending' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Dispute.countDocuments(),
      Dispute.countDocuments({ status: 'open' }),
      Merchant.countDocuments(),
      Merchant.countDocuments({ status: 'active' }),
      Merchant.countDocuments({ status: 'flagged' })
    ]);

    res.json({
      users: {
        total: totalUsers,
        pending: pendingUsers,
        approved: totalUsers - pendingUsers
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks
      },
      disputes: {
        total: totalDisputes,
        open: openDisputes,
        resolved: totalDisputes - openDisputes
      },
      merchants: {
        total: totalMerchants,
        active: activeMerchants,
        flagged: flaggedMerchants
      }
    });

  } catch (error) {
    console.error('Overview analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// User statistics (Admin only)
router.get('/users', authenticateToken, requireRoles(['admin']), async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          suspended: {
            $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
          }
        }
      }
    ]);

    // Registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const registrationTrends = await User.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      roleDistribution: userStats,
      registrationTrends
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch user analytics' });
  }
});

// Task statistics (Admin/Staff)
router.get('/tasks', authenticateToken, requireRoles(['admin', 'staff']), async (req, res) => {
  try {
    const taskStats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgCompletionTime: {
            $avg: {
              $cond: [
                { $ne: ['$completedAt', null] },
                { $subtract: ['$completedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    // Task completion trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completionTrends = await Task.aggregate([
      {
        $match: { 
          completedAt: { $gte: thirtyDaysAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      statusDistribution: taskStats,
      completionTrends
    });

  } catch (error) {
    console.error('Task analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch task analytics' });
  }
});

// Merchant statistics (Admin/Staff)
router.get('/merchants', authenticateToken, requireRoles(['admin', 'staff']), async (req, res) => {
  try {
    const merchantStats = await Merchant.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Transaction volume trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactionTrends = await MerchantTransaction.aggregate([
      {
        $match: { transactionDate: { $gte: thirtyDaysAgo } }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' } }
          },
          totalTransactions: { $sum: '$transactionCount' },
          merchantCount: { $addToSet: '$merchantId' }
        }
      },
      {
        $addFields: {
          activeMerchants: { $size: '$merchantCount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      statusDistribution: merchantStats,
      transactionTrends
    });

  } catch (error) {
    console.error('Merchant analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch merchant analytics' });
  }
});

module.exports = router;