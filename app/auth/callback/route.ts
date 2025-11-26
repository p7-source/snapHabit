// Clerk handles OAuth callbacks automatically, but we can use this route
// to record daily login after successful authentication
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Create server-side Supabase client
function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmpkjvbtfhdaaaiueqxa.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ''
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or key is missing')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      // No user, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Record daily login and initialize today's summary after OAuth login
    try {
      const { recordDailyLogin } = await import('@/lib/daily-logins')
      await recordDailyLogin(userId)
    } catch (err) {
      // Don't block OAuth login if daily login recording fails
      console.warn('Failed to record daily login:', err)
    }

    // Check if user has a profile
    try {
      const supabase = getSupabaseServerClient()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Error checking profile:', error)
        // If we can't check profile, redirect to onboarding to be safe
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // If profile exists, go to dashboard (subscription is optional)
      // If no profile, redirect to onboarding
      if (profile) {
        // User has profile - go to dashboard (subscription not required)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        // No profile - go to onboarding
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    } catch (error) {
      console.error('Error checking profile in auth callback:', error)
      // On error, redirect to onboarding to be safe
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  } catch (error) {
    console.error('Error in auth callback:', error)
    // Fallback: redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
