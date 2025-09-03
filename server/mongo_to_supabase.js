require("dotenv").config();
const { MongoClient } = require("mongodb");
const { createClient } = require("@supabase/supabase-js");

// Setup MongoDB
const mongoUri = process.env.MONGODB_URI;
const mongoClient = new MongoClient(mongoUri);

// Setup Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateCollection(mongoCollection, supabaseTable, transformFn) {
  const db = mongoClient.db();
  const docs = await db.collection(mongoCollection).find().toArray();
  for (const doc of docs) {
    const row = transformFn(doc);
    const { error } = await supabase.from(supabaseTable).insert([row]);
    if (error) {
      console.error(`Error inserting into ${supabaseTable}:`, error);
    }
  }
  console.log(
    `Migrated ${docs.length} records from ${mongoCollection} to ${supabaseTable}`
  );
}

function transformUser(doc) {
  // Supabase Auth migration is manual; for custom user table:
  return {
    email: doc.email,
    role: doc.role,
    // Add other fields as needed
  };
}

function transformContent(doc) {
  return {
    section: doc.section,
    title: doc.title,
    subtitle: doc.subtitle,
    description: doc.description,
    buttonText: doc.buttonText,
    buttonLink: doc.buttonLink,
    imageUrl: doc.imageUrl,
    features: doc.features,
    faqs: doc.faqs,
    testimonials: doc.testimonials,
    pricing: doc.pricing,
    // Add other fields as needed
  };
}

function transformFormSubmission(doc) {
  return {
    formType: doc.formType,
    data: doc.data,
    files: doc.files,
    status: doc.status,
    notes: doc.notes,
    // Add other fields as needed
  };
}

async function main() {
  await mongoClient.connect();
  await migrateCollection("users", "users", transformUser);
  await migrateCollection("content", "content", transformContent);
  await migrateCollection(
    "form_submissions",
    "form_submissions",
    transformFormSubmission
  );
  await mongoClient.close();
  console.log("Migration complete!");
}

main().catch(console.error);
