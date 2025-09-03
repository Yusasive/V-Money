// Supabase client setup for Node.js backend
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role key
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // anon/public key
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseUser = createClient(supabaseUrl, supabaseAnonKey);

const authHelpers = {
  signUp: async (email, password, userData) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: { data: userData },
    });
  },

  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  resetPassword: async (email) => {
    return await supabase.auth.resetPasswordForEmail(email);
  },

  // Accept an access token to get the current user (server-side verification)
  getCurrentUser: async (accessToken) => {
    // Use supabaseUser client for user-level token verification
    const { data, error } = await supabaseUser.auth.getUser(accessToken);
    if (error) return { error };
    return { data: data.user };
  },

  isAdmin: (user) => {
    return (
      user?.user_metadata?.role === "admin" ||
      user?.app_metadata?.role === "admin"
    );
  },

  isStaff: (user) => {
    return (
      user?.user_metadata?.role === "staff" ||
      user?.app_metadata?.role === "staff"
    );
  },

  isAggregator: (user) => {
    return (
      user?.user_metadata?.role === "aggregator" ||
      user?.app_metadata?.role === "aggregator"
    );
  },

  getUserRole: (user) => {
    return user?.user_metadata?.role || user?.app_metadata?.role || "user";
  },
};

module.exports = { supabase, supabaseUser, authHelpers };
