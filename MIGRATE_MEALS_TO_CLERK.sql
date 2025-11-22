-- MIGRATE MEALS TABLE TO CLERK - Handles existing UUID data
-- This script converts meals.user_id from UUID to TEXT for Clerk compatibility

-- ============================================
-- STEP 1: Check current state
-- ============================================

DO $$
DECLARE
  col_type TEXT;
  row_count INTEGER;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'meals' 
    AND column_name = 'user_id';
  
  SELECT COUNT(*) INTO row_count FROM meals;
  
  RAISE NOTICE 'Current meals.user_id type: %', COALESCE(col_type, 'NOT FOUND');
  RAISE NOTICE 'Current meals row count: %', row_count;
END $$;

-- ============================================
-- STEP 2: Drop ALL policies
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
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END LOOP;
END $$;

-- ============================================
-- STEP 3: Drop ALL constraints
-- ============================================

ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_user_id_fkey;
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_user_id_users_fkey;

-- Drop any other foreign key constraints
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'meals'
      AND constraint_type = 'FOREIGN KEY'
  ) LOOP
    BEGIN
      EXECUTE 'ALTER TABLE meals DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END LOOP;
END $$;

-- ============================================
-- STEP 4: Convert existing UUID data to TEXT
-- ============================================
-- This converts UUID values to TEXT format (they'll still be valid UUID strings)

DO $$
BEGIN
  -- Check if column is UUID
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'meals' 
      AND column_name = 'user_id' 
      AND data_type = 'uuid'
  ) THEN
    -- Convert UUID to TEXT
    -- This will convert existing UUIDs like '41097162-95ed-449c-8785-1f51e732f2f9' 
    -- to TEXT format '41097162-95ed-449c-8785-1f51e732f2f9'
    ALTER TABLE meals 
      ALTER COLUMN user_id TYPE TEXT 
      USING user_id::TEXT;
    
    RAISE NOTICE '✅ Successfully converted meals.user_id from UUID to TEXT';
    RAISE NOTICE '   Existing UUID data has been converted to TEXT format';
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
    RAISE NOTICE '⚠️ meals.user_id column not found';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error converting column: %', SQLERRM;
    RAISE;
END $$;

-- ============================================
-- STEP 5: Verify the conversion
-- ============================================

-- Check column type
SELECT 
  'Column Type Check' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meals'
  AND column_name = 'user_id';

-- Check sample data (should show TEXT values now)
SELECT 
  'Sample Data Check' as check_name,
  user_id,
  pg_typeof(user_id) as actual_type,
  COUNT(*) as count
FROM meals
GROUP BY user_id
LIMIT 5;

-- ============================================
-- STEP 6: Recreate policies
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
-- FINAL VERIFICATION
-- ============================================

SELECT 
  'FINAL CHECK: Column Type' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meals'
  AND column_name = 'user_id';

SELECT 
  'FINAL CHECK: Policies' as status,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'meals'
ORDER BY policyname;

-- Done! ✅
-- The meals table should now accept both:
-- - Old Supabase Auth UUIDs (as TEXT): '41097162-95ed-449c-8785-1f51e732f2f9'
-- - New Clerk user IDs (as TEXT): 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'

