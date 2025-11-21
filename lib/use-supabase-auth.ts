// Custom hook for Supabase auth state (replaces react-firebase-hooks)
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase'

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Get initial session - handle errors gracefully
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('⚠️ Auth session error (non-critical):', error.message)
        // Continue anyway - user might still be authenticated
      }
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((err) => {
      console.warn('⚠️ Auth session exception (non-critical):', err)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore TOKEN_REFRESHED errors - they're handled automatically
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return [user, loading] as const
}

