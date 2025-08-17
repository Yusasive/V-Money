// Script to create an admin user manually
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node createAdmin.js <email> <password>");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    try {
      const existing = await User.findOne({ email });
      if (existing) {
        console.error("Admin with this email already exists.");
        process.exit(1);
      }
      const admin = new User({ email, password, role: "admin" });
      await admin.save();
      console.log("Admin user created successfully.");
      process.exit(0);
    } catch (err) {
      console.error("Error creating admin:", err);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });


