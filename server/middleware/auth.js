const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validateObjectId, validatePassword } = require("./security");

// Session store for tracking active sessions
const activeSessions = new Map();

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

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
    
    // Validate token payload structure
    if (!decoded.id || !decoded.sessionVersion) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid token - user not found" });
    }

    // Check session version for invalidated sessions
    if (decoded.sessionVersion !== user.sessionVersion) {
      return res.status(401).json({ message: "Session invalidated" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }

    if (user.status === "rejected") {
      return res.status(403).json({ message: "Account rejected" });
    }

    // Track active session
    const sessionId = `${user._id}-${decoded.iat}`;
    activeSessions.set(sessionId, {
      userId: user._id,
      expiresAt: decoded.exp * 1000,
      lastActivity: Date.now(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    req.user = user;
    req.sessionId = sessionId;
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

    if (error && error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
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
          userRole: req.user.role,
          requiredRoles: roles
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

// Enhanced auth middleware for serverless functions
const enhancedAuth = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {
      // Additional security checks
      if (req.user.status !== 'approved' && req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: "Account not approved",
          status: req.user.status
        });
      }
      
      // Update last activity
      if (req.sessionId && activeSessions.has(req.sessionId)) {
        const session = activeSessions.get(req.sessionId);
        session.lastActivity = Date.now();
      }
      
      next();
    });
  } catch (error) {
    console.error('Enhanced auth error:', error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Auth middleware for serverless functions (used in api/ folder)
const auth = async (req, res, next) => {
  try {
    const authHeader =
      req.header("Authorization") || req.headers["authorization"];
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Validate JWT format
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return res.status(401).json({ message: "Invalid token format" });
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

    // Check session version
    if (decoded.sessionVersion !== user.sessionVersion) {
      return res.status(401).json({ message: "Session invalidated" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }

    if (user.status === "rejected") {
      return res.status(403).json({ message: "Account rejected" });
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
  }
};

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
      
      // Check for concurrent session limits
      const userSessions = Array.from(activeSessions.values())
        .filter(session => session.userId.toString() === currentUser._id.toString());
      
      if (userSessions.length > 5) { // Max 5 concurrent sessions
        console.warn(`User ${currentUser.email} has ${userSessions.length} active sessions`);
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

// Password validation middleware
const validatePasswordStrength = (req, res, next) => {
  const { password } = req.body;
  
  if (password && !validatePassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters with uppercase, lowercase, and number"
    });
  }
  
  next();
};

// Get active sessions for a user
const getUserSessions = (userId) => {
  return Array.from(activeSessions.entries())
    .filter(([_, session]) => session.userId.toString() === userId.toString())
    .map(([sessionId, session]) => ({
      sessionId,
      lastActivity: new Date(session.lastActivity),
      ip: session.ip,
      userAgent: session.userAgent
    }));
};

// Invalidate specific session
const invalidateSession = (sessionId) => {
  return activeSessions.delete(sessionId);
};

// Invalidate all user sessions
const invalidateUserSessions = (userId) => {
  let count = 0;
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.userId.toString() === userId.toString()) {
      activeSessions.delete(sessionId);
      count++;
    }
  }
  return count;
};

// Get user role helper
const getUserRole = (user) => {
  return user?.role || "user";
};

module.exports = {
  authenticateToken,
  enhancedAuth,
  requireRoles,
  requireAdmin,
  requireStaffOrAdmin,
  auth,
  adminAuth,
  validateSession,
  validatePasswordStrength,
  getUserRole,
  getUserSessions,
  invalidateSession,
  invalidateUserSessions,
  activeSessions
};
