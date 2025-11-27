# How to Add Stripe Price IDs to .env.local

## Current Issue
The Price ID variables are **NOT** in your `.env.local` file.

## What You Need to Add

Open your `.env.local` file and add these two lines:

```bash
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_xxxxx
```

**Replace `price_xxxxx` with your actual Price IDs from Stripe.**

## How to Get Price IDs from Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
2. Click on your product
3. In the **Pricing** section, you'll see prices listed
4. Each price has an ID that starts with `price_` (NOT `prod_`)
5. Copy the Price ID for:
   - Monthly plan → use for `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY`
   - Yearly plan → use for `NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY`

## Important Notes

- ✅ Price IDs start with `price_` (correct)
- ❌ Product IDs start with `prod_` (wrong - don't use this)
- ✅ Must have `NEXT_PUBLIC_` prefix (required for client-side)
- ✅ No quotes around the value
- ✅ No spaces around the `=` sign

## Example

```bash
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_1SX9pK3toYhZwQmwL2sTzSfB
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_1XYZ789abc123def456
```

## After Adding

1. **Save** `.env.local`
2. **Restart** your Next.js dev server:
   - Stop: Press `Ctrl+C` in the terminal running `npm run dev`
   - Start: Run `npm run dev` again
3. **Refresh** your browser
4. Check the browser console (F12) - you should see the Price IDs loaded

## Troubleshooting

If buttons are still disabled after adding variables:
1. Verify the variables are in `.env.local` (not `.env`)
2. Make sure the dev server was restarted
3. Check browser console for the debug logs
4. Verify Price IDs start with `price_` not `prod_`



