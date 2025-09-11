// Safe require for rate-limit
let rateLimit;
try {
  rateLimit = require("express-rate-limit");
} catch {
  console.warn(
    "[Warn] express-rate-limit not installed. Rate limiting middleware disabled."
  );
  rateLimit = () => (req, res, next) => next();
}
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss");
const helmet = require("helmet");
const crypto = require("crypto");

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use IP + User-Agent for more accurate rate limiting
      return `${req.ip}-${crypto
        .createHash("md5")
        .update(req.get("User-Agent") || "")
        .digest("hex")}`;
    },
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString(),
      });
    },
  });
};

// Different rate limits for different endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 attempts (increased for production)
  "Too many authentication attempts, please try again later"
);

const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requests (increased for production)
  "Too many requests, please try again later"
);

const strictLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  20, // 20 requests (increased for production)
  "Rate limit exceeded for this endpoint"
);

// File upload rate limiter
const uploadLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  50, // 50 uploads per hour
  "Too many file uploads, please try again later"
);

// XSS sanitization middleware
const sanitizeInput = (req, res, next) => {
  try {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    next();
  } catch (error) {
    console.error("Input sanitization error:", error);
    res.status(400).json({ message: "Invalid input data" });
  }
};

const sanitizeObject = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return typeof obj === "string" ? xss(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip potentially dangerous keys
    if (key.startsWith("__") || key.includes("prototype")) {
      continue;
    }
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://use.typekit.net",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://use.typekit.net",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "http:",
        "https://images.pexels.com",
        "https://res.cloudinary.com",
      ],
      scriptSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://api.cloudinary.com",
        "https://*.mongodb.net",
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests:
        process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Request size validation middleware
const validateRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.get("content-length") || "0");
  const maxSize = 50 * 1024 * 1024; // 50MB max

  if (contentLength > maxSize) {
    return res.status(413).json({
      message: "Request entity too large",
      maxSize: "50MB",
    });
  }
  next();
};

// Input validation helpers
const validateObjectId = (id) => {
  const mongoose = require("mongoose");
  return id && mongoose.Types.ObjectId.isValid(id);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email && typeof email === "string" && emailRegex.test(email.trim());
};

const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10,14}$/;
  return (
    phone &&
    typeof phone === "string" &&
    phoneRegex.test(phone.replace(/\D/g, ""))
  );
};

const validatePassword = (password) => {
  if (!password || typeof password !== "string") return false;

  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

const validateUsername = (username) => {
  if (!username || typeof username !== "string") return false;

  // 3-30 characters, alphanumeric, underscore, hyphen only
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

// IP whitelist middleware for admin endpoints
const adminIPWhitelist = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const allowedIPs = (process.env.ADMIN_ALLOWED_IPS || "")
    .split(",")
    .filter(Boolean);
  if (allowedIPs.length === 0) {
    return next(); // No restriction if not configured
  }

  const clientIP = req.ip || req.connection.remoteAddress;
  if (!allowedIPs.includes(clientIP)) {
    console.warn(`Admin access denied for IP: ${clientIP}`);
    return res
      .status(403)
      .json({ message: "Access denied from this IP address" });
  }

  next();
};

// Security middleware stack
const applySecurityMiddleware = (app) => {
  // Basic security headers
  app.use(securityHeaders);

  // Request size validation
  app.use(validateRequestSize);

  // MongoDB injection protection
  app.use(
    mongoSanitize({
      replaceWith: "_",
      onSanitize: ({ req, key }) => {
        console.warn(
          `Sanitized potentially malicious key: ${key} from ${req.ip}`
        );
      },
    })
  );

  // XSS protection
  app.use(sanitizeInput);

  // General rate limiting
  app.use("/api/", generalLimiter);

  // Strict rate limiting for sensitive endpoints
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
  app.use("/api/auth/reset-password", authLimiter);
  app.use("/api/upload/", uploadLimiter);

  // Admin IP whitelist (if configured)
  app.use("/api/admin/", adminIPWhitelist);
};

module.exports = {
  authLimiter,
  generalLimiter,
  strictLimiter,
  uploadLimiter,
  sanitizeInput,
  securityHeaders,
  applySecurityMiddleware,
  validateRequestSize,
  adminIPWhitelist,
  validateObjectId,
  validateEmail,
  validatePhone,
  validatePassword,
  validateUsername,
};
