const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://vmonieweb.com',
    'https://www.vmonieweb.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/disputes', require('./routes/disputes'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/content', require('./routes/content'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/health', require('./routes/health'));

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ V-Money API Server is running successfully!',
    version: '2.0.0',
    database: 'MongoDB',
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
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: MongoDB`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});