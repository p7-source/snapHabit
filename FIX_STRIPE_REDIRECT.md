# Fix: Stripe Redirect Not Working

## 🔍 The Problem

The redirect after payment isn't working. This is because **Stripe Pricing Table** creates checkout sessions automatically and uses the Success URL configured in **Stripe Dashboard**, NOT in your code.

## ✅ Solution 1: Configure Stripe Dashboard (REQUIRED)

**This is the PRIMARY solution** - you MUST do this:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/pricing-tables
2. **Click your pricing table**: `prctbl_1SW6axB6iq8lnF9RsMVZKazd`
3. **Click "Edit" or "Settings"**
4. **Find "Success URL" or "Redirect URL" field**
5. **Set it to**:
   ```
   http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}
   ```
6. **Save**

**IMPORTANT**: The `{CHECKOUT_SESSION_ID}` placeholder is REQUIRED - Stripe will replace it with the actual session ID.

## ✅ Solution 2: Enhanced Event Handling (Already Implemented)

I've updated `app/pricing/page.tsx` to:
- ✅ Listen for multiple Stripe events
- ✅ Handle `session_id` in URL parameters
- ✅ Listen for postMessage events from Stripe iframe
- ✅ Store pending checkout sessions
- ✅ Redirect immediately when session_id is detected

## 🧪 Testing Steps

1. **First, configure Stripe Dashboard** (Solution 1 above)
2. **Go to**: `http://localhost:3000/pricing`
3. **Click "Subscribe"**
4. **Complete payment** with test card: `4242 4242 4242 4242`
5. **Check browser console** for logs:
   - `🔍 Pricing page loaded, checking URL params`
   - `✅ Checkout successful (session_id in URL)`
   - `✅ Checkout session completed, session_id: cs_test_...`
6. **Should redirect to**: `/dashboard?session_id=cs_test_...`

## 🔍 Debugging

If it's still not working:

1. **Check browser console** - look for:
   - Any error messages
   - Event logs from Stripe
   - Redirect attempts

2. **Check Network tab** - look for:
   - Requests to `checkout.stripe.com`
   - Redirect responses

3. **Check Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/test/payments
   - Look for recent test payments
   - Check if they're marked as "Succeeded"

4. **Verify Success URL in Dashboard**:
   - Go back to pricing table settings
   - Confirm Success URL is exactly: `http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}`

## 🚨 Common Issues

### Issue 1: Success URL not configured in Dashboard
**Symptom**: Redirects to Stripe's default success page or pricing page
**Fix**: Configure Success URL in Stripe Dashboard (Solution 1)

### Issue 2: Wrong URL format
**Symptom**: Redirect doesn't work or goes to wrong page
**Fix**: Must be exactly: `http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}`
- ✅ Include `http://`
- ✅ Include `?session_id={CHECKOUT_SESSION_ID}`
- ❌ Don't use `https://` for localhost
- ❌ Don't forget the placeholder

### Issue 3: Dashboard not detecting session_id
**Symptom**: Redirects to dashboard but subscription not updated
**Fix**: Check `app/dashboard/page.tsx` - it should detect `session_id` and refresh

### Issue 4: Webhook not recording payment
**Symptom**: Payment succeeds but not in Supabase
**Fix**: Check webhook endpoint `/api/webhooks/stripe` is working

## 📝 What Happens Now

1. **User clicks "Subscribe"** → Stripe Checkout opens
2. **User completes payment** → Stripe processes payment
3. **Stripe redirects** to Success URL from Dashboard config
4. **Success URL**: `/dashboard?session_id=cs_test_...`
5. **Dashboard detects** `session_id` in URL
6. **Dashboard refreshes** subscription status after 2 seconds
7. **Webhook also records** payment in Supabase
8. **User sees** dashboard with active subscription ✅

## 🔗 Next Steps

1. **Configure Stripe Dashboard** (if not done)
2. **Test the flow** end-to-end
3. **Check browser console** for any errors
4. **Verify webhook** is receiving events
5. **Check Supabase** `subscriptions` table for new records

