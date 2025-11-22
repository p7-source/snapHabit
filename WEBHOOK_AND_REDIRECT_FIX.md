# Fix: Payment Recording & Redirect Issues

## ✅ Changes Made

### 1. Fixed Webhook Handler
- ✅ Created server-side Supabase client for webhooks
- ✅ Added extensive logging to debug issues
- ✅ Improved error handling to see why payments aren't recorded
- ✅ Added detailed error messages

### 2. Fixed Redirect
- ✅ Changed redirect back to `/dashboard` (instead of `/upload`)
- ✅ Updated pricing page redirect
- ✅ Updated checkout session API redirect

## 🔧 Webhook Setup Required

For payments to be recorded in Supabase, you need to set up Stripe webhooks:

### Option 1: Use Stripe CLI (for local testing)
```bash
# Install Stripe CLI (if not already installed)
# Then run:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook secret (starts with `whsec_`). Add it to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Option 2: Configure in Stripe Dashboard (for production)

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter your endpoint URL:
   - Local: `http://localhost:3000/api/webhooks/stripe` (use Stripe CLI)
   - Production: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`

## 🧪 Testing

### Test Webhook Locally:

1. **Start Stripe CLI** (in a separate terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **Copy the webhook secret** from the output and add to `.env.local`

3. **Restart your dev server**:
   ```bash
   npm run dev
   ```

4. **Make a test payment**:
   - Go to `/pricing`
   - Click "Subscribe"
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout

5. **Check the logs**:
   - Stripe CLI terminal will show webhook events
   - Your dev server console will show webhook processing logs
   - Check Supabase `subscriptions` table for the new record

## 📝 Redirect Configuration

**IMPORTANT:** Update Stripe Pricing Table redirect in Stripe Dashboard:

1. Go to [Stripe Dashboard → Pricing Tables](https://dashboard.stripe.com/test/pricing-tables)
2. Click your pricing table: `prctbl_1SW6axB6iq8lnF9RsMVZKazd`
3. **Settings** → **Checkout**
4. Set **Success URL** to:
   ```
   http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}
   ```
5. **Save** changes

## 🐛 Troubleshooting

### Payments not recorded in Supabase:

1. **Check webhook secret is set**:
   ```bash
   # Should show the secret (starts with whsec_)
   Get-Content .env.local | Select-String "STRIPE_WEBHOOK_SECRET"
   ```

2. **Check webhook is receiving events**:
   - Stripe CLI should show events when payment is made
   - Check dev server console for webhook logs

3. **Check Supabase table exists**:
   - Run `supabase-subscriptions.sql` in Supabase SQL Editor
   - Verify `subscriptions` table exists

4. **Check RLS policies**:
   - Make sure RLS policies allow inserts/updates
   - See `supabase-subscriptions.sql` for correct policies

### Redirect not working:

1. **Check Stripe Dashboard configuration**:
   - Success URL must be set in Pricing Table settings
   - Must include `{CHECKOUT_SESSION_ID}` placeholder

2. **Check browser console**:
   - Look for redirect logs
   - Check for JavaScript errors

3. **Check URL parameters**:
   - After payment, URL should have `?session_id=cs_test_...`
   - Pricing page should detect this and redirect

## 📊 What Gets Recorded

When a payment is successful, the webhook records:
- `user_id` - Clerk user ID
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID
- `stripe_price_id` - Price ID
- `stripe_current_period_end` - Subscription end date
- `status` - Subscription status (e.g., "active")
- `created_at` / `updated_at` - Timestamps

