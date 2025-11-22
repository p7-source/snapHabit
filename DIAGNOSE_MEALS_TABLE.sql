-- DIAGNOSE MEALS TABLE - Check current state
-- Run this to see what's wrong

-- Check if table exists
SELECT 
  tablename as table_name,
  CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'meals';

-- Check column type
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meals'
  AND column_name = 'user_id';

-- Check all columns in meals table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meals'
ORDER BY ordinal_position;

-- Check constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
  AND tc.table_name = kcu.table_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'meals'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Check policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'meals'
ORDER BY policyname;

-- Check if there's any data
SELECT COUNT(*) as total_meals FROM meals;
SELECT user_id, COUNT(*) as count FROM meals GROUP BY user_id LIMIT 5;

