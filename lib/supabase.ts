// Supabase configuration and initialization
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Supabase config - will be loaded from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmpkjvbtfhdaaaiueqxa.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.')
}

// Create Supabase client
let supabase: SupabaseClient | undefined

if (typeof window !== 'undefined') {
  // Use createBrowserClient from @supabase/ssr to ensure cookies are used
  supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Suppress token refresh errors - they're handled automatically
      flowType: 'pkce'
    }
  })
}

// Export Supabase client
export { supabase }

// Helper function to get Supabase client safely
export function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('Supabase can only be used on the client side')
  }
  if (!supabase) {
    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabase
}

// Helper to get current user
export async function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  return user
}

