const express = require("express");
const { body, validationResult } = require("express-validator");
const { authHelpers } = require("../config/supabase");

const router = express.Router();

// Register admin user
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const { data, error } = await authHelpers.signUp(email, password, {
        role: "admin",
      });
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(201).json({
        user: {
          id: data.user.id,
          email: data.user.email,
          role:
            data.user.user_metadata?.role ||
            data.user.app_metadata?.role ||
            "user",
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const { data, error } = await authHelpers.signIn(email, password);
      if (error || !data?.user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: require("../config/supabase").authHelpers.getUserRole(
            data.user
          ),
        },
        session: data.session,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get current user (requires frontend to send access token)
router.get("/me", async (req, res) => {
  const accessToken = req.headers["authorization"]?.replace("Bearer ", "");
  // console.log("[DIAGNOSE] Received access token:", accessToken);
  if (!accessToken) {
    // console.log("[DIAGNOSE] No token provided");
    return res.status(401).json({ message: "No token provided" });
  }
  const { data, error } =
    await require("../config/supabase").authHelpers.getCurrentUser(accessToken);
  if (error || !data) {
    // console.log("[DIAGNOSE] Supabase error:", error);
    return res.status(401).json({ message: "Invalid token", error });
  }
  // Use getUserRole helper to ensure role is set correctly
  const role = require("../config/supabase").authHelpers.getUserRole(data);
  res.json({
    user: {
      id: data.id,
      email: data.email,
      role: data.user_metadata?.role || data.app_metadata?.role || "user",
      user_metadata: data.user_metadata,
      app_metadata: data.app_metadata,
    },
  });
});

module.exports = router;
