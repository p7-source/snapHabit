# Subscription Paywall Debugging Guide

## Issue: User paid but still seeing paywall

You have a subscription record in the database:
- `user_id`: `user_35oA1jDhbHemAbiN3Wq4U5hclPu`
- `status`: `active`
- `stripe_subscription_id`: `sub_1SXrjF3toYhZwQmwgtF4IIyK`

## What I've Fixed

1. **Enhanced Logging**: Added detailed console logs throughout the subscription check process
2. **API Route Integration**: Changed `useSubscription` hook to use `/api/subscription-status` API route instead of direct database access
3. **Case-Insensitive Status Check**: Made status comparison case-insensitive

## How to Debug

### Step 1: Check Browser Console

When you log in, open the browser console and look for these log messages:

1. `🔍 useSubscription - Checking subscription for user: <user_id>`
2. `🔍 getSubscription - Looking for subscription with userId: <user_id>`
3. `🔍 getSubscription - Query result:` (shows if subscription was found)
4. `🔍 isSubscriptionActive - Checking subscription:` (shows status check)
5. `✅ Subscription is ACTIVE` or `❌ Subscription is NOT active`

### Step 2: Verify User ID Match

The most common issue is **user ID mismatch**. Check:

1. What Clerk user ID you're logged in with (check console log: `🔍 useSubscription - Checking subscription for user:`)
2. Does it match `user_35oA1jDhbHemAbiN3Wq4U5hclPu` exactly?

**Note**: Clerk user IDs look like `user_xxxxx`. Make sure they match exactly!

### Step 3: Check API Response

Open browser DevTools → Network tab → Look for `/api/subscription-status` request:

1. Check the response JSON
2. Look at `isActive` field - should be `true`
3. Check `status` field - should be `"active"`

### Step 4: Verify Database Record

Run this query in Supabase SQL Editor:

```sql
SELECT 
  id,
  user_id,
  status,
  stripe_subscription_id,
  stripe_current_period_end,
  updated_at
FROM subscriptions
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu';
```

**Check:**
- Does `status` exactly equal `'active'`? (no extra spaces, correct case)
- Does `user_id` match your Clerk user ID exactly?

### Step 5: Check Server Logs

Look at your Next.js server console logs. You should see:

```
📊 Subscription status check: {
  userId: 'user_35oA1jDhbHemAbiN3Wq4U5hclPu',
  hasSubscription: true,
  isActive: true,
  status: 'active',
  ...
}
```

## Common Issues & Fixes

### Issue 1: User ID Mismatch

**Symptom**: Console shows subscription not found
**Cause**: Clerk user ID doesn't match database `user_id`
**Fix**: Check which user ID you're logged in with vs what's in the database

### Issue 2: Status Field Issues

**Symptom**: Subscription found but `isActive` is false
**Cause**: Status field has extra whitespace or different case
**Fix**: Status check is now case-insensitive, but verify in database:
```sql
UPDATE subscriptions 
SET status = 'active' 
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu';
```

### Issue 3: RLS Blocking Query

**Symptom**: Query returns no results even though record exists
**Cause**: Row Level Security policy blocking access
**Fix**: The subscriptions table should have permissive policies (`USING (true)`), but verify:
```sql
SELECT * FROM pg_policies WHERE tablename = 'subscriptions';
```

## Quick Test

Run this API call manually (replace with your Clerk session):

```bash
curl http://localhost:3000/api/subscription-status \
  -H "Cookie: __session=<your-clerk-session-cookie>"
```

Or open in browser while logged in:
```
http://localhost:3000/api/subscription-status
```

Should return:
```json
{
  "hasSubscription": true,
  "isActive": true,
  "status": "active",
  "subscription": { ... }
}
```

## Next Steps

1. **Log in** with the email you used to pay
2. **Open browser console** and check the logs
3. **Share the console output** - especially:
   - What user ID is being checked
   - What the API response shows
   - Any error messages

This will help identify exactly where the issue is!

