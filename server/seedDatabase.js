const mongoose = require('mongoose');
const Content = require('./models/Content');
const seedData = require('./seedData');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
    console.log('Seed data inserted successfully');

    await mongoose.disconnect();
    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;