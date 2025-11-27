# How to Fix Stripe Price ID Configuration

## Current Issue
Your `.env.local` file contains placeholder values:
- `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_xxxxx` ❌
- `NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_xxxxx` ❌

## Step-by-Step Fix

### Step 1: Get Your Stripe Price IDs

1. **Go to Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/test/products
   - Make sure you're in **Test Mode** (toggle in top right)

2. **Find Your Products:**
   - You should see a list of products
   - If you don't have products yet, create them:
     - Click "Add product"
     - Set name (e.g., "Monthly Subscription")
     - Set price (e.g., $9.99)
     - Set billing period (Monthly or Yearly)
     - Click "Save product"

3. **Get the Price ID:**
   - Click on a product
   - Scroll down to the "Pricing" section
   - You'll see a **Price ID** that looks like: `price_1ABC123xyz789`
   - **Copy this ID** (it starts with `price_`)

4. **Repeat for Second Product:**
   - Get another Price ID for your yearly plan (or create a yearly product)

### Step 2: Update .env.local

1. **Open `.env.local` in your editor**

2. **Find these lines:**
   ```
   NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_xxxxx
   NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_xxxxx
   ```

3. **Replace with your real Price IDs:**
   ```
   NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_YOUR_ACTUAL_MONTHLY_ID
   NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_YOUR_ACTUAL_YEARLY_ID
   ```

   **Example:**
   ```
   NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_1QwErTyUiOpAsDf
   NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_1ZxCvBnMaSdFgHj
   ```

4. **Save the file**

### Step 3: Restart Dev Server

1. **Stop the server:**
   - Press `Ctrl+C` in the terminal where `npm run dev` is running

2. **Start again:**
   ```powershell
   npm run dev
   ```

3. **Clear browser cache (optional):**
   - Press `Ctrl+Shift+R` to hard refresh the page

### Step 4: Verify It Works

1. **Visit the pricing page:**
   - Go to: http://localhost:3000/pricing

2. **Check the page:**
   - ✅ Red error banner should be gone
   - ✅ Yellow error boxes should be gone
   - ✅ "Subscribe Monthly" and "Subscribe Yearly" buttons should be visible and clickable

3. **Test the API directly:**
   - Visit: http://localhost:3000/api/get-price-ids
   - You should see:
     ```json
     {
       "monthly": "price_YOUR_ID",
       "yearly": "price_YOUR_ID",
       "hasMonthly": true,
       "hasYearly": true,
       "message": null
     }
     ```

## Troubleshooting

### If buttons are still disabled:
1. Check that Price IDs start with `price_` (not `prod_`)
2. Make sure there are no extra spaces in `.env.local`
3. Restart the dev server
4. Run `.\verify-env.ps1` to check configuration

### If you only have one Price ID:
You can use the same Price ID for both:
```
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_YOUR_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_YOUR_ID
```

### If you don't have Price IDs yet:
1. Go to Stripe Dashboard → Products
2. Create a product with pricing
3. The Price ID will be generated automatically
4. Copy it and add to `.env.local`



