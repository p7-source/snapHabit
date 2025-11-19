# Fix Login Streak Error

## Error Message
```
Error fetching login streak: {}
```

## Root Cause
The `daily_logins` table doesn't exist in your Supabase database yet. The error object is empty because Supabase returns a generic error when querying a non-existent table.

## Solution

### Step 1: Create the Table
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of `supabase-daily-logins.sql`
3. Paste it into the SQL Editor
4. Click **"Run"** to execute

### Step 2: Verify Table Creation
1. Go to **Supabase Dashboard** → **Table Editor**
2. Look for `daily_logins` table
3. Verify it has these columns:
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, References auth.users)
   - `login_date` (DATE)
   - `created_at` (TIMESTAMP)

### Step 3: Verify RLS Policies
1. Go to **Supabase Dashboard** → **Authentication** → **Policies**
2. Or check in **Table Editor** → `daily_logins` → **Policies**
3. You should see:
   - "Users can read own logins" (SELECT)
   - "Users can insert own logins" (INSERT)

### Step 4: Test Again
1. Refresh your app
2. Log in again
3. Check the dashboard - the streak card should now work

## Alternative: Quick SQL Check

Run this in Supabase SQL Editor to check if table exists:

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'daily_logins'
);
```

If it returns `false`, the table doesn't exist and you need to run the setup script.

## What I Fixed

I've updated the error handling in `lib/daily-logins.ts` to:
1. Check for table existence errors (code `42P01`)
2. Show a helpful warning message
3. Log more detailed error information for debugging

The app will now gracefully handle the missing table and show a warning instead of crashing.

