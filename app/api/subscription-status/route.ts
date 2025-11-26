import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSubscription, isSubscriptionActive } from '@/lib/stripe'

/**
 * Simple API endpoint to check subscription status
 * Used by client to poll subscription status after payment
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const subscription = await getSubscription(userId)
    const isActive = isSubscriptionActive(subscription)
    
    // Log for debugging with full subscription object
    console.log('📊 Subscription status check:', {
      userId,
      hasSubscription: !!subscription,
      isActive,
      status: subscription?.status || 'none',
      statusType: typeof subscription?.status,
      subscriptionId: subscription?.stripe_subscription_id || 'none',
      periodEnd: subscription?.stripe_current_period_end || 'not set',
      fullSubscription: subscription ? JSON.stringify(subscription, null, 2) : 'none'
    })
    
    return NextResponse.json({
      hasSubscription: !!subscription,
      isActive,
      status: subscription?.status || null,
      subscription: subscription || null
    })
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    )
  }
}


