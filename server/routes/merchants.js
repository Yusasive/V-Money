const express = require("express");
const mongoose = require("mongoose");
const Merchant = require("../models/Merchant");
const MerchantTransaction = require("../models/MerchantTransaction");
const { authenticateToken, requireRoles } = require("../middleware/auth");

const router = express.Router();

// Create merchant (Staff/Admin) — minimal: only username required
router.post(
  "/",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { username, userId } = req.body;

      if (!username || typeof username !== "string" || !username.trim()) {
        return res.status(400).json({ message: "Username is required" });
      }

      // Ensure username format (letters, numbers, underscores, hyphens)
      const uname = username.trim();
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(uname)) {
        return res.status(400).json({
          message:
            "Username must be 3-30 chars and contain letters, numbers, _ or -",
        });
      }

      // Check if merchant username already exists
      const existingMerchant = await Merchant.findOne({ username: uname });
      if (existingMerchant) {
        return res.status(400).json({ message: "Merchant already exists" });
      }

      // Create merchant and link to user if provided
      const merchantData = { username: uname };
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        merchantData.userId = userId;
      }
      const merchant = new Merchant(merchantData);
      await merchant.save();

      res.status(201).json({
        message: "Merchant created successfully",
        merchant,
      });
    } catch (error) {
      console.error("Create merchant error:", error);
      res.status(500).json({ message: "Failed to create merchant" });
    }
  }
);

// List merchants (Staff/Admin)
router.get(
  "/",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search } = req.query;
      let query = {};
      if (search) {
        query.$or = [
          { businessName: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ];
      }

      // Restrict staff to only merchants they created or are linked to
      if (req.user.role === "staff") {
        query.userId = req.user._id;
      }

      const merchants = await Merchant.find(query)
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Merchant.countDocuments(query);

      res.json({
        merchants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("List merchants error:", error);
      res.status(500).json({ message: "Failed to fetch merchants" });
    }
  }
);

// Get merchant profile
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    let merchant;

    if (id === "me") {
      // Get current user's merchant profile
      merchant = await Merchant.findOne({ userId: req.user._id }).populate(
        "userId",
        "fullName email"
      );

      if (!merchant) {
        return res.status(404).json({ message: "Merchant profile not found" });
      }

      // Update last activity
      merchant.lastActivityDate = new Date();
      await merchant.save();
    } else {
      // Get merchant by ID (Staff/Admin only)
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid merchant id" });
      }
      if (!["staff", "admin"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      merchant = await Merchant.findById(id).populate(
        "userId",
        "fullName email"
      );

      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }
    }

    res.json({ data: merchant });
  } catch (error) {
    console.error("Get merchant error:", error);
    res.status(500).json({ message: "Failed to fetch merchant" });
  }
});

// Update own merchant profile (Merchant only)
router.patch("/me", authenticateToken, async (req, res) => {
  try {
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.userId;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.bvn; // Security: BVN shouldn't be changed
    delete updates.nin; // Security: NIN shouldn't be changed

    const merchant = await Merchant.findOneAndUpdate(
      { userId: req.user._id },
      { ...updates, lastActivityDate: new Date() },
      { new: true, runValidators: true }
    ).populate("userId", "fullName email");

    if (!merchant) {
      return res.status(404).json({ message: "Merchant profile not found" });
    }

    res.json({
      message: "Profile updated successfully",
      merchant,
    });
  } catch (error) {
    console.error("Update merchant profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Update merchant (Staff/Admin)
router.patch(
  "/:id",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid merchant id" });
      }

      // Remove fields that shouldn't be updated directly
      delete updates._id;
      delete updates.createdAt;
      delete updates.updatedAt;

      const merchant = await Merchant.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).populate("userId", "fullName email");

      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      res.json({
        message: "Merchant updated successfully",
        merchant,
      });
    } catch (error) {
      console.error("Update merchant error:", error);
      res.status(500).json({ message: "Failed to update merchant" });
    }
  }
);

// Delete merchant (Admin only) — cascades transactions
router.delete(
  "/:id",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid merchant id" });
      }

      // Ensure merchant exists
      const merchant = await Merchant.findById(id);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      // Delete related transactions
      const txResult = await MerchantTransaction.deleteMany({ merchantId: id });

      // Delete merchant
      await Merchant.findByIdAndDelete(id);

      res.json({
        message: "Merchant deleted successfully",
        deletedTransactions: txResult.deletedCount || 0,
      });
    } catch (error) {
      console.error("Delete merchant error:", error);
      res.status(500).json({ message: "Failed to delete merchant" });
    }
  }
);

// Record daily transactions (Staff/Admin)
router.post(
  "/:id/transactions",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { txn_date, txn_count, notes } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid merchant id" });
      }

      if (!txn_date || txn_count === undefined) {
        return res
          .status(400)
          .json({ message: "txn_date and txn_count are required" });
      }

      // Verify merchant exists
      const merchant = await Merchant.findById(id);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      // Normalize input
      const count = parseInt(txn_count, 10);
      if (Number.isNaN(count) || count < 0) {
        return res
          .status(400)
          .json({ message: "txn_count must be a non-negative integer" });
      }

      const date = new Date(txn_date);

      // Upsert daily record by merchant + date
      const updated = await MerchantTransaction.findOneAndUpdate(
        { merchantId: id, transactionDate: date },
        {
          $set: {
            merchantId: id,
            transactionDate: date,
            transactionCount: count,
            notes: notes || null,
            recordedBy: req.user._id,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Check if merchant should be flagged (less than 10 transactions for 7 consecutive days)
      await checkAndFlagMerchant(id);

      res.status(201).json({
        message: "Transaction saved",
        transaction: updated,
      });
    } catch (error) {
      console.error("Record transaction error:", error);
      res.status(500).json({ message: "Failed to record transaction" });
    }
  }
);

