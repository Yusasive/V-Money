const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validateObjectId } = require("./security");

// Verify JWT token and attach user to request
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader =
      req.header("Authorization") || req.headers["authorization"];
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Validate JWT format before verification
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return res.status(401).json({ message: "Invalid token format" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid token - user not found" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }

    req.user = user;
    next();
  } catch (error) {
    // Handle expired tokens explicitly so callers can react appropriately
    if (error && error.name === "TokenExpiredError") {
      console.warn(
        "Authentication error: TokenExpiredError - expired at",
        error.expiredAt
      );
      return res.status(401).json({ message: "Token expired" });
    }

    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Require specific roles
const requireRoles =
  (roles = []) =>
  (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied. Required roles: ${roles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      return res.status(403).json({ message: "Access denied" });
    }
  };

// Admin only middleware
const requireAdmin = requireRoles(["admin"]);

// Staff or Admin middleware
const requireStaffOrAdmin = requireRoles(["staff", "admin"]);

// Auth middleware for serverless functions (used in api/ folder)
const auth = async (req, res, next) => {
  try {
    const authHeader =
      req.header("Authorization") || req.headers["authorization"];
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate decoded token structure
    if (!decoded.id || !validateObjectId(decoded.id)) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid token - user not found" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }

    // Check if user status allows access
    if (!["approved", "pending"].includes(user.status)) {
      return res.status(403).json({ message: "Account access denied" });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error && error.name === "TokenExpiredError") {
      console.warn(
        "Authentication error (auth): TokenExpiredError - expired at",
        error.expiredAt
      );
      return res.status(401).json({ message: "Token expired" });
    }

    if (error && error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Invalid token" });
    // Validate JWT format
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return res.status(401).json({ message: "Invalid token format" });
    }
  }
};
    
    if (!decoded.id || !validateObjectId(decoded.id)) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    

    if (error && error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
      // Additional security: check user status for role-based access
      if (req.user.status !== "approved" && !["admin"].includes(req.user.role)) {
        return res.status(403).json({
          message: "Account not approved for this action"
        });
      }
// Admin auth for serverless functions
const adminAuth = async (req, res, next) => {
  return auth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
};

// Session validation middleware
const validateSession = async (req, res, next) => {
  try {
    if (req.user) {
      // Check if user account is still valid
      const currentUser = await User.findById(req.user._id).select("-password");
      if (!currentUser) {
        return res.status(401).json({ message: "User account no longer exists" });
      }
      
      if (currentUser.status === "suspended" || currentUser.status === "rejected") {
        return res.status(403).json({ message: "Account access revoked" });
      }
      
      // Update req.user with latest data
      req.user = currentUser;
    }
    next();
  } catch (error) {
    console.error("Session validation error:", error);
    return res.status(500).json({ message: "Session validation failed" });
  }
};
// Get user role helper
const getUserRole = (user) => {
  return user?.role || "user";
};

module.exports = {
  authenticateToken,
  requireRoles,
  requireAdmin,
  requireStaffOrAdmin,
  auth,
  adminAuth,
  validateSession,
  getUserRole,
};
