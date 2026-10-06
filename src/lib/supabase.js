import { createClient } from '@supabase/supabase-js'

const viteEnv = import.meta.env || {}
const nodeEnv = typeof process !== 'undefined' ? process.env : {}
const url = viteEnv.VITE_SUPABASE_URL || nodeEnv.VITE_SUPABASE_URL
const key = viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY || nodeEnv.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && key)
export const supabase = isSupabaseConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null
