const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.argv[2];
    const password = process.argv[3];
    const fullName = process.argv[4] || 'System Administrator';

    if (!email || !password) {
      console.error('Usage: node createAdmin.js <email> <password> [fullName]');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.error('User with this email already exists');
      process.exit(1);
    }

    // Create admin user
    const admin = new User({
      fullName,
      email,
      phone: '00000000000', // Placeholder
      username: email.split('@')[0] + '_admin',
      password,
      role: 'admin',
      status: 'approved',
      isEmailVerified: true
    });

    await admin.save();
    console.log('✅ Admin user created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Status: ${admin.status}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();