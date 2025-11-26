# Paywall Bypass Logic - Complete Flow Explanation

## Overview
This document explains how the paywall system works - from payment to allowing users to bypass the paywall on subsequent logins.

---

## 🔄 Complete Flow: Payment → Paywall Bypass

### Step 1: User Makes Payment
**File:** `app/pricing/page.tsx`

1. User clicks "Subscribe" button
2. `handleSubscribe()` function creates a Stripe Checkout Session via `/api/create-checkout-session`
3. User is redirected to Stripe's hosted checkout page
4. After payment, Stripe redirects to `/pricing?session_id=xxx`

### Step 2: Stripe Webhook Processes Payment
**File:** `app/api/webhooks/stripe/route.ts`

When payment succeeds, Stripe sends a webhook event `checkout.session.completed`:

```typescript
case 'checkout.session.completed': {
  // 1. Extract userId from session metadata
  let userId = session.metadata?.userId
  
  // 2. Retrieve full subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  // 3. Save subscription to Supabase database
  const subscriptionData = {
    user_id: userId,                              // Links to Clerk user
    stripe_customer_id: customerId,               // Stripe customer ID
    stripe_subscription_id: subscription.id,      // Stripe subscription ID
    stripe_price_id: subscription.items.data[0]?.price.id,
    stripe_current_period_end: periodEndDate,     // When subscription expires
    status: subscription.status,                  // 'active', 'canceled', etc.
    updated_at: new Date().toISOString(),
  }
  
  // 4. Upsert to database (creates or updates existing record)
  await supabase
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'user_id'  // Updates if user_id already exists
    })
}
```

**Key Point:** The subscription is stored in the `subscriptions` table with:
- `user_id` → Links subscription to the Clerk user ID
- `status` → Set to `'active'` when payment succeeds
- `stripe_subscription_id` → Links to Stripe's subscription record

### Step 3: Subscription Status Check on Login
**File:** `lib/use-subscription.ts`

When user logs in, the `useSubscription()` hook automatically checks subscription status:

```typescript
export function useSubscription() {
  const { user } = useUser()  // Get Clerk user
  
  useEffect(() => {
    if (!user) return
    
    const checkSubscription = async () => {
      // 1. Fetch subscription from database
      const sub = await getSubscription(user.id)
      
      // 2. Check if subscription is active
      setIsActive(isSubscriptionActive(sub))
    }
    
    checkSubscription()
    
    // Refresh every 30 seconds (for subscription updates)
    const interval = setInterval(checkSubscription, 30000)
  }, [user])
  
  return { subscription, isActive, loading }
}
```

**Key Point:** This hook runs automatically on every page that uses it, checking the database for subscription status.

### Step 4: Subscription Lookup from Database
**File:** `lib/stripe.ts`

```typescript
export async function getSubscription(userId: string) {
  const supabase = getSupabaseClient()
  
  // Query subscriptions table by user_id
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)  // Match Clerk user ID
    .maybeSingle()  // Returns null if not found (doesn't throw error)
  
  return data || null
}
```

**Key Point:** Looks up subscription using the Clerk `user_id` (not Stripe customer ID).

### Step 5: Active Status Check
**File:** `lib/stripe.ts`

```typescript
export function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) return false
  
  // Simple check: if Stripe says status is 'active', subscription is active
  if (subscription.status === 'active') {
    return true
  }
  
  return false
}
```

**Key Point:** Trusts Stripe's `status` field. If `status === 'active'`, user has paid and subscription is valid.

### Step 6: Paywall Check on Protected Routes
**File:** `app/dashboard/page.tsx` and `app/upload/page-client.tsx`

Protected pages check subscription status before rendering:

```typescript
export default function DashboardPage() {
  // 1. Get subscription status (automatically checked by useSubscription hook)
  const { isActive: hasActiveSubscription, loading: subscriptionLoading } = useSubscription()
  
  // 2. Redirect to pricing if no active subscription
  useEffect(() => {
    if (user && !subscriptionLoading && !hasActiveSubscription) {
      router.push('/pricing?paywall=required')  // Redirect to paywall
    }
  }, [user, subscriptionLoading, hasActiveSubscription])
  
  // 3. Show loading while checking
  if (loading || subscriptionLoading) {
    return <Loader2 />  // Show spinner
  }
  
  // 4. Allow access if subscription is active
  if (!hasActiveSubscription) {
    return <RedirectToPricing />  // Blocked
  }
  
  // 5. Render dashboard (user has paid)
  return <Dashboard />
}
```

**Key Point:** If `hasActiveSubscription === true`, user bypasses paywall and sees the dashboard.

---

## 🗄️ Database Schema

The subscription is stored in Supabase `subscriptions` table:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,              -- Links to Clerk user ID
  stripe_customer_id TEXT,                   -- Stripe customer ID
  stripe_subscription_id TEXT,               -- Stripe subscription ID
  stripe_price_id TEXT,                      -- Monthly or yearly plan
  stripe_current_period_end TIMESTAMP,       -- When subscription expires
  status TEXT,                               -- 'active', 'canceled', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Column:** `user_id` is the Clerk user ID - this is how we link subscriptions to users.

---

## 🔐 How User ID Links Work

1. **During Checkout:**
   ```typescript
   // app/api/create-checkout-session/route.ts
   const session = await stripe.checkout.sessions.create({
     customer: customerId,
     metadata: {
       userId: userId,  // Clerk user ID stored in metadata
     },
     // ... other options
   })
   ```

2. **In Webhook:**
   ```typescript
   // app/api/webhooks/stripe/route.ts
   let userId = session.metadata?.userId  // Extract from metadata
   
   await supabase.from('subscriptions').upsert({
     user_id: userId,  // Save with Clerk user ID
     // ... other fields
   })
   ```

3. **On Login:**
   ```typescript
   // lib/use-subscription.ts
   const { user } = useUser()  // Get Clerk user
   const subscription = await getSubscription(user.id)  // Query by Clerk user ID
   ```

**Key Point:** The entire flow uses Clerk's `user.id` as the linking mechanism.

---

## ✅ Why It Works on Subsequent Logins

1. **Payment completed** → Webhook saves subscription with `status: 'active'` to database
2. **User logs out** → Subscription remains in database
3. **User logs in again** → `useSubscription()` hook runs automatically
4. **Hook queries database** → Finds subscription with `user_id = user.id` and `status = 'active'`
5. **`isSubscriptionActive()` returns true** → `hasActiveSubscription = true`
6. **Paywall check passes** → User bypasses paywall and sees dashboard

The subscription record persists in the database, so it's available on every login!

---

## 🔄 Subscription Status Updates

The subscription status is automatically updated when:

1. **Payment succeeds** → `checkout.session.completed` webhook → Sets `status: 'active'`
2. **Subscription renews** → `customer.subscription.updated` webhook → Updates `status` and `period_end`
3. **Subscription cancels** → `customer.subscription.deleted` webhook → Updates `status: 'canceled'`

**File:** `app/api/webhooks/stripe/route.ts` handles all these events.

---

## 📋 Summary

**Payment Flow:**
```
User pays → Stripe webhook → Database save (status: 'active')
```

**Login Flow:**
```
User logs in → useSubscription() hook → Query database → Check status → Bypass paywall if active
```

**Key Components:**
- **Database:** Stores subscription with `user_id` and `status`
- **useSubscription Hook:** Automatically checks status on login
- **isSubscriptionActive():** Returns `true` if `status === 'active'`
- **Paywall checks:** Redirect to `/pricing` if not active

The system is **database-driven** - once a subscription is saved with `status: 'active'`, users can always bypass the paywall until the subscription is canceled or expires.

