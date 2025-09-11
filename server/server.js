// Clean Express server entry (previous React component removed)
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Safe requires (don't crash if dependency not installed yet)
let helmet = () => (req, res, next) => next();
try {
  helmet = require("helmet");
} catch {
  console.warn("[Warn] helmet not installed – proceeding without it");
}

let rateLimit = (opts) => (req, res, next) => next();
try {
  rateLimit = require("express-rate-limit");
} catch {
  console.warn(
    "[Warn] express-rate-limit not installed – rate limiting disabled"
  );
}

let mongoSanitize = () => (req, res, next) => next();
try {
  mongoSanitize = require("express-mongo-sanitize");
} catch {
  console.warn(
    "[Warn] express-mongo-sanitize not installed – sanitization disabled"
  );
}
const path = require("path");
const connectDB = require("./db");

connectDB().catch((err) => {
  console.error("[Startup] DB connection failed:", err.message);
  process.exit(1);
});

const app = express();

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(mongoSanitize());

// Rate limiting
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// Basic health (pre-router)
app.get("/health", (req, res) => res.json({ status: "ok" }));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/disputes", require("./routes/disputes"));
app.use("/api/merchants", require("./routes/merchants"));
app.use("/api/forms", require("./routes/forms"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/content", require("./routes/content"));
app.use("/api/health", require("./routes/health"));
app.use("/api/analytics", require("./routes/analytics"));

// Production static serving (optional if client build present)
try {
  const clientBuild = path.join(__dirname, "..", "build");
  if (require("fs").existsSync(clientBuild)) {
    app.use(express.static(clientBuild));
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api/")) {
        return res.sendFile(path.join(clientBuild, "index.html"));
      }
      res.status(404).json({ message: "API route not found" });
    });
  }
} catch (e) {
  // ignore
}

// 404 for API (if not handled above)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API route not found" });
  }
  next();
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Error]", err);
  res.status(err.status || 500).json({
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[Startup] Server listening on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));

module.exports = app;
