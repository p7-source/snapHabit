import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { createOrGetCustomer } from '@/lib/stripe'

/**
 * Create Stripe checkout session
 * Simplified: Always passes userId in metadata (no complex mapping)
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📦 Creating checkout session...')
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is not configured. Please add it to .env.local' },
        { status: 500 }
      )
    }

    console.log('✅ Stripe secret key found')
    
    const { userId } = await auth()
    console.log('👤 User ID:', userId)
    
    if (!userId) {
      console.error('❌ No user ID from auth')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    let requestBody
    try {
      requestBody = await req.json()
      console.log('📋 Request body:', { email: requestBody.email, priceId: requestBody.priceId })
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const { email, priceId } = requestBody
    
    if (!email || !priceId) {
      console.error('❌ Missing email or priceId:', { email: !!email, priceId: !!priceId })
      return NextResponse.json(
        { error: 'Email and priceId required' },
        { status: 400 }
      )
    }
    
    console.log('🔄 Creating or getting Stripe customer...')
    // Create or get Stripe customer (simple - userId always known)
    let customerId
    try {
      customerId = await createOrGetCustomer(userId, email)
      console.log('✅ Customer ID:', customerId)
    } catch (customerError) {
      console.error('❌ Error creating/getting customer:', customerError)
      throw customerError
    }
    
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (req.headers.get('origin') || 'http://localhost:3000')
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    
    // Validate Price ID format
    if (!priceId || !priceId.startsWith('price_')) {
      console.error('❌ Invalid Price ID format:', priceId)
      return NextResponse.json(
        { error: `Invalid Price ID format. Expected 'price_xxxxx', got: ${priceId || 'empty'}` },
        { status: 400 }
      )
    }
    
    // Check if this is a lifetime purchase (one-time payment)
    const lifetimePriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME || ''
    const isLifetimePrice = priceId === lifetimePriceId.trim()
    const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || ''
    const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || ''
    
    // Determine tier flags
    const isMonthly = priceId === monthlyPriceId.trim()
    const isYearly = priceId === yearlyPriceId.trim()
    
    console.log('💳 Creating Stripe checkout session...', {
      priceId,
      isLifetimePrice,
      isMonthly,
      isYearly,
      mode: isLifetimePrice ? 'payment' : 'subscription'
    })
    
    // Create checkout session with appropriate mode
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isLifetimePrice ? 'payment' : 'subscription', // One-time payment for lifetime, subscription for monthly/yearly
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Simple success URL - just go back to pricing page
      // Client will poll for subscription status
      success_url: `${cleanBaseUrl}/pricing?success=true`,
      cancel_url: `${cleanBaseUrl}/pricing?canceled=true`,
      // CRITICAL: Always pass userId and tier information in metadata
      metadata: {
        userId,
        priceId, // Store price ID for webhook processing
        isLifetime: isLifetimePrice ? 'true' : 'false',
        isMonthly: isMonthly ? 'true' : 'false',
        isYearly: isYearly ? 'true' : 'false',
      },
      allow_promotion_codes: true,
    })
    
    console.log('✅ Checkout session created:', {
      id: session.id,
      url: session.url,
      userId: userId
    })
    
    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    })
  } catch (error) {
    console.error('❌ ========== ERROR CREATING CHECKOUT SESSION ==========')
    console.error('Error type:', typeof error)
    console.error('Error:', error)
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to create checkout session'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      // Check for specific Stripe errors
      if (error.message.includes('No such price') || error.message.includes('No such Price')) {
        errorMessage = `Price ID not found in Stripe. Please verify it exists in your Stripe Dashboard.`
        statusCode = 400
      } else if (error.message.includes('No such customer')) {
        errorMessage = 'Customer record is invalid. Please try again - a new customer will be created automatically.'
        statusCode = 400
        console.error('   Customer ID issue - will be fixed on retry')
      } else if (error.message.includes('Invalid API Key') || error.message.includes('api_key')) {
        errorMessage = 'Invalid Stripe API key. Please check STRIPE_SECRET_KEY in .env.local'
        statusCode = 500
      } else if (error.message.includes('You must provide')) {
        errorMessage = error.message
        statusCode = 400
      } else if (error.message.includes('Supabase')) {
        errorMessage = `Database error: ${error.message}`
        statusCode = 500
      }
    } else if (typeof error === 'object' && error !== null) {
      // Stripe API errors are usually objects
      const stripeError = error as any
      if (stripeError.type) {
        errorMessage = `Stripe error: ${stripeError.message || stripeError.type}`
        console.error('   Stripe error details:', JSON.stringify(stripeError, null, 2))
        statusCode = 400
      } else {
        console.error('   Unknown error object:', JSON.stringify(error, null, 2))
      }
    }
    
    console.error('❌ Returning error response:', { error: errorMessage, status: statusCode })
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

