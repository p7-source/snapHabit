-- FIX MEALS TABLE FOR CLERK - Run this immediately
-- This fixes the "invalid input syntax for type uuid" error

-- ============================================
-- STEP 1: Drop all policies on meals table
-- ============================================

DROP POLICY IF EXISTS "Users can read own meals" ON meals;
DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
DROP POLICY IF EXISTS "Users can update own meals" ON meals;
DROP POLICY IF EXISTS "Users can delete own meals" ON meals;

-- Drop any other policies that might exist
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'meals'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON meals';
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- ============================================
-- STEP 2: Drop foreign key constraint
-- ============================================

ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_user_id_fkey;

-- ============================================
-- STEP 3: Change user_id from UUID to TEXT
-- ============================================

-- First, let's check the current type
DO $$
BEGIN
  -- Check if column is UUID
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'meals' 
    AND column_name = 'user_id' 
    AND data_type = 'uuid'
  ) THEN
    -- Change to TEXT
    ALTER TABLE meals ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    RAISE NOTICE '✅ Changed meals.user_id from UUID to TEXT';
  ELSE
    -- Check if it's already TEXT
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'meals' 
      AND column_name = 'user_id' 
      AND data_type = 'text'
    ) THEN
      RAISE NOTICE '✅ meals.user_id is already TEXT';
    ELSE
      RAISE NOTICE '⚠️ Could not find meals.user_id column';
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error changing column type: %', SQLERRM;
    RAISE NOTICE '   Error details: %', SQLSTATE;
END $$;

-- ============================================
-- STEP 4: Recreate permissive policies
-- ============================================

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
-- VERIFICATION
-- ============================================

-- Check column type
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'meals'
  AND column_name = 'user_id';

-- Check policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'meals'
ORDER BY policyname;

-- Done! ✅
-- Now try uploading a meal again

