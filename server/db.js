const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    isConnected = true;
    console.log("[DB] Connected to MongoDB");
    return mongoose.connection;
  } catch (err) {
    console.error("[DB] Mongo connection error:", err.message);
    throw err;
  }
}

module.exports = connectDB;
