const mongoose = require('mongoose');
const Content = require('../models/Content');
const seedData = require('../seedData');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing content
    await Content.deleteMany({});
    console.log('Cleared existing content');

    // Insert seed data
    const contentPromises = Object.values(seedData).map(async (sectionData) => {
      const content = new Content(sectionData);
      return await content.save();
    });

    await Promise.all(contentPromises);
    console.log('✅ Seed data inserted successfully');

    // Show what was inserted
    const insertedContent = await Content.find({}).select('section title');
    console.log('Inserted sections:');
    insertedContent.forEach(content => {
      console.log(`- ${content.section}: ${content.title}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;