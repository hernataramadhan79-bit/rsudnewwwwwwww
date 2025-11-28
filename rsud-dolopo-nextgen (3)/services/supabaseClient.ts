import { createClient } from '@supabase/supabase-js';

// Access environment variables using process.env which is handled by Vite's define config
// This prevents runtime errors if import.meta.env is undefined
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Create client with fallback values to prevent immediate crash, 
// but isSupabaseConfigured will return false if keys are missing.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = () => {
    return supabaseUrl !== '' && supabaseAnonKey !== '' && supabaseUrl !== 'undefined';
};