import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseClient } from '@/lib/supabase'
import { getStripeCustomerId, createOrGetCustomer } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is not configured. Please add it to .env.local' },
        { status: 500 }
      )
    }

    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    
    if (!process.env.STRIPE_PRICE_ID) {
      return NextResponse.json(
        { error: 'STRIPE_PRICE_ID not configured' },
        { status: 500 }
      )
    }
    
    // Create or get Stripe customer
    let customerId = await getStripeCustomerId(userId)
    
    if (!customerId) {
      customerId = await createOrGetCustomer(userId, email)
    }
    
    // Get base URL - ensure it's properly formatted
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (req.headers.get('origin') || 'http://localhost:3000')
    
    // Ensure baseUrl doesn't have trailing slash
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    
    // Create checkout session with proper success_url
    // Per Stripe docs: https://docs.stripe.com/api/checkout/sessions/object#checkout_session_object-success_url
    // The {CHECKOUT_SESSION_ID} placeholder will be replaced by Stripe with the actual session ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      // Success URL with CHECKOUT_SESSION_ID placeholder (required by Stripe)
      success_url: `${cleanBaseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cleanBaseUrl}/pricing?canceled=true`,
      metadata: {
        userId,
      },
      // Allow promotion codes
      allow_promotion_codes: true,
    })
    
    console.log('✅ Checkout session created:', {
      id: session.id,
      url: session.url,
      success_url: session.success_url,
      status: session.status
    })
    
    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

