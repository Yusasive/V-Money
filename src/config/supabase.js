import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const authHelpers = {
  signUp: async (email, password, userData) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
  },

  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  resetPassword: async (email) => {
    return await supabase.auth.resetPasswordForEmail(email);
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  isAdmin: (user) => {
    return user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';
  },

  isStaff: (user) => {
    return user?.user_metadata?.role === 'staff' || user?.app_metadata?.role === 'staff';
  },

  isAggregator: (user) => {
    return user?.user_metadata?.role === 'aggregator' || user?.app_metadata?.role === 'aggregator';
  },

  getUserRole: (user) => {
    return user?.user_metadata?.role || user?.app_metadata?.role || 'user';
  }
};