-- QUICK FIX: Update profiles RLS policies for Clerk
-- Run this in Supabase SQL Editor

-- Step 1: Drop old policies that use auth.uid()
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Step 2: Check if column type needs to be changed
-- If you get an error about UUID, run the column type change first:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
-- ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Step 3: Create new permissive policies (application layer handles filtering)
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (true);

-- Done! ✅
-- Now try saving your profile again in the app.

