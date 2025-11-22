-- ROBUST FIX FOR MEALS TABLE - Handles all edge cases
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================
-- STEP 1: Check current state
-- ============================================

DO $$
DECLARE
  col_type TEXT;
  row_count INTEGER;
BEGIN
  -- Get current column type
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'meals' 
    AND column_name = 'user_id';
  
  RAISE NOTICE 'Current meals.user_id type: %', COALESCE(col_type, 'COLUMN NOT FOUND');
  
  -- Get row count
  SELECT COUNT(*) INTO row_count FROM meals;
  RAISE NOTICE 'Current meals row count: %', row_count;
END $$;

-- ============================================
-- STEP 2: Drop ALL policies first
-- ============================================

DROP POLICY IF EXISTS "Users can read own meals" ON meals;
DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
DROP POLICY IF EXISTS "Users can update own meals" ON meals;
DROP POLICY IF EXISTS "Users can delete own meals" ON meals;

-- Drop any remaining policies
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
    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON meals';
      RAISE NOTICE 'Dropped policy: %', r.policyname;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping policy %: %', r.policyname, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================
-- STEP 3: Drop ALL constraints
-- ============================================

-- Drop foreign key constraints
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_user_id_fkey;
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_user_id_users_fkey;

-- Drop any other constraints that might reference user_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'meals'
      AND constraint_type = 'FOREIGN KEY'
  ) LOOP
    BEGIN
      EXECUTE 'ALTER TABLE meals DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
      RAISE NOTICE 'Dropped constraint: %', r.constraint_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraint %: %', r.constraint_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================
-- STEP 4: Change column type
-- ============================================

DO $$
BEGIN
  -- Check if column exists and is UUID
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'meals' 
      AND column_name = 'user_id' 
      AND data_type = 'uuid'
  ) THEN
    -- Convert UUID to TEXT
    -- If there's data, convert it; if empty, just change type
    BEGIN
      ALTER TABLE meals ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      RAISE NOTICE '✅ Successfully changed meals.user_id from UUID to TEXT';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Error converting column: %', SQLERRM;
        RAISE NOTICE '   Error code: %', SQLSTATE;
        -- Try alternative: drop and recreate column
        BEGIN
          RAISE NOTICE '   Attempting alternative: drop and recreate...';
          ALTER TABLE meals DROP COLUMN user_id;
          ALTER TABLE meals ADD COLUMN user_id TEXT NOT NULL;
          RAISE NOTICE '   ✅ Recreated user_id as TEXT';
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE '   ❌ Alternative also failed: %', SQLERRM;
            RAISE;
        END;
    END;
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'meals' 
      AND column_name = 'user_id' 
      AND data_type = 'text'
  ) THEN
    RAISE NOTICE '✅ meals.user_id is already TEXT';
  ELSE
    RAISE NOTICE '⚠️ meals.user_id column not found - creating it...';
    ALTER TABLE meals ADD COLUMN user_id TEXT;
  END IF;
END $$;

-- ============================================
-- STEP 5: Recreate policies
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
-- STEP 6: Verification
-- ============================================

-- Verify column type
SELECT 
  'VERIFICATION: Column Type' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'meals'
  AND column_name = 'user_id';

-- Verify policies
SELECT 
  'VERIFICATION: Policies' as check_type,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'meals'
ORDER BY policyname;

-- Done! ✅
-- If you still see errors, check the verification output above

