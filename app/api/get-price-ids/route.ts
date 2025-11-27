import { NextResponse } from 'next/server'

/**
 * API route to get Price IDs
 * This is more reliable than client-side env vars
 */
export async function GET() {
  try {
    // Read directly from process.env (server-side)
    const monthlyPriceId = (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '').trim()
    const yearlyPriceId = (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '').trim()
    const lifetimePriceId = (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME || '').trim()
    
    // Check if values are placeholders
    const isPlaceholder = (value: string) => {
      if (!value || value === '') return true
      if (value.includes('xxxxx') || value.includes('xxx')) return true
      if (!value.startsWith('price_')) return true
      return false
    }
    
    const monthlyIsPlaceholder = isPlaceholder(monthlyPriceId)
    const yearlyIsPlaceholder = isPlaceholder(yearlyPriceId)
    const lifetimeIsPlaceholder = isPlaceholder(lifetimePriceId)
    
    // Detailed logging to help debug
    console.log('🔍 ========== Price IDs Debug ==========')
    console.log('Raw environment variables:')
    console.log('  NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY:', process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'NOT SET')
    console.log('  NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY:', process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || 'NOT SET')
    console.log('  NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME:', process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME || 'NOT SET')
    console.log('  NEXT_PUBLIC_STRIPE_PRICE_ID:', process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'NOT SET')
    console.log('After processing:')
    console.log('  monthlyPriceId:', monthlyPriceId || 'EMPTY')
    console.log('  yearlyPriceId:', yearlyPriceId || 'EMPTY')
    console.log('  lifetimePriceId:', lifetimePriceId || 'EMPTY')
    console.log('  monthlyIsPlaceholder:', monthlyIsPlaceholder)
    console.log('  yearlyIsPlaceholder:', yearlyIsPlaceholder)
    console.log('  lifetimeIsPlaceholder:', lifetimeIsPlaceholder)
    console.log('========================================')
    
    // Return response with all necessary fields
    const response = {
      monthly: monthlyPriceId,
      yearly: yearlyPriceId,
      lifetime: lifetimePriceId,
      hasMonthly: !!monthlyPriceId && !monthlyIsPlaceholder,
      hasYearly: !!yearlyPriceId && !yearlyIsPlaceholder,
      hasLifetime: !!lifetimePriceId && !lifetimeIsPlaceholder,
      monthlyIsPlaceholder,
      yearlyIsPlaceholder,
      lifetimeIsPlaceholder,
    }
    
    // Include helpful message if placeholders detected (but still return 200 OK)
    const message = (monthlyIsPlaceholder && yearlyIsPlaceholder && lifetimeIsPlaceholder) 
      ? 'Price IDs are not configured. Please add NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY, NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY, and NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME to .env.local with actual Price IDs from Stripe (format: price_xxxxx)'
      : null
    
    return NextResponse.json({
      ...response,
      message,
      error: message, // Also include as 'error' for backward compatibility
    }, { status: 200 }) // Always return 200 - the message is informational
  } catch (error) {
    console.error('❌ Error getting price IDs:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get price IDs',
        monthly: '',
        yearly: '',
        lifetime: '',
        hasMonthly: false,
        hasYearly: false,
        hasLifetime: false,
      },
      { status: 500 }
    )
  }
}

