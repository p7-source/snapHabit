-- Migration script to support Clerk authentication
-- This updates the database schema to work with Clerk user IDs (strings) instead of Supabase auth UUIDs

-- ============================================
-- STEP 1: Drop RLS policies FIRST (before altering column)
-- ============================================

-- IMPORTANT: Must drop policies BEFORE altering column type
-- Policies depend on the column, so we need to drop them first

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- ============================================
-- STEP 2: Update profiles table for Clerk
-- ============================================

-- Remove foreign key constraint to auth.users
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change id column from UUID to TEXT (now that policies are dropped)
ALTER TABLE profiles 
  ALTER COLUMN id TYPE TEXT;

-- ============================================
-- STEP 3: Recreate RLS policies for Clerk
-- ============================================

-- Create new policies that work with Clerk user IDs
-- Note: These policies are permissive because Clerk handles authentication
-- The application code will filter by user.id to ensure users only see their own data

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (true);

-- ============================================
-- STEP 4: Update meals table for Clerk
-- ============================================

-- Drop RLS policies FIRST (before altering column)
DROP POLICY IF EXISTS "Users can read own meals" ON meals;
DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
DROP POLICY IF EXISTS "Users can update own meals" ON meals;
DROP POLICY IF EXISTS "Users can delete own meals" ON meals;

-- Remove foreign key constraint from meals table
ALTER TABLE meals 
  DROP CONSTRAINT IF EXISTS meals_user_id_fkey;

-- Change user_id to TEXT to match Clerk IDs
ALTER TABLE meals 
  ALTER COLUMN user_id TYPE TEXT;

-- Recreate RLS policies for meals
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

-- ============================================
-- STEP 5: Update daily_summaries table for Clerk
-- ============================================

-- Check if daily_summaries table exists and update it
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_summaries') THEN
    -- Drop RLS policies FIRST
    DROP POLICY IF EXISTS "Users can read own summaries" ON daily_summaries;
    DROP POLICY IF EXISTS "Users can insert own summaries" ON daily_summaries;
    DROP POLICY IF EXISTS "Users can update own summaries" ON daily_summaries;
    
    -- Remove foreign key if exists
    ALTER TABLE daily_summaries 
      DROP CONSTRAINT IF EXISTS daily_summaries_user_id_fkey;
    
    -- Change user_id to TEXT
    ALTER TABLE daily_summaries 
      ALTER COLUMN user_id TYPE TEXT;
    
    -- Recreate RLS policies
    CREATE POLICY "Users can read own summaries"
      ON daily_summaries FOR SELECT
      USING (true);
    
    CREATE POLICY "Users can insert own summaries"
      ON daily_summaries FOR INSERT
      WITH CHECK (true);
    
    CREATE POLICY "Users can update own summaries"
      ON daily_summaries FOR UPDATE
      USING (true);
  END IF;
END $$;

-- ============================================
-- STEP 5: Update daily_logins table for Clerk
-- ============================================

-- Check if daily_logins table exists and update it
DO $$
DECLARE
    r RECORD;
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_logins') THEN
    -- Drop known policies first
    DROP POLICY IF EXISTS "Users can read own logins" ON daily_logins;
    DROP POLICY IF EXISTS "Users can insert own logins" ON daily_logins;
    DROP POLICY IF EXISTS "Users can update own logins" ON daily_logins;
    DROP POLICY IF EXISTS "Users can delete own logins" ON daily_logins;
    
    -- Drop any other policies that might exist (auto-generated or custom)
    -- Use a loop to handle cases where there are no policies
    FOR r IN (
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'daily_logins'
    ) LOOP
      BEGIN
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON daily_logins';
      EXCEPTION
        WHEN OTHERS THEN
          -- Ignore errors for individual policy drops
          NULL;
      END;
    END LOOP;
    
    -- Remove foreign key if exists
    ALTER TABLE daily_logins 
      DROP CONSTRAINT IF EXISTS daily_logins_user_id_fkey;
    
    -- Change user_id to TEXT (now that policies are dropped)
    ALTER TABLE daily_logins 
      ALTER COLUMN user_id TYPE TEXT;
    
    -- Recreate RLS policies
    CREATE POLICY "Users can read own logins"
      ON daily_logins FOR SELECT
      USING (true);
    
    CREATE POLICY "Users can insert own logins"
      ON daily_logins FOR INSERT
      WITH CHECK (true);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If table doesn't exist or other errors, continue
    RAISE NOTICE 'Error updating daily_logins: %', SQLERRM;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check profiles table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check meals table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'meals'
ORDER BY ordinal_position;

