const express = require("express");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { 
  authenticateToken, 
  validateSession, 
  validatePasswordStrength,
  getUserSessions,
  invalidateSession,
  invalidateUserSessions
} = require("../middleware/auth");
const { validateEmail, validatePhone, validatePassword, validateUsername } = require("../middleware/security");
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
    .withMessage("Valid email is required")
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already registered');
      }
      return true;
    }),
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
    .custom(async (username) => {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new Error('Username already taken');
      }
      return true;
    }),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  body("role")
    .isIn(["aggregator", "staff"])
    .withMessage("Invalid role")
];

// Login validation
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email required"),
  body("password")
    .isLength({ min: 1 })
    .withMessage("Password required")
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

      // Additional server-side validation
      if (!validatePassword(password)) {
        return res.status(400).json({
          message: "Password does not meet security requirements"
        });
      }
      
      if (!validateUsername(username)) {
        return res.status(400).json({
          message: "Username format is invalid"
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
        lastActivity: new Date()
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
        user: user.toSafeObject(),
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          message: `${field === 'email' ? 'Email' : 'Username'} already exists`
        });
      }
      
      res.status(500).json({ 
        message: "Registration failed",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Login
router.post(
  "/login",
  validateLogin,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: errors.array() 
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check if account is locked
      if (user.isLocked) {
        const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
        return res.status(423).json({ 
          message: `Account temporarily locked due to too many failed login attempts. Please try again in ${lockTimeRemaining} minutes.`,
          lockUntil: user.lockUntil
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
        
        // Log failed attempt
        console.warn(`Failed login attempt for ${email} from ${req.ip}`);
        
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check if account is approved
      if (user.status === "pending") {
        return res.status(403).json({
          message: "Account pending approval. Please wait for admin approval.",
          status: user.status
        });
      }

      if (user.status === "rejected") {
        return res.status(403).json({
          message: "Account has been rejected. Please contact support.",
          status: user.status
        });
      }

      if (user.status === "suspended") {
        return res.status(403).json({
          message: "Account has been suspended. Please contact support.",
          status: user.status
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();
      
      // Update last login
      user.lastLogin = new Date();
      user.lastActivity = new Date();
      await user.save();

      // Log successful login
      console.log(`Successful login for ${email} from ${req.ip}`);

      // Generate token
      const token = user.generateAuthToken();

      res.json({
        message: "Login successful",
        user: user.toSafeObject(),
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
    // Update last activity
    req.user.lastActivity = new Date();
    await req.user.save();
    
    res.json({
      user: req.user.toSafeObject(),
      session: {
        lastActivity: req.user.lastActivity,
        sessionVersion: req.user.sessionVersion
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user data" });
  }
});

// Get user sessions
router.get("/sessions", authenticateToken, validateSession, async (req, res) => {
  try {
    const sessions = getUserSessions(req.user._id);
    res.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Failed to get sessions" });
  }
});

// Invalidate specific session
router.delete("/sessions/:sessionId", authenticateToken, validateSession, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const success = invalidateSession(sessionId);
    
    if (success) {
      res.json({ message: "Session invalidated successfully" });
    } else {
      res.status(404).json({ message: "Session not found" });
    }
  } catch (error) {
    console.error("Invalidate session error:", error);
    res.status(500).json({ message: "Failed to invalidate session" });
  }
});

// Invalidate all sessions
router.delete("/sessions", authenticateToken, validateSession, async (req, res) => {
  try {
    const count = invalidateUserSessions(req.user._id);
    await req.user.invalidateAllSessions();
    
    res.json({ 
      message: "All sessions invalidated successfully",
      invalidatedCount: count
    });
  } catch (error) {
    console.error("Invalidate all sessions error:", error);
    res.status(500).json({ message: "Failed to invalidate sessions" });
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
        return res.status(400).json({ 
          message: "Validation failed",
          errors: errors.array() 
        });
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

      // Check if user is locked
      if (user.isLocked) {
        return res.status(423).json({
          message: "Account is temporarily locked. Please try again later."
        });
      }

      // Generate reset token
      const resetToken = user.generateSecureToken();
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Log password reset request
      console.log(`Password reset requested for ${email} from ${req.ip}`);

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
        return res.status(400).json({ 
          message: "Validation failed",
          errors: errors.array() 
        });
      }
      
      const { token, password } = req.body;

      // Additional password validation
      if (!validatePassword(password)) {
        return res.status(400).json({
          message: "Password does not meet security requirements"
        });
      }

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      // Log password reset
      console.log(`Password reset completed for ${user.email} from ${req.ip}`);

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
    validatePasswordStrength,
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
        return res.status(400).json({ 
          message: "Validation failed",
          errors: errors.array() 
        });
      }
      
      const { current, new: newPassword } = req.body;

      // Additional validation
      if (!validatePassword(newPassword)) {
        return res.status(400).json({
          message: "New password does not meet security requirements"
        });
      }
      
      if (current === newPassword) {
        return res.status(400).json({
          message: "New password must be different from current password"
        });
      }

      const user = await User.findById(req.user._id).select("+password");

      // Verify current password
      const isMatch = await user.comparePassword(current);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Log password change
      console.log(`Password changed for ${user.email} from ${req.ip}`);

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
    // Invalidate current session
    if (req.sessionId) {
      invalidateSession(req.sessionId);
    }
    
    // Log logout
    console.log(`User ${req.user.email} logged out from ${req.ip}`);
    
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});

// Logout from all devices
router.post("/logout-all", authenticateToken, validateSession, async (req, res) => {
  try {
    // Invalidate all user sessions
    const count = invalidateUserSessions(req.user._id);
    await req.user.invalidateAllSessions();
    
    // Log logout all
    console.log(`User ${req.user.email} logged out from all devices (${count} sessions) from ${req.ip}`);
    
    res.json({ 
      message: "Logged out from all devices successfully",
      invalidatedSessions: count
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});

// Validate token endpoint
router.post("/validate", async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }
    
    const decoded = User.verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    if (decoded.sessionVersion !== user.sessionVersion) {
      return res.status(401).json({ message: "Session invalidated" });
    }
    
    res.json({ 
      valid: true,
      user: user.toSafeObject(),
      expiresAt: new Date(decoded.exp * 1000)
    });
  } catch (error) {
    res.status(401).json({ 
      valid: false,
      message: error.message 
    });
  }
});

module.exports = router;
