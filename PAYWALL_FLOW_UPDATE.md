# Paywall Flow Update

## ✅ Changes Made

### 1. Updated Onboarding → Pricing Flow
- **Already configured**: Onboarding already redirects to `/pricing` after profile save (line 153 in `OnboardingFlow.tsx`)

### 2. Updated Payment → Upload Flow
- **Pricing page** (`app/pricing/page.tsx`): Now redirects to `/upload` instead of `/dashboard` after successful payment
- **Checkout API** (`app/api/create-checkout-session/route.ts`): Success URL now points to `/upload`

## 📋 Complete User Flow

1. **User registers/logs in** → Redirects to `/onboarding`
2. **User completes onboarding** → Clicks "Save" → Redirects to `/pricing` (paywall)
3. **User makes payment** → Completes checkout → Redirects to `/upload` (image upload page)
4. **User uploads first meal** → Can use the app!

## ⚙️ Stripe Dashboard Configuration

**IMPORTANT:** You need to update the Stripe Pricing Table settings:

1. Go to [Stripe Dashboard → Pricing Tables](https://dashboard.stripe.com/test/pricing-tables)
2. Click on your pricing table: `prctbl_1SW6axB6iq8lnF9RsMVZKazd`
3. Go to **Settings** → **Checkout**
4. Update **Success URL** to:
   ```
   http://localhost:3000/upload?session_id={CHECKOUT_SESSION_ID}
   ```
5. **Save** the changes

### For Production
When deploying, update to:
```
https://yourdomain.com/upload?session_id={CHECKOUT_SESSION_ID}
```

## ✅ What's Working Now

- ✅ Onboarding redirects to pricing page
- ✅ Pricing page redirects to upload page after payment
- ✅ Checkout API uses upload page as success URL
- ✅ Middleware allows pricing page for authenticated users

## 🧪 Test the Flow

1. Register a new account
2. Complete onboarding (all 3 steps)
3. Click "Save" → Should redirect to `/pricing`
4. Click "Subscribe" on pricing table
5. Use test card: `4242 4242 4242 4242`
6. Complete payment → Should redirect to `/upload?session_id=cs_test_...`

## 📝 Notes

- The pricing page requires authentication (protected by middleware)
- Users with existing subscriptions can still access dashboard directly
- The "Already subscribed?" link on pricing page still goes to dashboard (for existing users)

