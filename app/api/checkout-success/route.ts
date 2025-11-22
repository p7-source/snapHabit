import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { auth } from '@clerk/nextjs/server'

/**
 * Handle successful checkout redirect
 * This route retrieves the checkout session and redirects to dashboard
 * Per Stripe docs: https://docs.stripe.com/api/checkout/sessions/object#checkout_session_object-success_url
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      // No session ID, redirect to dashboard anyway
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // Verify the checkout session exists and is valid
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      
      console.log('✅ Checkout session retrieved:', {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer: session.customer,
        subscription: session.subscription
      })
      
      // Verify payment was successful
      if (session.payment_status === 'paid' || session.status === 'complete') {
        // Redirect to dashboard with session_id
        // The dashboard will handle refreshing subscription status
        return NextResponse.redirect(new URL(`/dashboard?session_id=${sessionId}`, req.url))
      } else {
        // Payment not completed yet, redirect to pricing
        console.warn('⚠️ Payment not completed yet:', session.payment_status)
        return NextResponse.redirect(new URL('/pricing?payment_pending=true', req.url))
      }
    } catch (error) {
      console.error('❌ Error retrieving checkout session:', error)
      // If we can't verify, redirect to dashboard anyway
      // The webhook will handle recording the payment
      return NextResponse.redirect(new URL(`/dashboard?session_id=${sessionId}`, req.url))
    }
  } catch (error) {
    console.error('❌ Error in checkout success handler:', error)
    // Fallback: redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
}

