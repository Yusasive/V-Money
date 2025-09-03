// Script to create an admin user manually
const { createUser } = require("./models/User");
require("dotenv").config();

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node createAdmin.js <email> <password>");
  process.exit(1);
}

(async () => {
  try {
    const { user, error } = await createUser(email, password, "admin");
    if (error) {
      console.error("Error creating admin user:", error.message);
      process.exit(1);
    }
    console.log("Admin user created successfully:", user);
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin user:", err);
    process.exit(1);
  }
})();
