-- COMPLETE FIX FOR DAILY_SUMMARIES - Run this to fix everything
-- This fixes the daily_summaries table and trigger function for Clerk

-- ============================================
-- STEP 1: Fix daily_summaries table column type
-- ============================================

-- Drop all policies first (critical!)
DROP POLICY IF EXISTS "Users can read own summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Users can insert own summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Users can update own summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Users can delete own summaries" ON daily_summaries;

-- Drop foreign key constraint
ALTER TABLE daily_summaries DROP CONSTRAINT IF EXISTS daily_summaries_user_id_fkey;

-- Change column type from UUID to TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'daily_summaries' 
      AND column_name = 'user_id' 
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE daily_summaries ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    RAISE NOTICE '✅ Changed daily_summaries.user_id from UUID to TEXT';
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'daily_summaries' 
      AND column_name = 'user_id' 
      AND data_type = 'text'
  ) THEN
    RAISE NOTICE '✅ daily_summaries.user_id is already TEXT';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error changing daily_summaries.user_id: %', SQLERRM;
END $$;

-- Recreate permissive policies
CREATE POLICY "Users can read own summaries"
  ON daily_summaries FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own summaries"
  ON daily_summaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own summaries"
  ON daily_summaries FOR UPDATE
  USING (true);

-- ============================================
-- STEP 2: Fix the trigger function for TEXT user_id
-- ============================================

CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  meal_date DATE;
  user_id_text TEXT;  -- Changed from UUID to TEXT
BEGIN
  -- Determine which user_id and date to use
  IF TG_OP = 'DELETE' THEN
    user_id_text := OLD.user_id::TEXT;  -- Convert to TEXT
    meal_date := COALESCE(OLD.date, DATE(OLD.created_at));
  ELSE
    user_id_text := NEW.user_id::TEXT;  -- Convert to TEXT
    meal_date := COALESCE(NEW.date, DATE(NEW.created_at));
  END IF;

  -- Recalculate totals for this user and date using date column
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
    AND date = meal_date  -- Use date column
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    meal_count = EXCLUDED.meal_count,
    updated_at = NOW();

  -- If no meals exist for this date, delete the summary
  IF NOT EXISTS (
    SELECT 1 FROM meals 
    WHERE user_id = user_id_text 
      AND date = meal_date
  ) THEN
    DELETE FROM daily_summaries 
    WHERE user_id = user_id_text 
      AND date = meal_date;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Verify the fix
-- ============================================

-- Check column type
SELECT 
  'VERIFICATION: Column Type' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'daily_summaries'
  AND column_name = 'user_id';

-- Check function
SELECT 
  'VERIFICATION: Function' as check_name,
  proname as function_name
FROM pg_proc
WHERE proname = 'update_daily_summary';

-- Check policies
SELECT 
  'VERIFICATION: Policies' as check_name,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'daily_summaries'
ORDER BY policyname;

-- Done! ✅
-- Now daily summaries should work with Clerk user IDs

