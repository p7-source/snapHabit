import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type') // 'recovery' for password reset

  if (code && supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      // Redirect to login with error
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'invalid_token')
      return NextResponse.redirect(loginUrl)
    }

    // If it's a password recovery, redirect to reset password page
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/reset-password', request.url))
    }
  }

  // Default redirect to dashboard for OAuth
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

