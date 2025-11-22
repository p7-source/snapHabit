import Stripe from 'stripe'
import { getSupabaseClient } from './supabase'

// Lazy initialization - only create Stripe instance when actually used
let stripeInstance: Stripe | null = null

/**
 * Get Stripe instance - creates it lazily on first access
 */
function getStripeInstance(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  // Get Stripe secret key from environment and clean it
  const rawKey = process.env.STRIPE_SECRET_KEY

  if (!rawKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set in environment variables. ' +
      'Please add it to .env.local and restart your dev server.\n' +
      'Make sure the key is on a single line without any line breaks.'
    )
  }

  // Clean up any whitespace, line breaks, or special characters
  const stripeSecretKey = rawKey.trim().replace(/\s+/g, '').replace(/[\r\n]+/g, '')

  if (!stripeSecretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is empty after cleaning. ' +
      'Please check your .env.local file - the key should be on a single line.'
    )
  }

  // Create Stripe instance
  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: '2025-11-17.clover',
    typescript: true,
  })

  return stripeInstance
}

// Export a proxy that creates the instance on first access
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    const instance = getStripeInstance()
    const value = (instance as any)[prop]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
  set(target, prop, value) {
    const instance = getStripeInstance()
    ;(instance as any)[prop] = value
    return true
  }
})

/**
 * Get Stripe customer ID for a user
 */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient()
  
  const { data } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()
  
  return data?.stripe_customer_id || null
}

/**
 * Create or get Stripe customer for a user
 */
export async function createOrGetCustomer(userId: string, email: string): Promise<string> {
  const supabase = getSupabaseClient()
  
  // Check if customer exists
  const existing = await getStripeCustomerId(userId)
  if (existing) return existing
  
  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })
  
  // Save to database
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customer.id,
    }, {
      onConflict: 'user_id',
    })
  
  return customer.id
}

/**
 * Get subscription for a user
 */
export async function getSubscription(userId: string) {
  const supabase = getSupabaseClient()
  
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return data
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) return false
  if (subscription.status !== 'active') return false
  if (subscription.stripe_current_period_end) {
    return new Date(subscription.stripe_current_period_end) > new Date()
  }
  return false
}

