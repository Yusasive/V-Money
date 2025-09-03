const seedData = require("./seedData");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedContent() {
  const sections = Object.values(seedData);
  for (const sectionData of sections) {
    const { error } = await supabase.from("content").insert([sectionData]);
    if (error) {
      console.error("Error inserting content:", error);
    } else {
      console.log("Inserted section:", sectionData.section);
    }
  }
  console.log("Seeding complete!");
}

seedContent();
