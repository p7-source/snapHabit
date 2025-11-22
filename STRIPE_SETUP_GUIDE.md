# Stripe Integration Setup Guide

## ✅ Implementation Complete!

All Stripe integration files have been created. Follow these steps to complete the setup:

## 📋 Setup Steps

### 1. Database Setup

Run the SQL script in Supabase SQL Editor:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `supabase-subscriptions.sql`
3. Click **Run**

This creates the `subscriptions` table to track user subscriptions.

### 2. Stripe Dashboard Setup

1. **Create a Product & Price:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
   - Click **Add Product**
   - Name: "SnapHabit Pro"
   - Pricing: Recurring → Monthly → $9.99 (or your price)
   - Click **Save**
   - Copy the **Price ID** (starts with `price_...`)

2. **Get API Keys:**
   - Go to **Developers** → **API keys**
   - Copy **Publishable key** (starts with `pk_test_...`)
   - Copy **Secret key** (starts with `sk_test_...`)

3. **Set up Webhook (for local testing):**
   - Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
   - Run: `stripe login`
   - Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Copy the webhook signing secret (starts with `whsec_...`)

### 3. Environment Variables

Add to `.env.local`:

```env
# Stripe Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: App URL (for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Test the Integration

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding** (in a separate terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Test the flow:**
   - Complete onboarding → Should redirect to `/pricing`
   - Click "Subscribe Now" → Opens Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout → Redirects to dashboard
   - Check Supabase `subscriptions` table → Should see subscription record

## 🧪 Test Cards

| Card Number | Result |
|------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |
| `4000 0025 0000 3155` | ⚠️ Requires authentication |

Use any future expiry date (e.g., `12/34`) and any 3-digit CVC (e.g., `123`).

## 📁 Files Created

- ✅ `supabase-subscriptions.sql` - Database schema
- ✅ `lib/stripe.ts` - Stripe utility functions
- ✅ `lib/use-subscription.ts` - React hook for subscription status
- ✅ `app/api/create-checkout-session/route.ts` - Checkout API
- ✅ `app/api/webhooks/stripe/route.ts` - Webhook handler
- ✅ `app/pricing/page.tsx` - Pricing/paywall page
- ✅ Updated `components/onboarding/OnboardingFlow.tsx` - Redirects to pricing
- ✅ Updated `app/dashboard/page.tsx` - Checks subscription status

## 🔄 User Flow

1. **User completes onboarding** → Redirected to `/pricing`
2. **User clicks "Subscribe Now"** → Stripe Checkout opens
3. **User completes payment** → Webhook updates database
4. **User redirected to dashboard** → Subscription check passes
5. **User can access dashboard** → Full access granted

## 🔒 Subscription Protection

The dashboard now checks subscription status:
- If no active subscription → Redirects to `/pricing`
- If subscription active → Allows access
- Automatically refreshes after successful checkout

## 🚀 Production Deployment

When ready for production:

1. **Switch to Live Mode:**
   - Get live API keys from Stripe Dashboard
   - Update `.env.local` with live keys
   - Create live product/price in Stripe
   - Update `STRIPE_PRICE_ID` to live price ID

2. **Set up Production Webhook:**
   - Go to Stripe Dashboard → **Developers** → **Webhooks**
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret
   - Update `STRIPE_WEBHOOK_SECRET` in production environment

3. **Update App URL:**
   - Set `NEXT_PUBLIC_APP_URL` to your production domain

## 🐛 Troubleshooting

### Checkout not working?
- Verify API keys are correct
- Check browser console for errors
- Ensure `STRIPE_PRICE_ID` is set correctly

### Webhook not firing?
- Make sure Stripe CLI is running for local testing
- Check webhook secret is correct
- Verify endpoint URL is accessible

### Subscription not updating?
- Check Supabase `subscriptions` table
- Verify webhook is receiving events
- Check Stripe Dashboard → Events for webhook delivery status

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe CLI Guide](https://stripe.com/docs/stripe-cli)

---

**Ready to test!** 🎉

