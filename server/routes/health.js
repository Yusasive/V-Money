const express = require("express");
const { supabaseAdmin } = require("../config/supabase");

const router = express.Router();

// Health check endpoint
router.get("/", async (req, res) => {
  try {
    const startTime = Date.now();

    // Test database connection
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("count")
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return res.status(503).json({
        status: "unhealthy",
        database: "disconnected",
        error: error.message,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: "healthy",
      database: "connected",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      status: "unhealthy",
      database: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed health check with Supabase service status
router.get("/detailed", async (req, res) => {
  const checks = {
    database: { status: "unknown", responseTime: null, error: null },
    auth: { status: "unknown", responseTime: null, error: null },
  };

  // Test database connection
  try {
    const startTime = Date.now();
    const { error } = await supabaseAdmin
      .from("users")
      .select("count")
      .limit(1);

    checks.database.responseTime = `${Date.now() - startTime}ms`;

    if (error) {
      checks.database.status = "unhealthy";
      checks.database.error = error.message;
    } else {
      checks.database.status = "healthy";
    }
  } catch (error) {
    checks.database.status = "unhealthy";
    checks.database.error = error.message;
  }

  // Test auth service
  try {
    const startTime = Date.now();
    const { error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    checks.auth.responseTime = `${Date.now() - startTime}ms`;

    if (error) {
      checks.auth.status = "unhealthy";
      checks.auth.error = error.message;
    } else {
      checks.auth.status = "healthy";
    }
  } catch (error) {
    checks.auth.status = "unhealthy";
    checks.auth.error = error.message;
  }

  const overallStatus = Object.values(checks).every(
    (check) => check.status === "healthy"
  )
    ? "healthy"
    : "unhealthy";

  const statusCode = overallStatus === "healthy" ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    supabase: {
      url: process.env.SUPABASE_URL,
      project:
        process.env.SUPABASE_URL?.split("//")[1]?.split(".")[0] || "unknown",
    },
    checks,
  });
});

module.exports = router;
