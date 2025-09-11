const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth, adminAuth } = require("../middleware/auth");
const { sendPasswordResetEmail } = require("../config/email");

// Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://vmonieweb.com",
  "https://www.vmonieweb.com",
  process.env.FRONTEND_URL
].filter(Boolean);

// Set CORS headers
const setCORS = (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
};

// Helper to parse body for POST requests
const getBody = async (req) => {
  if (req.body) return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
};

// Helper to send response with CORS always applied
const send = (req, res, status, data) => {
  setCORS(req, res);
  res.status(status).json(data);
};

// Main handler
module.exports = async (req, res) => {
  setCORS(req, res);

  // Handle OPTIONS preflight early
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔹 /api/auth/register
  if (req.method === "POST" && req.url.endsWith("/register")) {
    const bodyData = await getBody(req);
    
    if (!bodyData.email || !bodyData.password || bodyData.password.length < 8) {
      return send(req, res, 400, { message: "Invalid input. Password must be at least 8 characters." });
    }
    
    if (!bodyData.fullName || !bodyData.phone || !bodyData.username) {
      return send(req, res, 400, { message: "Full name, phone, and username are required" });
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: bodyData.email }, { username: bodyData.username }]
      });
      
      if (existingUser) {
        const field = existingUser.email === bodyData.email ? 'Email' : 'Username';
        return send(req, res, 400, { message: `${field} already exists` });
      }

      const user = new User({
        fullName: bodyData.fullName,
        email: bodyData.email,
        phone: bodyData.phone,
        username: bodyData.username,
        password: bodyData.password,
        role: bodyData.role || "aggregator",
        status: bodyData.role === 'admin' ? 'approved' : 'pending'
      });
      
      await user.save();
      
      const token = user.generateAuthToken();
      
      return send(req, res, 201, {
        message: 'Registration successful. Please wait for admin approval.',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return send(req, res, 500, { message: "Registration failed" });
    }
  }

  // 🔹 /api/auth/login
  if (req.method === "POST" && req.url.endsWith("/login")) {
    const bodyData = await getBody(req);
    
    if (!bodyData.email || !bodyData.password) {
      return send(req, res, 400, { message: "Email and password are required" });
    }
    
    try {
      const user = await User.findOne({ email: bodyData.email }).select('+password');
      if (!user) {
        return send(req, res, 400, { message: "Invalid credentials" });
      }
      
      const isMatch = await user.comparePassword(bodyData.password);
      if (!isMatch) {
        return send(req, res, 400, { message: "Invalid credentials" });
      }

      // Check account status
      if (user.status === 'pending') {
        return send(req, res, 403, { 
          message: 'Account pending approval. Please wait for admin approval.' 
        });
      }

      if (user.status === 'rejected') {
        return send(req, res, 403, { 
          message: 'Account has been rejected. Please contact support.' 
        });
      }

      if (user.status === 'suspended') {
        return send(req, res, 403, { 
          message: 'Account has been suspended. Please contact support.' 
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      const token = user.generateAuthToken();
      
      return send(req, res, 200, {
        message: 'Login successful',
        token,
        access_token: token,
        session: { access_token: token },
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return send(req, res, 500, { message: "Login failed" });
    }
  }

  // 🔹 /api/auth/me
  if (req.method === "GET" && req.url.endsWith("/me")) {
    try {
      await auth(req, res, async () => {
        return send(req, res, 200, {
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
            createdAt: req.user.createdAt
          },
        });
      });
    } catch (error) {
      return send(req, res, 401, { message: "Unauthorized" });
    }
  }

  // 🔹 /api/auth/forgot-password
  if (req.method === "POST" && req.url.endsWith("/forgot-password")) {
    const bodyData = await getBody(req);
    
    if (!bodyData.email) {
      return send(req, res, 400, { message: "Email is required" });
    }

    try {
      const user = await User.findOne({ email: bodyData.email });
      if (!user) {
        // Don't reveal if email exists or not
        return send(req, res, 200, { 
          message: 'If an account with that email exists, a reset link has been sent.' 
        });
      }

      // Generate reset token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send password reset email
      try {
        await sendPasswordResetEmail({
          to: user.email,
          resetToken,
          name: user.fullName,
        });
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
      }

      return send(req, res, 200, { 
        message: 'If an account with that email exists, a reset link has been sent.' 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return send(req, res, 500, { message: "Failed to process request" });
    }
  }

  // 🔹 /api/auth/reset-password
  if (req.method === "POST" && req.url.endsWith("/reset-password")) {
    const bodyData = await getBody(req);
    
    if (!bodyData.token || !bodyData.password) {
      return send(req, res, 400, { message: "Token and password are required" });
    }

    try {
      const user = await User.findOne({
        passwordResetToken: bodyData.token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return send(req, res, 400, { message: "Invalid or expired reset token" });
      }

      // Update password
      user.password = bodyData.password;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      return send(req, res, 200, { message: "Password reset successful" });
    } catch (error) {
      console.error('Reset password error:', error);
      return send(req, res, 500, { message: "Failed to reset password" });
    }
  }

  // 🔹 /api/auth/change-password
  if (req.method === "POST" && req.url.endsWith("/change-password")) {
    try {
      await auth(req, res, async () => {
        const bodyData = await getBody(req);
        
        if (!bodyData.current || !bodyData.new) {
          return send(req, res, 400, { message: "Current and new password are required" });
        }

        const user = await User.findById(req.user._id).select('+password');
        
        // Verify current password
        const isMatch = await user.comparePassword(bodyData.current);
        if (!isMatch) {
          return send(req, res, 400, { message: "Current password is incorrect" });
        }

        // Update password
        user.password = bodyData.new;
        await user.save();

        return send(req, res, 200, { message: "Password changed successfully" });
      });
    } catch (error) {
      return send(req, res, 401, { message: "Unauthorized" });
    }
  }

  // 🔹 Not found
  return send(req, res, 404, { message: "Not found" });
};