const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
// const { connectDB } = require("./db");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/content", require("./routes/content"));
app.use("/api/forms", require("./routes/forms"));
app.use("/api/upload", require("./routes/upload"));

// Default route (for testing deployment)
app.get("/", (req, res) => {
  res.send("✅ Server is running successfully!");
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

start();
