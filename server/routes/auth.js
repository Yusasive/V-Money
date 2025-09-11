const express = require("express");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { authenticateToken, validateSession } = require("../middleware/auth");
const { validateEmail, validatePhone } = require("../middleware/security");
const { sendStatusEmail, sendPasswordResetEmail } = require("../config/email");

const router = express.Router();

// Enhanced validation middleware
const validateRegistration = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Full name can only contain letters, spaces, hyphens, and apostrophes"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Valid email is required"),
  body("phone")
    .custom((value) => {
      if (!validatePhone(value)) {
        throw new Error("Valid phone number is required");
      }
      return true;
    }),
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  body("role")
    .isIn(["aggregator", "staff"])
    .withMessage("Invalid role")
];
// Register new user (Aggregator/Staff)
router.post(
  "/register",
  validateRegistration,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { fullName, email, phone, username, password, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          message:
            existingUser.email === email
              ? "Email already registered"
              : "Username already taken",
        });
      }

      // Create new user
      const user = new User({
        fullName,
        email,
        phone,
        username,
        password,
        role,
        status: role === "admin" ? "approved" : "pending", // Admin auto-approved
      });

      await user.save();

      // Send registration status email (pending)
      try {
        await sendStatusEmail({
          to: email,
          status: "pending",
          notes:
            "Your registration was received and is pending admin approval.",
          formType: "account registration",
          name: fullName,
        });
      } catch (emailError) {
        console.error("Failed to send registration email:", emailError);
      }

      // Generate token
      const token = user.generateAuthToken();

      res.status(201).json({
        message: "Registration successful. Please wait for admin approval.",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  }
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 1 }).withMessage("Password required")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({ 
          message: "Account temporarily locked due to too many failed login attempts. Please try again later." 
        });
      }
      // Check password
      let isMatch = false;
      try {
        isMatch = await user.comparePassword(password);
      } catch (error) {
        if (error.message.includes('locked')) {
          return res.status(423).json({ message: error.message });
        }
        throw error;
      }
      
      if (!isMatch) {
        // Increment login attempts
        await user.incLoginAttempts();
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check if account is approved
      if (user.status === "pending") {
        return res.status(403).json({
          message: "Account pending approval. Please wait for admin approval.",
        });
      }

      if (user.status === "rejected") {
        return res.status(403).json({
          message: "Account has been rejected. Please contact support.",
        });
      }

      if (user.status === "suspended") {
        return res.status(403).json({
          message: "Account has been suspended. Please contact support.",
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = user.generateAuthToken();

      res.json({
        message: "Login successful",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
        },
        access_token: token,
        session: { access_token: token }, // For compatibility with existing frontend
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  }
);

// Get current user
router.get("/me", authenticateToken, validateSession, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        username: req.user.username,
        phone: req.user.phone,
        role: req.user.role,
        status: req.user.status,
        onboardingData: req.user.onboardingData,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user data" });
  }
});

// Forgot password
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({
          message:
            "If an account with that email exists, a reset link has been sent.",
        });
      }

      // Generate reset token
      const resetToken = user.generateSecureToken();
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send password reset email
      try {
        await sendPasswordResetEmail({
          to: email,
          resetToken,
          name: user.fullName,
        });
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
      }

      res.json({
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  }
);

// Reset password
router.post(
  "/reset-password",
  [
    body("token").isLength({ min: 1 }).withMessage("Reset token required"),
    body("password")
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be between 8 and 128 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { token, password } = req.body;

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      // Update password
      user.password = password;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      // Reset login attempts when password is reset
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  }
);

// Change password (authenticated)
router.post(
  "/change-password",
  [
    authenticateToken,
    validateSession,
    body("current").exists(),
    body("new")
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be between 8 and 128 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { current, new: newPassword } = req.body;

      const user = await User.findById(req.user._id).select("+password");

      // Verify current password
      const isMatch = await user.comparePassword(current);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  }
);

// Logout (optional - mainly clears server-side sessions if any)
router.post("/logout", authenticateToken, validateSession, async (req, res) => {
  try {
    // Invalidate current session by incrementing session version
    await req.user.invalidateAllSessions();
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});

// Logout from all devices
router.post("/logout-all", authenticateToken, validateSession, async (req, res) => {
  try {
    await req.user.invalidateAllSessions();
    res.json({ message: "Logged out from all devices successfully" });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});
module.exports = router;
