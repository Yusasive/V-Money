const { supabase } = require("../config/supabase");

// User management functions using Supabase
// Example: createUser, getUserByEmail, etc.

async function createUser(email, password, role = "admin") {
  // Use Supabase Admin API to create a user (requires service role key)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { role },
    email_confirm: true, // mark email as confirmed to allow immediate login
  });
  return { user: data?.user || null, error };
}

async function getUserByEmail(email) {
  // Query Supabase users table (if you have a custom table)
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
  return { data, error };
}

module.exports = {
  createUser,
  getUserByEmail,
};
