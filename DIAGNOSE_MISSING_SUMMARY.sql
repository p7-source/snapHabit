-- DIAGNOSE WHY DAILY_SUMMARIES ARE MISSING
-- Run this to check what's happening

-- ============================================
-- STEP 1: Check if meals exist for the user
-- ============================================

SELECT 
  'STEP 1: Meals for user' as check_name,
  user_id,
  date,
  COUNT(*) as meal_count,
  SUM(calories) as total_calories,
  MIN(created_at) as first_meal,
  MAX(created_at) as last_meal
FROM meals
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
GROUP BY user_id, date
ORDER BY date DESC;

-- Expected: Should show meals with dates

-- ============================================
-- STEP 2: Check if summaries exist for those dates
-- ============================================

SELECT 
  'STEP 2: Summaries for user' as check_name,
  user_id,
  date,
  total_calories,
  meal_count,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
ORDER BY date DESC;

-- Expected: Should show summaries matching the meal dates (but currently empty)

-- ============================================
-- STEP 3: Manually trigger summary creation
-- ============================================

-- This will manually call the trigger function for existing meals
-- It should create summaries for all dates where meals exist

DO $$
DECLARE
  meal_record RECORD;
  summary_date DATE;
BEGIN
  -- Loop through all meals for this user
  FOR meal_record IN 
    SELECT DISTINCT user_id, date
    FROM meals
    WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  LOOP
    -- Create summary for this date
    INSERT INTO daily_summaries (user_id, date, total_calories, total_protein, total_carbs, total_fat, meal_count, updated_at)
    SELECT 
      meal_record.user_id,
      meal_record.date,
      COALESCE(SUM(calories), 0)::INTEGER,
      COALESCE(SUM((macros->>'protein')::numeric), 0),
      COALESCE(SUM((macros->>'carbs')::numeric), 0),
      COALESCE(SUM((macros->>'fat')::numeric), 0),
      COUNT(*)::INTEGER,
      NOW()
    FROM meals
    WHERE user_id = meal_record.user_id
      AND date = meal_record.date
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      total_calories = EXCLUDED.total_calories,
      total_protein = EXCLUDED.total_protein,
      total_carbs = EXCLUDED.total_carbs,
      total_fat = EXCLUDED.total_fat,
      meal_count = EXCLUDED.meal_count,
      updated_at = NOW();
    
    RAISE NOTICE 'Created summary for date: %', meal_record.date;
  END LOOP;
  
  RAISE NOTICE '✅ Manually created summaries for all meal dates';
END $$;

-- ============================================
-- STEP 4: Verify summaries were created
-- ============================================

SELECT 
  'STEP 4: Verifying summaries' as check_name,
  user_id,
  date,
  total_calories,
  meal_count,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
ORDER BY date DESC;

-- Expected: Should now show summaries

-- ============================================
-- STEP 5: Compare meals vs summaries
-- ============================================

SELECT 
  'STEP 5: Comparison' as check_name,
  COALESCE(m.user_id, ds.user_id) as user_id,
  COALESCE(m.date, ds.date) as date,
  COALESCE(m.meal_count, 0) as meals_count,
  COALESCE(ds.meal_count, 0) as summary_count,
  COALESCE(m.total_calories, 0) as meals_calories,
  COALESCE(ds.total_calories, 0) as summary_calories,
  CASE 
    WHEN COALESCE(m.meal_count, 0) = COALESCE(ds.meal_count, 0) THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM (
  SELECT 
    user_id,
    date,
    COUNT(*) as meal_count,
    SUM(calories) as total_calories
  FROM meals
  WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  GROUP BY user_id, date
) m
FULL OUTER JOIN daily_summaries ds 
  ON m.user_id = ds.user_id AND m.date = ds.date
WHERE COALESCE(m.user_id, ds.user_id) = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
ORDER BY COALESCE(m.date, ds.date) DESC;

-- Expected: Both sides should match

-- ============================================
-- STEP 6: Check trigger function
-- ============================================

SELECT 
  'STEP 6: Trigger function check' as check_name,
  proname as function_name,
  prosrc LIKE '%user_id_text TEXT%' as uses_text,
  prosrc LIKE '%TEXT%' as has_text_type
FROM pg_proc
WHERE proname = 'update_daily_summary';

-- Expected: uses_text should be TRUE

-- ============================================
-- STEP 7: Check triggers are active
-- ============================================

SELECT 
  'STEP 7: Triggers check' as check_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'meals'
  AND trigger_name LIKE '%daily_summary%'
ORDER BY trigger_name;

-- Expected: Should see 3 triggers

-- ============================================
-- STEP 8: Test trigger by updating a meal
-- ============================================

-- This will test if the trigger works on UPDATE
-- Uncomment to test:

/*
UPDATE meals 
SET updated_at = NOW()
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND id = (SELECT id FROM meals WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu' LIMIT 1);

-- Check if summary was updated
SELECT 
  'After UPDATE test' as check_name,
  date,
  meal_count,
  total_calories,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
ORDER BY date DESC
LIMIT 1;
*/

