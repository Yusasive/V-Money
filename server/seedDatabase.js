const { createContent } = require("./models/Content");
const seedData = require("./seedData");
require("dotenv").config();

const seedDatabase = async () => {
  try {
    // Clear existing content in Supabase
    // (You may want to implement a deleteAllContent function if needed)
    // Insert seed data
    const contentPromises = Object.values(seedData).map(async (sectionData) => {
      const { data, error } = await createContent(sectionData);
      if (error) {
        console.error("Error inserting content:", error);
      }
      return data;
    });

    await Promise.all(contentPromises);
    console.log("Seed data inserted successfully");
    console.log("Database seeding completed");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
