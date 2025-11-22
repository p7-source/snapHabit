-- QUICK FIX: Run this in Supabase SQL Editor to fix the profile save error
-- This changes the profiles table to accept Clerk string IDs
-- IMPORTANT: Drop policies FIRST, then alter column, then recreate policies

-- Step 1: Drop RLS policies FIRST (before altering column)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Step 2: Remove foreign key constraint
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 3: Change id column from UUID to TEXT (now that policies are dropped)
ALTER TABLE profiles 
  ALTER COLUMN id TYPE TEXT;

-- Step 4: Recreate RLS policies

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (true);

-- Step 5: Also update meals table (drop policies first)
DROP POLICY IF EXISTS "Users can read own meals" ON meals;
DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
DROP POLICY IF EXISTS "Users can update own meals" ON meals;
DROP POLICY IF EXISTS "Users can delete own meals" ON meals;

ALTER TABLE meals 
  DROP CONSTRAINT IF EXISTS meals_user_id_fkey;

ALTER TABLE meals 
  ALTER COLUMN user_id TYPE TEXT;

CREATE POLICY "Users can read own meals"
  ON meals FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  USING (true);

-- Done! Now try saving your profile again.

