# Fix Pricing Page - Quick Guide

## The Problem
Your pricing page shows errors because Stripe Price IDs are not configured. Currently you have placeholders:
- `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_xxxxx`
- `NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_xxxxx`

## Quick Fix Steps

### Step 1: Get Your Stripe Price IDs

1. **Go to Stripe Dashboard (Test Mode)**
   - Visit: https://dashboard.stripe.com/test/products
   - Make sure you're in **Test mode** (toggle in top right corner)

2. **Create Products with Prices** (if you haven't already)

   **Monthly Plan:**
   - Click "+ Add product"
   - Name: "Monthly Plan" or "SnapHabit Monthly"
   - Set Price: $9.99 USD
   - Billing period: **Monthly**
   - Click "Save product"
   - **Copy the Price ID** (it looks like `price_1ABC123...`)

   **Yearly Plan:**
   - Click "+ Add product" (or add another price to the same product)
   - Name: "Yearly Plan" or "SnapHabit Yearly"
   - Set Price: $99.99 USD
   - Billing period: **Yearly** or **Annual**
   - Click "Save product"
   - **Copy the Price ID** (it looks like `price_1XYZ789...`)

3. **How to Find Price ID:**
   - Click on your product
   - Scroll to "Pricing" section
   - You'll see prices listed
   - Click the **three dots (⋯)** next to the price
   - Select **"Copy price ID"**

### Step 2: Update .env.local

Open `.env.local` in your project root and replace the placeholder values:

```bash
# Replace these placeholder values:
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_xxxxx

# With your actual Price IDs:
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_1ABC123xyz...
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_1XYZ789abc...
```

**Example:**
```bash
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_1SX9pK3toYhZwQmwL2sTzSfB
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_1ZxCvBnMaSdFgHj
```

⚠️ **Important:**
- Use **Price IDs** (starts with `price_`), NOT Product IDs (starts with `prod_`)
- No quotes around the values
- No spaces around the `=` sign
- Must be in **Test mode** for development

### Step 3: Restart Your Dev Server

Environment variables only load when the server starts:

1. Stop your dev server (press `Ctrl+C` in terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 4: Verify It Works

1. Go to: http://localhost:3000/pricing
2. The error messages should be gone
3. You should see "Subscribe Monthly" and "Subscribe Yearly" buttons instead of warnings

## Troubleshooting

**Still seeing errors?**
- ✅ Make sure you restarted the dev server after updating .env.local
- ✅ Check that Price IDs start with `price_` (not `prod_`)
- ✅ Verify you're using Test mode Price IDs (not Live mode)
- ✅ Make sure there are no typos in the Price IDs
- ✅ Check the browser console for detailed error messages

**Can't find Price IDs in Stripe?**
- Make sure you created a **price**, not just a product
- Products don't have Price IDs - only prices do
- Prices are in the "Pricing" section of the product page
- If you only see a Product ID, add a price to the product

## Current Status

✅ Pricing page is now **public** (can be viewed without login)
✅ You just need to add real Stripe Price IDs to make it fully functional

