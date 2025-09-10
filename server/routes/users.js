const express = require("express");
const User = require("../models/User");
const { authenticateToken, requireRoles } = require("../middleware/auth");
const { sendStatusEmail } = require("../config/email");

const router = express.Router();

// Get all users (Admin/Staff)
router.get(
  "/",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, role, status, search } = req.query;

      const query = {};
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ];
      }

      const users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
);

// Get single user
router.get(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Handle "me" endpoint
      if (id === "me") {
        return res.json({ user: req.user });
      }

      const user = await User.findById(id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }
);

// Update user (Admin/Staff or own profile)
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Handle "me" endpoint
    const targetId = id === "me" ? req.user._id : id;

    // Check permissions
    const isOwnProfile = targetId.toString() === req.user._id.toString();
    const canUpdate =
      isOwnProfile || ["admin", "staff"].includes(req.user.role);

    if (!canUpdate) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this user" });
    }

    // Restrict what non-admins can update
    if (!["admin"].includes(req.user.role)) {
      const allowedFields = ["fullName", "phone", "onboardingData"];
      const updateKeys = Object.keys(updates);
      const invalidFields = updateKeys.filter(
        (key) => !allowedFields.includes(key)
      );

      if (invalidFields.length > 0) {
        return res.status(403).json({
          message: `Cannot update fields: ${invalidFields.join(", ")}`,
        });
      }
      // Additionally, prevent non-admins from changing protected onboarding subfields
      if (
        updates.onboardingData &&
        typeof updates.onboardingData === "object"
      ) {
        const protectedOnboarding = ["bvn", "nin", "serialNo"];
        const changedProtected = Object.keys(updates.onboardingData).filter(
          (k) => protectedOnboarding.includes(k)
        );
        if (changedProtected.length) {
          return res
            .status(403)
            .json({
              message: `Cannot modify protected onboarding fields: ${changedProtected.join(", ")}`,
            });
        }
      }
    }

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const user = await User.findByIdAndUpdate(
      targetId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Approve user (Admin only)
router.patch(
  "/:id/approve",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndUpdate(
        id,
        { status: "approved", updatedAt: new Date() },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Send approval email
      try {
        await sendStatusEmail({
          to: user.email,
          status: "approved",
          notes:
            "Your account has been approved. You can now access your dashboard.",
          formType: "account registration",
          name: user.fullName,
        });
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }

      res.json({
        message: "User approved successfully",
        user,
      });
    } catch (error) {
      console.error("Approve user error:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  }
);

// Reject user (Admin only)
router.patch(
  "/:id/reject",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        { status: "rejected", updatedAt: new Date() },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Send rejection email
      try {
        await sendStatusEmail({
          to: user.email,
          status: "rejected",
          notes:
            reason ||
            "Your account registration has been rejected. Please contact support for more information.",
          formType: "account registration",
          name: user.fullName,
        });
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }

      res.json({
        message: "User rejected successfully",
        user,
      });
    } catch (error) {
      console.error("Reject user error:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  }
);

// Suspend user (Admin only)
router.patch(
  "/:id/suspend",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        { status: "suspended", updatedAt: new Date() },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Send suspension email
      try {
        await sendStatusEmail({
          to: user.email,
          status: "suspended",
          notes:
            reason ||
            "Your account has been suspended. Please contact support for more information.",
          formType: "account status",
          name: user.fullName,
        });
      } catch (emailError) {
        console.error("Failed to send suspension email:", emailError);
      }

      res.json({
        message: "User suspended successfully",
        user,
      });
    } catch (error) {
      console.error("Suspend user error:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  }
);

// Activate user (Admin only)
router.patch(
  "/:id/activate",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndUpdate(
        id,
        { status: "approved", updatedAt: new Date() },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Send activation email
      try {
        await sendStatusEmail({
          to: user.email,
          status: "activated",
          notes:
            "Your account has been activated. You can now access your dashboard.",
          formType: "account status",
          name: user.fullName,
        });
      } catch (emailError) {
        console.error("Failed to send activation email:", emailError);
      }

      res.json({
        message: "User activated successfully",
        user,
      });
    } catch (error) {
      console.error("Activate user error:", error);
      res.status(500).json({ message: "Failed to activate user" });
    }
  }
);

// Delete user (Admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  }
);

module.exports = router;
