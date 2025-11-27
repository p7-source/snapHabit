# Testing Stripe Webhooks

## Quick Test

Run the test script:
```powershell
.\test-webhook.ps1
```

## Manual Testing Steps

### 1. Start Stripe CLI
```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Important:** Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

Then restart your dev server.

### 2. Make a Test Payment

1. Go to: http://localhost:3000/pricing
2. Click "Subscribe Monthly" or "Subscribe Yearly"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future expiry date, any CVC
5. Complete the payment

### 3. Check Webhook Logs

**In Stripe CLI terminal:**
- You should see: `checkout.session.completed` event
- Status should be `200 OK`

**In Next.js dev server terminal:**
- Look for: `📦 Received checkout.session.completed event`
- Look for: `✅ Subscription saved to database`
- Look for: `✅ Subscription created for user: user_xxxxx`

### 4. Verify Database

Check Supabase `subscriptions` table:
- Should have a new row with your user_id
- `status` should be `active`
- `stripe_subscription_id` should be populated

## Troubleshooting

### Webhook not receiving events

1. **Check Stripe CLI is running:**
   ```powershell
   Get-Process -Name "stripe"
   ```

2. **Check webhook secret:**
   - Must be in `.env.local` as `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
   - Must restart dev server after adding

3. **Check endpoint URL:**
   - Should be: `http://localhost:3000/api/webhooks/stripe`
   - Stripe CLI should show: `Ready! Your webhook signing secret is whsec_xxxxx`

### "Invalid signature" error

- Webhook secret doesn't match
- Get new secret from Stripe CLI
- Update `.env.local` and restart server

### "No userId found" error

- Check that `create-checkout-session` is passing `userId` in metadata
- Check server logs for: `metadata: { userId }`

### Database errors

- Check Supabase connection
- Verify `subscriptions` table exists
- Check RLS policies allow inserts

## Testing with Stripe Dashboard

You can also trigger test events from Stripe Dashboard:

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select event type: `checkout.session.completed`
5. Click "Send test webhook"

**Note:** For local testing, you MUST use Stripe CLI. Dashboard webhooks only work for deployed endpoints.

## Expected Webhook Flow

1. User completes payment → Stripe Checkout
2. Stripe sends `checkout.session.completed` event
3. Stripe CLI forwards to: `localhost:3000/api/webhooks/stripe`
4. Webhook handler:
   - Verifies signature
   - Extracts `userId` from metadata
   - Retrieves subscription details
   - Saves to Supabase `subscriptions` table
5. Client polls `/api/subscription-status` until active
6. User redirected to dashboard

## Webhook Events Handled

- ✅ `checkout.session.completed` - New subscription
- ✅ `customer.subscription.updated` - Subscription changed
- ✅ `customer.subscription.deleted` - Subscription canceled



