import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check what environment variables are actually loaded
 */
export async function GET() {
  return NextResponse.json({
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'NOT SET',
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || 'NOT SET',
    fallbackPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'NOT SET',
    allStripeEnvVars: {
      NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'NOT SET',
      NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || 'NOT SET',
      NEXT_PUBLIC_STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'NOT SET',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET (hidden)' : 'NOT SET',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET (hidden)' : 'NOT SET',
    },
    nodeEnv: process.env.NODE_ENV,
  })
}