// Monthly total for a merchant (count only)
router.get(
  "/:id/transactions/monthly-total",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { year, month } = req.query; // month: 1-12
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid merchant id" });
      }
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      if (!y || !m || m < 1 || m > 12) {
        return res
          .status(400)
          .json({ message: "year and month (1-12) are required" });
      }

      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));

      const agg = await MerchantTransaction.aggregate([
        {
          $match: {
            merchantId: new mongoose.Types.ObjectId(id),
            transactionDate: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: "$transactionCount" },
            daysRecorded: { $sum: 1 },
          },
        },
      ]);

      const result = agg[0] || { totalCount: 0, daysRecorded: 0 };
      res.json({ year: y, month: m, ...result });
    } catch (error) {
      console.error("Monthly total error:", error);
      res.status(500).json({ message: "Failed to compute monthly total" });
    }
  }
);

// Get merchant transactions
router.get("/:id/transactions", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, page = 1, limit = 15 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid merchant id" });
    }

    // Check permissions
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    // Staff/Admin can view any merchant transactions; merchants can view their own
    const isOwnProfile =
      merchant.userId && merchant.userId.toString() === req.user._id.toString();
    const canView = isOwnProfile || ["staff", "admin"].includes(req.user.role);

    if (!canView) {
      return res.status(403).json({ message: "Access denied" });
    }

    let query = { merchantId: id };

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    const transactions = await MerchantTransaction.find(query)
      .populate("recordedBy", "fullName email username")
      .sort({ transactionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MerchantTransaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// List all transactions across merchants (Staff/Admin)
// Use a non-param path to avoid conflict with "/:id" route above
router.get(
  "/all-transactions",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        page = 1,
        limit = 50,
        merchantId,
        username,
      } = req.query;

      const query = {};
      if (merchantId && mongoose.Types.ObjectId.isValid(merchantId)) {
        query.merchantId = merchantId;
      } else if (username) {
        const m = await Merchant.findOne({ username: username.trim() });
        if (m) query.merchantId = m._id;
      }

      if (startDate || endDate) {
        query.transactionDate = {};
        if (startDate) query.transactionDate.$gte = new Date(startDate);
        if (endDate) query.transactionDate.$lte = new Date(endDate);
      }

      const transactions = await MerchantTransaction.find(query)
        .populate("merchantId", "username businessName")
        .populate("recordedBy", "fullName email username")
        .sort({ transactionDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await MerchantTransaction.countDocuments(query);

      res.json({
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("List all transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  }
);

// Get flagged merchants (Admin only)
router.get(
  "/flagged",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const query = { status: "flagged" };

      const merchants = await Merchant.find(query)
        .populate("userId", "fullName email")
        .sort({ flaggedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Merchant.countDocuments(query);

      res.json({
        merchants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get flagged merchants error:", error);
      res.status(500).json({ message: "Failed to fetch flagged merchants" });
    }
  }
);

// Helper function to check and flag merchants
async function checkAndFlagMerchant(merchantId) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await MerchantTransaction.find({
      merchantId,
      transactionDate: { $gte: sevenDaysAgo },
    }).sort({ transactionDate: -1 });

    // Check if we have 7 consecutive days with less than 10 transactions
    let consecutiveLowDays = 0;
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      const dayTransaction = recentTransactions.find((t) => {
        const tDate = new Date(t.transactionDate);
        tDate.setHours(0, 0, 0, 0);
        return tDate.getTime() === checkDate.getTime();
      });

      const dayCount = dayTransaction ? dayTransaction.transactionCount : 0;

      if (dayCount < 10) {
        consecutiveLowDays++;
      } else {
        break; // Reset if we find a day with 10+ transactions
      }
    }

    // Flag merchant if 7 consecutive days with <10 transactions
    if (consecutiveLowDays >= 7) {
      await Merchant.findByIdAndUpdate(merchantId, {
        status: "flagged",
        flaggedAt: new Date(),
        flaggedReason:
          "Less than 10 transactions per day for 7 consecutive days",
      });
    }
  } catch (error) {
    console.error("Error checking merchant flag status:", error);
  }
}

// Update a transaction (Staff/Admin)
router.patch(
  "/transactions/:transactionId",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { transactionCount, notes } = req.body;

      if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction id" });
      }

      const updates = {};
      if (transactionCount !== undefined) {
        const count = parseInt(transactionCount, 10);
        if (Number.isNaN(count) || count < 0) {
          return res
            .status(400)
            .json({
              message: "transactionCount must be a non-negative integer",
            });
        }
        updates.transactionCount = count;
      }
      if (notes !== undefined) {
        updates.notes = notes;
      }

      const transaction = await MerchantTransaction.findByIdAndUpdate(
        transactionId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json({ message: "Transaction updated successfully", transaction });
    } catch (error) {
      console.error("Update transaction error:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  }
);

module.exports = router;
