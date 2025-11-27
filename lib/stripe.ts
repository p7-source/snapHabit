import Stripe from 'stripe'
import { getSupabaseClient } from './supabase'
import { createClient } from '@supabase/supabase-js'

/**
 * Get server-side Supabase client for API routes
 */
function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmpkjvbtfhdaaaiueqxa.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ''
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or key is missing')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

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
 * Works on both client and server side
 */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  // Use server-side client if on server, otherwise use client-side
  const supabase = typeof window === 'undefined' 
    ? getSupabaseServerClient()
    : getSupabaseClient()
  
  const { data } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()
  
  return data?.stripe_customer_id || null
}

/**
 * Create or get Stripe customer for a user
 * Works on both client and server side
 * Verifies customer exists in Stripe before using it
 */
export async function createOrGetCustomer(userId: string, email: string): Promise<string> {
  // Use server-side client if on server, otherwise use client-side
  const supabase = typeof window === 'undefined' 
    ? getSupabaseServerClient()
    : getSupabaseClient()
  
  // Check if customer exists in database
  const existing = await getStripeCustomerId(userId)
  
  if (existing) {
    // Verify the customer actually exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(existing)
      
      // If customer was deleted, it will have deleted: true
      if (customer.deleted) {
        console.log('⚠️ Customer was deleted in Stripe, creating new one...')
        // Delete from database and create new
        await supabase
          .from('subscriptions')
          .update({ stripe_customer_id: null })
          .eq('user_id', userId)
      } else {
        // Customer exists and is valid, return it
        console.log('✅ Using existing Stripe customer:', existing)
        return existing
      }
    } catch (error: any) {
      // Customer doesn't exist in Stripe (error code: resource_missing)
      if (error.code === 'resource_missing' || error.message?.includes('No such customer')) {
        console.log('⚠️ Customer ID in database but not in Stripe, creating new one...')
        console.log('   Invalid customer ID:', existing)
        // Remove invalid customer ID from database
        await supabase
          .from('subscriptions')
          .update({ stripe_customer_id: null })
          .eq('user_id', userId)
      } else {
        // Some other error, rethrow it
        console.error('❌ Error retrieving customer from Stripe:', error)
        throw error
      }
    }
  }
  
  // Create new Stripe customer (either didn't exist or was invalid)
  console.log('🔄 Creating new Stripe customer for user:', userId)
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })
  
  console.log('✅ Created new Stripe customer:', customer.id)
  
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
 * Works on both client and server side
 */
export async function getSubscription(userId: string) {
  // Use server-side client if on server, otherwise use client-side
  const supabase = typeof window === 'undefined' 
    ? getSupabaseServerClient()
    : getSupabaseClient()
  
  console.log('🔍 getSubscription - Looking for subscription with userId:', userId)
  console.log('🔍 getSubscription - UserId type:', typeof userId)
  console.log('🔍 getSubscription - UserId length:', userId?.length)
  
  // Use maybeSingle() to return null instead of error when no subscription found
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  
  // Log detailed information about the query
  console.log('🔍 getSubscription - Query result:', {
    hasData: !!data,
    hasError: !!error,
    errorCode: error?.code,
    errorMessage: error?.message,
    subscriptionData: data ? {
      id: data.id,
      user_id: data.user_id,
      status: data.status,
      stripe_subscription_id: data.stripe_subscription_id,
    } : null
  })
  
  // If error occurred and it's not "no rows found", log it
  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error fetching subscription:', error)
  }
  
  // Return null if no subscription found (which is expected for new users)
  if (!data) {
    console.log('⚠️ No subscription found for userId:', userId)
  } else {
    console.log('✅ Subscription found:', {
      user_id: data.user_id,
      status: data.status,
      isActive: data.status === 'active'
    })
  }
  
  return data || null
}

/**
 * Check if subscription is active
 * Trusts Stripe's status field - if status is 'active', subscription is active
 */
export function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) {
    console.log('🔍 isSubscriptionActive - No subscription provided')
    return false
  }
  
  // Lifetime purchases are always active (never expire)
  if (subscription.is_lifetime === true) {
    console.log('✅ Subscription is ACTIVE (Lifetime)')
    return true
  }
  
  const status = subscription.status
  
  console.log('🔍 isSubscriptionActive - Checking subscription:', {
    status,
    statusType: typeof status,
    statusValue: JSON.stringify(status),
    subscriptionId: subscription.stripe_subscription_id,
    userId: subscription.user_id,
    is_lifetime: subscription.is_lifetime
  })
  
  // Stripe subscription statuses that indicate an active subscription
  // 'active' = subscription is active and in good standing
  // 'trialing' = subscription is in trial period (treat as active)
  // 'past_due' = payment failed but still active (could treat as active or inactive)
  // For now, we'll only treat 'active' as truly active
  
  // Use strict equality and handle case sensitivity
  const normalizedStatus = String(status).toLowerCase().trim()
  
  if (normalizedStatus === 'active') {
    console.log('✅ Subscription is ACTIVE')
    return true
  }
  
  // All other statuses (canceled, incomplete, incomplete_expired, past_due, trialing, unpaid)
  // are considered inactive for our purposes
  console.log('❌ Subscription is NOT active. Status:', normalizedStatus)
  return false
}

