# Clerk Setup Troubleshooting

## Error: JWKS Key ID Mismatch

If you see this error:
```
Clerk: Handshake token verification failed: Unable to find a signing key in JWKS that matches the kid='...'
```

This means your Clerk API keys don't match the session token.

## ✅ Solution Steps

### Step 1: Get Correct Keys from Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application (or create a new one)
3. Go to **API Keys** (or **Developers** → **API Keys**)
4. Copy **both** keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Update .env.local

Make sure your `.env.local` file has the **correct** keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
```

**Important:**
- ✅ Keys must be from the **same Clerk application**
- ✅ No spaces around the `=` sign
- ✅ No quotes needed (unless the value has spaces)
- ✅ Make sure you copied the **entire** key (they're long)

### Step 3: Clear Browser Cookies

The error might be from an old session cookie. Clear your browser cookies:

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Cookies** → `http://localhost:3000`
4. Delete the `__session` cookie (or all cookies)
5. Refresh the page

### Step 4: Restart Dev Server

**CRITICAL:** Next.js only loads environment variables when the server starts!

1. **Stop the server**: Press `Ctrl+C` in the terminal
2. **Start it again**: Run `npm run dev`
3. **Clear browser cache** and refresh

### Step 5: Verify Keys Match

The instance ID in the error message should match your keys:

- Error shows: `kid='ins_35o8JifoQuZUkDhqDCOXb2eNUFV'`
- Available: `ins_35o7D9OcSuyPLqzGVnAQ9SR3VoG`

These are different, which means:
- ❌ Your keys are from a different Clerk application
- ❌ Or you mixed keys from different applications

**Fix:** Make sure both `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are from the **same** Clerk application.

## 🔍 Quick Verification

### Check if keys are loaded:

Add this temporarily to `app/layout.tsx` (remove after checking):

```typescript
console.log('Clerk Publishable Key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...')
```

If it shows `undefined`, the key isn't loaded (restart server).

### Check Clerk Dashboard:

1. Go to your Clerk Dashboard
2. Check the **instance ID** in the URL or settings
3. Make sure your keys match that instance

## 🚨 Common Mistakes

1. **Mixed keys from different apps**
   - Using publishable key from App A
   - Using secret key from App B
   - ❌ **Fix:** Use keys from the same app

2. **Wrong environment**
   - Using `pk_live_` keys in development
   - Using `pk_test_` keys in production
   - ⚠️ **Note:** For development, use `pk_test_` and `sk_test_`

3. **Keys not saved**
   - Added keys to `.env.local` but didn't restart server
   - ✅ **Fix:** Always restart after changing `.env.local`

4. **Typo in key**
   - Missing characters at the end
   - Extra spaces or quotes
   - ✅ **Fix:** Copy the entire key carefully

## 📝 Complete .env.local Template

```env
# Clerk Authentication (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Supabase Database (Still needed for data storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (For nutrition analysis)
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

## ✅ After Fixing

1. ✅ Restart dev server
2. ✅ Clear browser cookies
3. ✅ Visit `/login`
4. ✅ Try signing in/up
5. ✅ Should work without errors

## 🆘 Still Having Issues?

If the error persists after:
- ✅ Verifying keys are correct
- ✅ Restarting server
- ✅ Clearing cookies
- ✅ Using keys from the same Clerk app

Contact Clerk support: support@clerk.com

