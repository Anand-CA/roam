import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// The public anon key is safe to ship in a browser when Row Level Security is enabled.
// Never put service role keys or provider API keys in VITE_* variables.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
