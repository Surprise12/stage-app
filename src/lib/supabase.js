// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
// These are set in your .env file or Vercel environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  console.error('Get these from: https://app.supabase.com -> Project Settings -> API')
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage, // Explicitly use localStorage for session persistence
    storageKey: 'supabase.auth.token' // Key used for storing the session
  }
})

// Optional: Log the configuration (remove in production)
console.log('🔑 Supabase configured:', {
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  anonKey: supabaseAnonKey ? '✅ Set' : '❌ Missing'
})