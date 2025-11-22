# Fix Stripe Payment Redirect Issue

## Problem
After making payment, the app is not redirecting to the dashboard and shows "STRIPE_SECRET_KEY is not set" error.

## Solutions

### 1. Fix Environment Variable (DONE ✅)
The `STRIPE_SECRET_KEY` is now on a single line in `.env.local`.

**Next Step:** Restart your dev server:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Configure Stripe Pricing Table Redirect

The Stripe Pricing Table redirects are configured in the **Stripe Dashboard**, not in code.

**Steps:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/pricing-tables)
2. Click on your pricing table: `prctbl_1SW6axB6iq8lnF9RsMVZKazd`
3. Go to **Settings** → **Checkout**
4. Set **Success URL** to:
   ```
   http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}
   ```
5. Set **Cancel URL** to:
   ```
   http://localhost:3000/pricing?canceled=true
   ```
6. **Save** the changes

### 3. For Production
When deploying, update the Success URL to:
```
https://yourdomain.com/dashboard?session_id={CHECKOUT_SESSION_ID}
```

## Verify It's Working

1. **Restart dev server** (to load environment variables)
2. **Go to** `/pricing`
3. **Click Subscribe** on the pricing table
4. **Use test card**: `4242 4242 4242 4242`
5. **Complete checkout**
6. **Should redirect** to `/dashboard?session_id=cs_test_...`

## Troubleshooting

### Still seeing "STRIPE_SECRET_KEY is not set"?
- ✅ Check `.env.local` has `STRIPE_SECRET_KEY=sk_test_...` on ONE line
- ✅ Restart dev server completely (stop and start)
- ✅ Check console for the exact error location

### Not redirecting after payment?
- ✅ Check Stripe Dashboard pricing table settings
- ✅ Verify Success URL is set correctly
- ✅ Check browser console for errors
- ✅ Try clearing browser cache

### Payment succeeds but dashboard shows error?
- ✅ Check webhook is configured (optional for now)
- ✅ Verify subscription was created in Stripe Dashboard
- ✅ Check database `subscriptions` table has the record

