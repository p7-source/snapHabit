# How to Get Your Stripe Price IDs

## Quick Steps

### 1. Go to Stripe Dashboard
- Open: https://dashboard.stripe.com/test/products
- Make sure you're in **Test mode** (toggle in top right)

### 2. Create Products (if you don't have them)

**For Monthly Plan:**
1. Click "+ Add product"
2. Name: "Monthly Plan"
3. Description: (optional)
4. Pricing: 
   - Price: $9.99
   - Billing period: **Monthly**
5. Click "Save product"

**For Yearly Plan:**
1. Click "+ Add product" (or add price to same product)
2. Name: "Yearly Plan"  
3. Description: (optional)
4. Pricing:
   - Price: $99.99
   - Billing period: **Yearly** or **Annual**
5. Click "Save product"

### 3. Get the Price IDs

After creating prices:

1. Click on your product
2. Scroll to "Pricing" section
3. You'll see the prices listed
4. Each price has an ID that looks like: `price_1ABC123xyz...`
5. **Click the three dots (⋯) next to the price**
6. Select "Copy price ID"
7. Paste it somewhere safe

### 4. Update .env.local

Open `.env.local` and replace:

```bash
# OLD (placeholder - doesn't work):
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_xxxxx

# NEW (your actual Price IDs):
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_1ABC123xyz...
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_1XYZ789abc...
```

### 5. Restart Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

## Important Notes

- ✅ Price IDs start with `price_` (correct)
- ❌ Product IDs start with `prod_` (wrong - don't use)
- ✅ Must be in **Test mode** for development
- ✅ No quotes around the values
- ✅ No spaces around the `=` sign

## Example

If your Price ID is: `price_1SX9pK3toYhZwQmwL2sTzSfB`

Then in `.env.local`:
```
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_1SX9pK3toYhZwQmwL2sTzSfB
```

## Troubleshooting

**"Price ID not found" error:**
- Make sure Price ID exists in Stripe Dashboard
- Check you're using Test mode Price IDs (not Live mode)
- Verify the Price ID is correct (no typos)
- Make sure you restarted the dev server after updating .env.local

**Can't find Price ID:**
- Make sure you created a **price**, not just a product
- Prices are in the "Pricing" section of the product page
- If you only see Product ID, you need to add a price to the product


