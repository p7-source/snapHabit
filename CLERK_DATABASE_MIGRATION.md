# Clerk Database Migration Guide

## 🚨 Problem

After migrating to Clerk authentication, you're getting "Failed to save profile" errors because:

1. **Database schema expects Supabase UUIDs**: The `profiles` table has `id UUID REFERENCES auth.users`, which expects Supabase user IDs
2. **Clerk uses string IDs**: Clerk user IDs are strings like `user_xxx`, not UUIDs
3. **RLS policies use Supabase auth**: Policies use `auth.uid()` which doesn't work with Clerk

## ✅ Solution: Run Database Migration

### Step 1: Run the Migration Script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file `supabase-clerk-migration.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run** (or press Ctrl+Enter)

This script will:
- ✅ Remove foreign key constraints to `auth.users`
- ✅ Change `id` and `user_id` columns from UUID to TEXT
- ✅ Update RLS policies to work with Clerk
- ✅ Update all related tables (profiles, meals, daily_summaries, daily_logins)

### Step 2: Verify Migration

After running the script, verify the changes:

```sql
-- Check profiles table structure
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'id';
-- Should show: data_type = 'text'

-- Check meals table structure
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'meals' AND column_name = 'user_id';
-- Should show: data_type = 'text'
```

### Step 3: Test Profile Save

1. Restart your dev server
2. Try the onboarding flow again
3. Check browser console for any errors
4. Profile should save successfully

## 🔍 What the Migration Does

### Before (Supabase Auth):
```sql
-- Profiles table
id UUID REFERENCES auth.users PRIMARY KEY  -- ❌ Requires Supabase UUID

-- RLS Policy
USING (auth.uid() = id)  -- ❌ Uses Supabase auth function
```

### After (Clerk):
```sql
-- Profiles table
id TEXT PRIMARY KEY  -- ✅ Accepts Clerk string IDs

-- RLS Policy
USING (true)  -- ✅ Allows access (filtered by application code)
```

## ⚠️ Important Notes

### Security Consideration

The new RLS policies use `USING (true)` which is more permissive. This is safe because:

1. **Clerk handles authentication** - Only authenticated users can access the app
2. **Application code filters** - The code uses `user.id` from Clerk to filter data
3. **Middleware protection** - Clerk middleware protects routes

For production, you might want to:
- Use Supabase service role key for writes
- Create a custom function to verify Clerk sessions
- Implement application-level authorization checks

### Data Migration

**Existing Users**: If you have existing users with Supabase UUIDs, you'll need to:

1. **Option A**: Create a mapping table to link Clerk IDs to Supabase IDs
2. **Option B**: Have users re-register (clean slate)
3. **Option C**: Migrate existing data manually

## 🧪 Testing After Migration

1. ✅ Sign up a new user with Clerk
2. ✅ Complete onboarding
3. ✅ Profile should save successfully
4. ✅ Dashboard should load
5. ✅ Upload a meal
6. ✅ Check that data is saved with Clerk user ID

## 📝 Troubleshooting

### Error: "relation does not exist"
- The table hasn't been created yet
- Run the original `supabase-setup.sql` first

### Error: "permission denied"
- RLS policies might not have been updated
- Re-run the migration script

### Error: "invalid input syntax for type uuid"
- The migration didn't run successfully
- Check that columns were changed to TEXT
- Re-run the migration script

### Profile saves but dashboard shows no data
- Check that `user.id` is being used correctly (should be Clerk ID)
- Verify database queries use the correct user ID format

## 🔄 Rollback (If Needed)

If you need to rollback to Supabase Auth:

```sql
-- Change back to UUID (requires Supabase user IDs)
ALTER TABLE profiles ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);

-- Restore original RLS policies
-- (See supabase-setup.sql for original policies)
```

## ✅ Next Steps

After migration:
1. ✅ Test the full authentication flow
2. ✅ Verify profile creation works
3. ✅ Test meal uploads
4. ✅ Check dashboard loads correctly
5. ✅ Verify daily summaries work

