# Check Environment Variables

## Quick Check

Run this to verify your Stripe environment variables are set:

```bash
# Check if variables are in .env.local
Get-Content .env.local | Select-String -Pattern "STRIPE"
```

## Required Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...  # Optional if using pricing table
STRIPE_WEBHOOK_SECRET=whsec_...  # Optional for now
```

## Common Issues

1. **Variable not loaded:**
   - Restart your dev server: `npm run dev`
   - Make sure `.env.local` is in the project root
   - Check for typos in variable names

2. **Variable has extra spaces:**
   - Make sure there's no space around the `=` sign
   - Good: `STRIPE_SECRET_KEY=sk_test_...`
   - Bad: `STRIPE_SECRET_KEY = sk_test_...`

3. **Variable is commented out:**
   - Make sure the line doesn't start with `#`

## Verify It's Working

After adding variables, restart your dev server and check the console. You should NOT see the "STRIPE_SECRET_KEY is not set" error.

