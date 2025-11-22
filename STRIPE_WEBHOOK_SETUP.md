# Stripe Webhook Setup Guide

## 📋 What Events to Listen For

Your webhook handler (`app/api/webhooks/stripe/route.ts`) handles these events:

1. **`checkout.session.completed`** - When a customer completes payment
   - Records subscription in Supabase
   - Required for payments to be recorded

2. **`customer.subscription.updated`** - When subscription is updated (e.g., plan change)
   - Updates subscription status in Supabase

3. **`customer.subscription.deleted`** - When subscription is cancelled
   - Updates subscription status to cancelled

## 🔧 Setup Options

### Option 1: Local Development (Using Stripe CLI) - RECOMMENDED

**For testing on `localhost:3000`:**

1. **Install Stripe CLI** (if not already installed):
   ```bash
   # Windows: Download from https://github.com/stripe/stripe-cli/releases
   # Or use npm:
   npm install -g stripe-cli
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook secret** from the output:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

5. **Add to `.env.local`**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Option 2: Stripe Dashboard (For Production)

**For production deployment:**

1. **Go to Stripe Dashboard**:
   - Visit: https://dashboard.stripe.com/test/webhooks (Test Mode)
   - Or: https://dashboard.stripe.com/webhooks (Live Mode)

2. **Click "Add endpoint"** or **"Create endpoint"**

3. **Set Endpoint URL**:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
   - Replace `yourdomain.com` with your actual domain
   - For localhost testing, use Stripe CLI (Option 1)

4. **Select Events to Listen For**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

5. **Click "Add endpoint"**

6. **Copy the Signing Secret**:
   - Click on your webhook endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

7. **Add to Environment Variables**:
   - Production: Add to your hosting platform's environment variables
   - Local: Add to `.env.local`:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```

## 📝 Step-by-Step: Stripe Dashboard Setup

### Step 1: Navigate to Webhooks

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Make sure you're in **Test Mode** (toggle at top right)

### Step 2: Create Webhook Endpoint

1. Click **"+ Add endpoint"** button
2. Enter your endpoint URL:
   - **Local (use Stripe CLI instead)**: `http://localhost:3000/api/webhooks/stripe`
   - **Production**: `https://yourdomain.com/api/webhooks/stripe`

### Step 3: Select Events

Click **"Select events"** and check:

- ✅ **`checkout.session.completed`** (REQUIRED)
- ✅ **`customer.subscription.updated`** (Recommended)
- ✅ **`customer.subscription.deleted`** (Recommended)

Or click **"Select all events"** if you want to listen to everything.

### Step 4: Save and Get Secret

1. Click **"Add endpoint"**
2. Click on your newly created endpoint
3. Click **"Reveal"** next to **"Signing secret"**
4. Copy the secret (starts with `whsec_...`)

### Step 5: Add to Environment

Add to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 6: Restart Server

Restart your dev server for changes to take effect:
```bash
npm run dev
```

## 🧪 Testing the Webhook

### Test Locally (Using Stripe CLI):

1. **Start webhook forwarding** (in a separate terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **Trigger a test event**:
   ```bash
   stripe trigger checkout.session.completed
   ```

3. **Check your dev server console** for webhook logs:
   ```
   📦 Received checkout.session.completed event
   ✅ Subscription saved to database
   ```

### Test with Real Payment:

1. **Go to**: `http://localhost:3000/pricing`
2. **Click "Subscribe"**
3. **Complete payment** with test card: `4242 4242 4242 4242`
4. **Check Stripe CLI terminal** - should show webhook event
5. **Check dev server console** - should show processing logs
6. **Check Supabase** - should have new row in `subscriptions` table

## 🔍 Verify Webhook is Working

### Check 1: Webhook Secret is Set

```bash
# Windows PowerShell
Get-Content .env.local | Select-String "STRIPE_WEBHOOK_SECRET"
```

Should show:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Check 2: Webhook is Receiving Events

**Using Stripe CLI:**
- Terminal running `stripe listen` should show events

**Using Stripe Dashboard:**
- Go to: https://dashboard.stripe.com/test/webhooks
- Click your endpoint
- Check "Events" tab - should show recent events

### Check 3: Webhook Processing Logs

Check your dev server console for:
```
📦 Received checkout.session.completed event
   Session ID: cs_test_...
   User ID from metadata: user_...
✅ Subscription saved to database
```

### Check 4: Database Updated

Check Supabase `subscriptions` table:
- Should have new row with `status: 'active'`
- Should have `stripe_subscription_id` populated

## ⚠️ Important Notes

### For Local Development:

- **Use Stripe CLI** - Dashboard webhooks won't work with `localhost`
- **Keep Stripe CLI running** - `stripe listen` must be running while testing
- **Use Test Mode** - Make sure Stripe Dashboard is in Test Mode

### For Production:

- **Use Stripe Dashboard** - Set up webhook endpoint in Dashboard
- **Use HTTPS** - Webhook URL must be `https://` (not `http://`)
- **Keep webhook secret secure** - Never commit to git

### Webhook Secret:

- **Different for Test vs Live** - Each mode has its own secret
- **Different for each endpoint** - Each webhook endpoint has unique secret
- **If you change endpoint** - You'll get a new secret

## 🐛 Troubleshooting

### Webhook not receiving events?

1. **Check webhook secret is set**:
   ```bash
   echo $STRIPE_WEBHOOK_SECRET  # Linux/Mac
   # or
   echo %STRIPE_WEBHOOK_SECRET%  # Windows CMD
   ```

2. **Check Stripe CLI is running** (for local):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Check endpoint URL is correct**:
   - Local: `http://localhost:3000/api/webhooks/stripe`
   - Production: `https://yourdomain.com/api/webhooks/stripe`

4. **Check events are selected**:
   - Must include `checkout.session.completed`

### Webhook receiving but not processing?

1. **Check server logs** for errors
2. **Check Supabase connection** - Make sure `SUPABASE_SERVICE_ROLE_KEY` is set
3. **Check database schema** - Make sure `subscriptions` table exists

### "Invalid signature" error?

1. **Webhook secret is wrong** - Check `.env.local` has correct secret
2. **Secret from wrong mode** - Test secret won't work with Live mode
3. **Restart server** - Environment variables only load on startup

## 📋 Quick Checklist

- [ ] Stripe CLI installed (for local) OR Webhook endpoint created (for production)
- [ ] Webhook secret copied and added to `.env.local`
- [ ] Events selected: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Dev server restarted after adding webhook secret
- [ ] Stripe CLI running (if testing locally)
- [ ] Test payment completed
- [ ] Webhook events visible in Stripe Dashboard or CLI
- [ ] Subscription recorded in Supabase `subscriptions` table

## 🎯 Summary

**For Local Development:**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook secret and add to .env.local
```

**For Production:**
1. Create webhook endpoint in Stripe Dashboard
2. Set URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy webhook secret
5. Add to production environment variables

That's it! Your webhook is now configured. 🎉

