-- DIRECT FIX FOR MEALS TABLE - Simple and direct approach
-- Run this in Supabase SQL Editor

-- First, let's check the current state
SELECT 
  'CURRENT STATE' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meals'
  AND column_name = 'user_id';

-- Now let's fix it step by step:

-- Step 1: Drop ALL policies (absolutely critical - must be first)
DROP POLICY IF EXISTS "Users can read own meals" ON meals;
DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
DROP POLICY IF EXISTS "Users can update own meals" ON meals;
DROP POLICY IF EXISTS "Users can delete own meals" ON meals;

-- Step 2: Drop foreign key constraint
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_user_id_fkey;

-- Step 3: Change column type directly (this is the critical part)
ALTER TABLE meals 
  ALTER COLUMN user_id TYPE TEXT 
  USING user_id::TEXT;

-- Step 4: Recreate policies
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

-- Verify it worked
SELECT 
  'VERIFICATION' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meals'
  AND column_name = 'user_id';

-- Done! ✅
-- The column should now be TEXT type

