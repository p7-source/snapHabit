// Clerk handles OAuth callbacks automatically, but we can use this route
// to record daily login after successful authentication
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    // Record daily login and initialize today's summary after OAuth login
    if (userId) {
      try {
        const { recordDailyLogin } = await import('@/lib/daily-logins')
        await recordDailyLogin(userId)
      } catch (err) {
        // Don't block OAuth login if daily login recording fails
        console.warn('Failed to record daily login:', err)
      }
    }
  } catch (error) {
    console.error('Error in auth callback:', error)
  }

  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
