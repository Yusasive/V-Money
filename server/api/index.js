const express = require("express");
const cors = require("cors");
const { connectDB } = require("../config/database");

// Connect to MongoDB
connectDB();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://vmonieweb.com",
    "https://www.vmonieweb.com",
    "https://admin.vmonieweb.com",
    "https://www.admin.vmonieweb.com",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach routes
app.use("/auth", require("../routes/auth"));
app.use("/users", require("../routes/users"));
app.use("/tasks", require("../routes/tasks"));
app.use("/disputes", require("../routes/disputes"));
app.use("/merchants", require("../routes/merchants"));
app.use("/analytics", require("../routes/analytics"));
app.use("/content", require("../routes/content"));
app.use("/forms", require("../routes/forms"));
app.use("/upload", require("../routes/upload"));
app.use("/health", require("../routes/health"));

// Default route
app.get("/", (req, res) => {
  res.json({ 
    message: "✅ V-Money API Server is running successfully!",
    version: "2.0.0",
    database: "MongoDB",
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = async (req, res) => {
  // Manually handle CORS in case Express doesn't kick in
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  app(req, res);
};