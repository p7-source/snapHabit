import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Create server-side Supabase client for webhooks
function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmpkjvbtfhdaaaiueqxa.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ''
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or key is missing')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET not configured' },
      { status: 500 }
    )
  }
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  const supabase = getSupabaseServerClient()
  
  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      
      console.log('📦 Received checkout.session.completed event')
      console.log('   Session ID:', session.id)
      console.log('   Customer ID:', session.customer)
      console.log('   Subscription:', session.subscription)
      console.log('   User ID from metadata:', userId)
      
      if (!userId) {
        console.error('❌ No userId in session metadata')
        break
      }
      
      if (!session.subscription) {
        console.error('❌ No subscription in session')
        break
      }
      
      try {
        // Get subscription details
        const subscriptionId = typeof session.subscription === 'string' 
          ? session.subscription 
          : (session.subscription as Stripe.Subscription).id
        
        console.log('🔍 Fetching subscription details:', subscriptionId)
        
        const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
        // Type assertion to handle Stripe SDK type
        const subscription = subscriptionResponse as any as Stripe.Subscription
        
        console.log('✅ Subscription retrieved:', {
          id: subscription.id,
          status: subscription.status,
          customer: subscription.customer,
          current_period_end: (subscription as any).current_period_end
        })
        
        const customerId = typeof session.customer === 'string' 
          ? session.customer 
          : (session.customer as Stripe.Customer).id
        
        const subscriptionData = {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price.id,
          stripe_current_period_end: (subscription as any).current_period_end 
            ? new Date((subscription as any).current_period_end * 1000).toISOString()
            : null,
          status: subscription.status,
          updated_at: new Date().toISOString(),
        }
        
        console.log('💾 Upserting subscription to database:', subscriptionData)
        
        // Update database with better error handling
        const { data, error } = await supabase
          .from('subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'user_id'
          })
          .select()
        
        if (error) {
          console.error('❌ Database error:', error)
          console.error('   Error code:', error.code)
          console.error('   Error message:', error.message)
          console.error('   Error details:', error.details)
          throw error
        }
        
        console.log('✅ Subscription saved to database:', data)
        console.log('✅ Subscription created for user:', userId)
      } catch (error) {
        console.error('❌ Error processing checkout.session.completed:', error)
        if (error instanceof Error) {
          console.error('   Error message:', error.message)
          console.error('   Error stack:', error.stack)
        }
      }
      break
    }
    
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      
      try {
        console.log('📦 Received subscription update event:', subscription.id, subscription.status)
        
        const { data, error } = await supabase
          .from('subscriptions')
          .update({
            stripe_current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
            status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
          .select()
        
        if (error) {
          console.error('❌ Database error updating subscription:', error)
          throw error
        }
        
        console.log('✅ Subscription updated:', subscription.id, subscription.status)
        console.log('   Updated data:', data)
      } catch (error) {
        console.error('❌ Error processing subscription update:', error)
        if (error instanceof Error) {
          console.error('   Error message:', error.message)
        }
      }
      break
    }
    
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
  
  return NextResponse.json({ received: true })
}

