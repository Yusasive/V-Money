const express = require("express");
const { supabase, supabaseAdmin } = require("../config/supabase");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Change password (Merchant only)
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { current, new: newPassword } = req.body;
    if (!current || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password required" });
    }
    // Get current user
    const { user } = req;
    // Re-authenticate user with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (signInError) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      return res
        .status(500)
        .json({ message: updateError.message || "Failed to update password" });
    }
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Register user (supports roles: admin, staff, aggregator, merchant)
router.post("/register", async (req, res) => {
  try {
    const { email, password, role = "aggregator", admin_uid } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const allowedRoles = ["admin", "staff", "aggregator"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message:
          "Invalid role. Merchants must register through the onboarding form.",
      });
    }

    // Gate admin registration with UID
    if (role === "admin") {
      const expected = process.env.ADMIN_REGISTRATION_UID;
      if (!expected || admin_uid !== expected) {
        return res
          .status(403)
          .json({ message: "Valid admin UID required for admin registration" });
      }
    }

    // Email confirmation signup using Supabase Auth (sends confirmation email)
    const redirectTo =
      process.env.EMAIL_CONFIRM_REDIRECT_URL ||
      process.env.PASSWORD_RESET_REDIRECT_URL ||
      "http://localhost:3000/login";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { role },
      },
    });

    if (error) {
      console.error("Registration error:", error);
      return res.status(400).json({
        message: error.message || "Registration failed",
      });
    }

    // Note: profile row is created by DB trigger; email must be confirmed by user
    res.status(201).json({
      message:
        "Registration initiated. Please check your email to confirm your account.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login (no role restriction here; role-based access is enforced per-route)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      return res.status(401).json({
        message: error.message || "Invalid credentials",
      });
    }

    const role =
      data.user.user_metadata?.role || data.user.app_metadata?.role || "user";

    res.json({
      message: "Login successful",
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Forgot password (email link)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const redirectTo = process.env.PASSWORD_RESET_REDIRECT_URL;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      console.error("Forgot password error:", error);
      return res
        .status(400)
        .json({ message: error.message || "Failed to send reset email" });
    }
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role:
          req.user.user_metadata?.role || req.user.app_metadata?.role || "user",
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return res.status(400).json({ message: "Logout failed" });
    }

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
