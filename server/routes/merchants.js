const express = require("express");
const mongoose = require("mongoose");
const Merchant = require("../models/Merchant");
const MerchantTransaction = require("../models/MerchantTransaction");
const User = require("../models/User");
const { authenticateToken, requireRoles } = require("../middleware/auth");

const router = express.Router();

// Create merchant (Staff/Admin)
router.post(
  "/",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const {
        username,
        businessName,
        email,
        phone,
        address,
        businessAddress,
        firstName,
        middleName,
        lastName,
        gender,
        state,
        lga,
        bvn,
        nin,
        serialNo,
        userId,
      } = req.body;

      // Check if merchant already exists
      const existingMerchant = await Merchant.findOne({
        $or: [{ username }, { email }, { userId }],
      });

      if (existingMerchant) {
        return res.status(400).json({ message: "Merchant already exists" });
      }

      const merchant = new Merchant({
        userId,
        username,
        businessName,
        email,
        phone,
        address,
        businessAddress,
        firstName,
        middleName,
        lastName,
        gender,
        state,
        lga,
        bvn,
        nin,
        serialNo,
      });

      await merchant.save();
      await merchant.populate("userId", "fullName email");

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
      const { page = 1, limit = 50, search } = req.query;
      const query = {};
      if (search) {
        query.$or = [
          { businessName: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ];
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

      const transaction = new MerchantTransaction({
        merchantId: id,
        transactionDate: new Date(txn_date),
        transactionCount: parseInt(txn_count, 10),
        recordedBy: req.user._id,
        notes: notes || null,
      });

      await transaction.save();

      // Check if merchant should be flagged (less than 10 transactions for 7 consecutive days)
      await checkAndFlagMerchant(id);

      res.status(201).json({
        message: "Transaction recorded successfully",
        transaction,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          message: "Transaction already recorded for this date",
        });
      }
      console.error("Record transaction error:", error);
      res.status(500).json({ message: "Failed to record transaction" });
    }
  }
);

// Get merchant transactions
router.get("/:id/transactions", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid merchant id" });
    }

    // Check permissions
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    const isOwnProfile = merchant.userId.toString() === req.user._id.toString();
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

// Get flagged merchants (Admin only)
router.get(
  "/flagged",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      const flaggedMerchants = await Merchant.find({ status: "flagged" })
        .populate("userId", "fullName email")
        .sort({ flaggedAt: -1 });

      res.json({ merchants: flaggedMerchants });
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

module.exports = router;
