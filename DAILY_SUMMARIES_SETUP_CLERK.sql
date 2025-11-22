-- COMPLETE SETUP FOR DAILY_SUMMARIES TABLE WITH CLERK
-- This includes: table creation, RLS policies, trigger function, and triggers
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: CREATE TABLE (if it doesn't exist)
-- ============================================

CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,  -- TEXT for Clerk user IDs (user_xxx format)
  date DATE NOT NULL,  -- Just the date (no time component)
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(10, 2) DEFAULT 0,
  total_carbs DECIMAL(10, 2) DEFAULT 0,
  total_fat DECIMAL(10, 2) DEFAULT 0,
  meal_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)  -- One summary per user per day
);

-- ============================================
-- STEP 2: CREATE INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date 
ON daily_summaries(user_id, date DESC);

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: DROP EXISTING POLICIES (if any)
-- ============================================

DROP POLICY IF EXISTS "Users can read own summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Users can insert own summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Users can update own summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Users can delete own summaries" ON daily_summaries;

-- ============================================
-- STEP 5: CREATE RLS POLICIES (Permissive for Clerk)
-- ============================================

-- SELECT Policy: Allow users to read their own summaries
CREATE POLICY "Users can read own summaries"
  ON daily_summaries FOR SELECT
  USING (true);  -- Permissive - app layer filters by user_id

-- INSERT Policy: Allow users to insert their own summaries
CREATE POLICY "Users can insert own summaries"
  ON daily_summaries FOR INSERT
  WITH CHECK (true);  -- Permissive - app layer validates user_id

-- UPDATE Policy: Allow users to update their own summaries
CREATE POLICY "Users can update own summaries"
  ON daily_summaries FOR UPDATE
  USING (true);  -- Permissive - app layer filters by user_id
  WITH CHECK (true);  -- Permissive - app layer validates user_id

-- DELETE Policy: Allow users to delete their own summaries (for cleanup)
CREATE POLICY "Users can delete own summaries"
  ON daily_summaries FOR DELETE
  USING (true);  -- Permissive - app layer filters by user_id

-- ============================================
-- STEP 6: CREATE TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  meal_date DATE;
  user_id_text TEXT;  -- TEXT for Clerk user IDs
BEGIN
  -- Determine which user_id and date to use
  IF TG_OP = 'DELETE' THEN
    user_id_text := OLD.user_id::TEXT;  -- Convert to TEXT
    -- Use date column if available, otherwise fall back to created_at
    meal_date := COALESCE(OLD.date, DATE(OLD.created_at));
  ELSE
    user_id_text := NEW.user_id::TEXT;  -- Convert to TEXT
    -- Use date column if available, otherwise fall back to created_at
    meal_date := COALESCE(NEW.date, DATE(NEW.created_at));
  END IF;

  -- Recalculate totals for this user and date
  -- Use date column from meals table for accurate grouping
  INSERT INTO daily_summaries (user_id, date, total_calories, total_protein, total_carbs, total_fat, meal_count, updated_at)
  SELECT 
    user_id_text,
    meal_date,
    COALESCE(SUM(calories), 0)::INTEGER,
    COALESCE(SUM((macros->>'protein')::numeric), 0),
    COALESCE(SUM((macros->>'carbs')::numeric), 0),
    COALESCE(SUM((macros->>'fat')::numeric), 0),
    COUNT(*)::INTEGER,
    NOW()
  FROM meals
  WHERE user_id = user_id_text
    AND date = meal_date  -- Use date column from meals table
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    meal_count = EXCLUDED.meal_count,
    updated_at = NOW();

  -- If no meals exist for this date, delete the summary
  -- This ensures summaries are only kept when meals exist
  IF NOT EXISTS (
    SELECT 1 FROM meals 
    WHERE user_id = user_id_text 
      AND date = meal_date
  ) THEN
    DELETE FROM daily_summaries 
    WHERE user_id = user_id_text 
      AND date = meal_date;
  END IF;

  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 7: CREATE TRIGGERS
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_daily_summary_insert ON meals;
DROP TRIGGER IF EXISTS trigger_update_daily_summary_update ON meals;
DROP TRIGGER IF EXISTS trigger_update_daily_summary_delete ON meals;

-- Trigger for INSERT: Update summary when a meal is added
CREATE TRIGGER trigger_update_daily_summary_insert
  AFTER INSERT ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary();

-- Trigger for UPDATE: Update summary when a meal is modified
CREATE TRIGGER trigger_update_daily_summary_update
  AFTER UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary();

-- Trigger for DELETE: Update summary when a meal is deleted
CREATE TRIGGER trigger_update_daily_summary_delete
  AFTER DELETE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary();

-- ============================================
-- STEP 8: VERIFICATION
-- ============================================

-- Check table exists and column type
SELECT 
  'Table Check' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'daily_summaries'
  AND column_name = 'user_id';

-- Check RLS is enabled
SELECT 
  'RLS Check' as check_name,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'daily_summaries';

-- Check all policies
SELECT 
  'Policy Check' as check_name,
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'daily_summaries'
ORDER BY policyname;

-- Check trigger function exists
SELECT 
  'Function Check' as check_name,
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'update_daily_summary';

-- Check triggers exist
SELECT 
  'Trigger Check' as check_name,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'meals'
  AND trigger_name LIKE '%daily_summary%'
ORDER BY trigger_name;

-- Done! ✅
-- Daily summaries are now set up for Clerk with:
-- - TEXT user_id column
-- - Permissive RLS policies
-- - Trigger function that works with TEXT user IDs
-- - Triggers on INSERT, UPDATE, DELETE

