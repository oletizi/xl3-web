import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL is not configured. Please set it in your .env file.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is not configured. Please set it in your .env file.'
  );
}

// Create Supabase client with PKCE flow and session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use PKCE flow for enhanced security
    flowType: 'pkce',
    // Automatically refresh tokens before they expire
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session from URL (OAuth callback)
    detectSessionInUrl: true,
  },
});
