const mongoose = require('mongoose');

// Enhanced connection options for production
const getConnectionOptions = () => {
  const baseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false,
  };

  // Production-specific options
  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseOptions,
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
      heartbeatFrequencyMS: 10000,
      serverSelectionTimeoutMS: 10000,
    };
  }

  return baseOptions;
};

const connectDB = async () => {
  try {
    const options = getConnectionOptions();
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection state: ${conn.connection.readyState}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    // Retry connection in production
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Retrying MongoDB connection in 5 seconds...');
      setTimeout(() => {
        connectDB();
      }, 5000);
    } else {
      process.exit(1);
    }
  }
};

module.exports = { connectDB };