const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Basic health check
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();

    // Test database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    const responseTime = Date.now() - startTime;

    if (dbState !== 1) {
      return res.status(503).json({
        status: 'unhealthy',
        database: dbStatus,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'healthy',
      database: dbStatus,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const checks = {
    database: { status: 'unknown', responseTime: null, error: null },
    collections: { status: 'unknown', count: 0, error: null }
  };

  // Test database connection
  try {
    const startTime = Date.now();
    const dbState = mongoose.connection.readyState;
    checks.database.responseTime = `${Date.now() - startTime}ms`;

    if (dbState === 1) {
      checks.database.status = 'healthy';
    } else {
      checks.database.status = 'unhealthy';
      checks.database.error = 'Database not connected';
    }
  } catch (error) {
    checks.database.status = 'unhealthy';
    checks.database.error = error.message;
  }

  // Test collections access
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    checks.collections.status = 'healthy';
    checks.collections.count = collections.length;
  } catch (error) {
    checks.collections.status = 'unhealthy';
    checks.collections.error = error.message;
  }

  const overallStatus = Object.values(checks).every(check => check.status === 'healthy') 
    ? 'healthy' 
    : 'unhealthy';

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState
    },
    checks
  });
});

module.exports = router;