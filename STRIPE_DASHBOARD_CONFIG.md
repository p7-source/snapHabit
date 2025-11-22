# ⚠️ CRITICAL: Configure Stripe Dashboard for Redirect

## The Problem

The redirect isn't working because **Stripe Pricing Table redirects are controlled in Stripe Dashboard**, NOT in code!

## ✅ Solution: Configure Stripe Dashboard

You MUST configure the Success URL in your Stripe Pricing Table settings.

### Step-by-Step Instructions:

1. **Go to Stripe Dashboard**:
   - Visit: https://dashboard.stripe.com/test/pricing-tables
   - Make sure you're in **Test Mode** (toggle at top right)

2. **Open Your Pricing Table**:
   - Click on your pricing table: `prctbl_1SW7Nt3toYhZwQmwUk6q7lVs`
   - Or find it in the list of pricing tables

3. **Go to Settings**:
   - Click **"Settings"** tab (or **"Edit"** button)
   - Look for **"Checkout"** or **"Success URL"** section

4. **Set Success URL**:
   - Find the **"Success URL"** or **"Redirect URL after payment"** field
   - Enter exactly this (for local testing):
     ```
     http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}
     ```
   - **IMPORTANT:** 
     - Must include `{CHECKOUT_SESSION_ID}` placeholder
     - Must use `http://localhost:3000` for local testing
     - No trailing slash

5. **Set Cancel URL** (optional but recommended):
   - Enter:
     ```
     http://localhost:3000/pricing?canceled=true
     ```

6. **Save Changes**:
   - Click **"Save"** or **"Update"** button
   - Wait for confirmation

### For Production (when deploying):

Update the Success URL to:
```
https://yourdomain.com/dashboard?session_id={CHECKOUT_SESSION_ID}
```

## 🔍 How to Verify It's Configured

1. Go to your pricing table in Stripe Dashboard
2. Click "Settings" or "Edit"
3. Check the Success URL field
4. Should show: `http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}`

## 🧪 Test After Configuration

1. **Go to your app**: `http://localhost:3000/pricing`
2. **Click "Subscribe"** on the pricing table
3. **Complete checkout** with test card: `4242 4242 4242 4242`
4. **After payment**, you should be redirected to:
   ```
   http://localhost:3000/dashboard?session_id=cs_test_...
   ```

## ❌ Common Mistakes

1. **Missing `{CHECKOUT_SESSION_ID}` placeholder**
   - ❌ Wrong: `http://localhost:3000/dashboard`
   - ✅ Correct: `http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}`

2. **Wrong URL format**
   - ❌ Wrong: `localhost:3000/dashboard` (missing http://)
   - ✅ Correct: `http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}`

3. **Forgetting to save**
   - Make sure to click "Save" after changing the URL

4. **Using wrong mode**
   - Make sure you're editing the **Test Mode** pricing table
   - Or configure both Test and Live modes

## 📝 What Happens After Configuration

1. User clicks "Subscribe" → Stripe Checkout opens
2. User completes payment → Stripe redirects to Success URL
3. Success URL is: `/dashboard?session_id=cs_test_...`
4. Dashboard page loads and detects `session_id`
5. Dashboard refreshes subscription status after 2 seconds
6. User sees dashboard with active subscription ✅

## 🔗 Alternative: If Success URL Field Doesn't Exist

Some Stripe Pricing Tables might not have a Success URL field in settings. In that case:

1. **Check if you need to use Stripe Checkout Session instead**
2. **Or use the `customer-reference` attribute** on the pricing table element
3. **Or create a custom checkout flow** using the API

But for most pricing tables, the Success URL should be in Settings → Checkout section.

