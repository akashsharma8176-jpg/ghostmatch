import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This 'if' block is a developer's best friend. 
// It will print a clear message to your console if the keys are missing.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 AUDIT ALERT: Supabase keys are missing! Check your .env.local file location and variable names.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)