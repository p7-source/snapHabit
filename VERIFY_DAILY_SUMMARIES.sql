-- VERIFICATION SCRIPT FOR DAILY_SUMMARIES SETUP
-- Run this after running DAILY_SUMMARIES_SETUP_CLERK.sql
-- This will check if everything is set up correctly

-- ============================================
-- CHECK 1: Table Structure
-- ============================================

SELECT 
  '✅ CHECK 1: Table Structure' as check_name;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'daily_summaries'
ORDER BY ordinal_position;

-- Expected: user_id should be 'text' (not 'uuid')
-- Expected: date should be 'date'
-- Expected: all numeric columns should be correct types

-- ============================================
-- CHECK 2: Unique Constraint
-- ============================================

SELECT 
  '✅ CHECK 2: Unique Constraint' as check_name;

SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'daily_summaries'
  AND constraint_type = 'UNIQUE';

-- Expected: Should see a unique constraint on (user_id, date)

-- ============================================
-- CHECK 3: Index
-- ============================================

SELECT 
  '✅ CHECK 3: Index' as check_name;

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'daily_summaries';

-- Expected: Should see idx_daily_summaries_user_date

-- ============================================
-- CHECK 4: RLS Status
-- ============================================

SELECT 
  '✅ CHECK 4: RLS Status' as check_name;

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'daily_summaries';

-- Expected: rowsecurity should be TRUE

-- ============================================
-- CHECK 5: RLS Policies
-- ============================================

SELECT 
  '✅ CHECK 5: RLS Policies' as check_name;

SELECT 
  policyname,
  cmd as command,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'daily_summaries'
ORDER BY policyname;

-- Expected: Should see 4 policies:
-- 1. "Users can read own summaries" (SELECT)
-- 2. "Users can insert own summaries" (INSERT)
-- 3. "Users can update own summaries" (UPDATE)
-- 4. "Users can delete own summaries" (DELETE)
-- All should have USING (true) or WITH CHECK (true)

-- ============================================
-- CHECK 6: Trigger Function
-- ============================================

SELECT 
  '✅ CHECK 6: Trigger Function' as check_name;

SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_functiondef(oid) LIKE '%user_id_text TEXT%' as uses_text_type
FROM pg_proc
WHERE proname = 'update_daily_summary';

-- Expected: Function should exist and use TEXT for user_id

-- ============================================
-- CHECK 7: Triggers on Meals Table
-- ============================================

SELECT 
  '✅ CHECK 7: Triggers on Meals Table' as check_name;

SELECT 
  trigger_name,
  event_manipulation as event,
  event_object_table as table_name,
  action_timing as timing,
  action_statement as function_call
FROM information_schema.triggers
WHERE event_object_table = 'meals'
  AND trigger_name LIKE '%daily_summary%'
ORDER BY trigger_name;

-- Expected: Should see 3 triggers:
-- 1. trigger_update_daily_summary_insert (AFTER INSERT)
-- 2. trigger_update_daily_summary_update (AFTER UPDATE)
-- 3. trigger_update_daily_summary_delete (AFTER DELETE)

-- ============================================
-- CHECK 8: Sample Data (if any exists)
-- ============================================

SELECT 
  '✅ CHECK 8: Sample Data' as check_name;

SELECT 
  COUNT(*) as total_summaries,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM daily_summaries;

-- ============================================
-- CHECK 9: Test User Data (Replace with your user_id)
-- ============================================

SELECT 
  '✅ CHECK 9: Test User Data' as check_name;

-- Replace 'user_35oA1jDhbHemAbiN3Wq4U5hclPu' with your actual Clerk user_id
SELECT 
  user_id,
  date,
  total_calories,
  total_protein,
  total_carbs,
  total_fat,
  meal_count,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'  -- Replace with your user_id
ORDER BY date DESC
LIMIT 5;

-- Expected: Should show any existing summaries for this user

-- ============================================
-- CHECK 10: Verify Meals Table has date column
-- ============================================

SELECT 
  '✅ CHECK 10: Meals Table Date Column' as check_name;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meals'
  AND column_name = 'date';

-- Expected: Should see date column exists (required for trigger to work)

-- ============================================
-- CHECK 11: Test Trigger with Sample Query
-- ============================================

SELECT 
  '✅ CHECK 11: Trigger Test Query' as check_name;

-- This simulates what the trigger does
-- Replace 'user_35oA1jDhbHemAbiN3Wq4U5hclPu' with your actual user_id
-- Replace '2024-11-21' with today's date (YYYY-MM-DD)

SELECT 
  user_id,
  date,
  COALESCE(SUM(calories), 0) as calculated_calories,
  COALESCE(SUM((macros->>'protein')::numeric), 0) as calculated_protein,
  COALESCE(SUM((macros->>'carbs')::numeric), 0) as calculated_carbs,
  COALESCE(SUM((macros->>'fat')::numeric), 0) as calculated_fat,
  COUNT(*) as calculated_meal_count
FROM meals
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'  -- Replace with your user_id
  AND date = '2024-11-21'  -- Replace with today's date (YYYY-MM-DD)
GROUP BY user_id, date;

-- Compare this with daily_summaries table - they should match

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
  '✅ VERIFICATION COMPLETE' as status;

-- Review all checks above:
-- ✅ Table structure is correct
-- ✅ Unique constraint exists
-- ✅ Index exists
-- ✅ RLS is enabled
-- ✅ All 4 policies exist
-- ✅ Trigger function exists and uses TEXT
-- ✅ All 3 triggers exist on meals table
-- ✅ Sample data query works
-- ✅ Test user data query works
-- ✅ Meals table has date column
-- ✅ Trigger test query works

-- If all checks pass, your daily_summaries setup is working correctly!
-- If any checks fail, review the error messages and re-run the setup script.

