# ⚠️ IMPORTANT: Restart Your Dev Server

## The Problem
You're getting `STRIPE_SECRET_KEY is not set` even though it's in `.env.local`.

## Why This Happens
**Next.js only loads environment variables when the server starts!**

If you:
- ✅ Added `STRIPE_SECRET_KEY` to `.env.local` 
- ✅ Fixed the key to be on one line
- ❌ But DIDN'T restart the server

Then the environment variable **won't be loaded** and you'll still get the error.

## ✅ Solution: Restart Your Dev Server

### Step 1: Stop the Current Server
1. Go to the terminal where `npm run dev` is running
2. Press **`Ctrl+C`** to stop the server
3. Wait for it to fully stop

### Step 2: Start It Again
```bash
npm run dev
```

### Step 3: Verify It's Working
1. Check the terminal output - you should see:
   ```
   ✓ Compiled successfully
   ```

2. Open your browser and go to `/dashboard` or `/pricing`
3. The error should be gone! ✅

## 🔍 Verify Your .env.local File

The key should be on **ONE line** like this:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
```

**NOT** split across multiple lines:
```env
# ❌ WRONG - Don't do this!
STRIPE_SECRET_KEY=sk_test_51SVyqSB6iq8lnF9RitJa8gWoQqx5x2B1SAFJNLVyE8jQjy1sARp
CtaIJ2Swesh3bJKyuSWunZRVl9v1UcwJMDpTn0075NvOefw
```

## 📝 Quick Checklist

- [ ] `STRIPE_SECRET_KEY` is in `.env.local`
- [ ] The key is on a **single line** (125 characters)
- [ ] **Stopped** the dev server (Ctrl+C)
- [ ] **Restarted** the dev server (`npm run dev`)
- [ ] No errors in terminal
- [ ] Dashboard/pricing page loads without error

## 💡 Remember

**Every time you change `.env.local`, you MUST restart the dev server!**

This is a Next.js limitation - environment variables are only loaded at startup.

