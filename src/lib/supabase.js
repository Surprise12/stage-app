import { createClient } from '@supabase/supabase-js'

// REPLACE WITH YOUR ACTUAL SUPABASE CREDENTIALS
// Get these from: https://app.supabase.com -> Project Settings -> API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)