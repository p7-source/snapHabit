-- CHECK RLS STATUS - Run this to see current state
-- This helps diagnose what still needs to be fixed

-- Check which tables exist
SELECT 
  t.table_name,
  CASE WHEN pt.rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as rls_status
FROM information_schema.tables t
LEFT JOIN pg_tables pt ON pt.tablename = t.table_name AND pt.schemaname = 'public'
WHERE t.table_schema = 'public'
  AND t.table_name IN ('profiles', 'meals', 'daily_logins', 'daily_summaries')
ORDER BY t.table_name;

-- Check current policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename IN ('profiles', 'meals', 'daily_logins', 'daily_summaries')
ORDER BY tablename, policyname;

-- Check column types
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('profiles', 'meals', 'daily_logins', 'daily_summaries')
  AND column_name IN ('id', 'user_id')
ORDER BY table_name, column_name;

-- Check for foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('profiles', 'meals', 'daily_logins', 'daily_summaries')
ORDER BY tc.table_name;

