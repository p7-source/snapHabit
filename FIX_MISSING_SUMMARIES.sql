-- FIX MISSING DAILY_SUMMARIES FOR EXISTING MEALS
-- This will backfill daily_summaries for all existing meals
-- Run this to create summaries for meals that were created before the trigger was set up

-- ============================================
-- STEP 1: Create summaries for all existing meals
-- ============================================

-- This will insert/update daily_summaries for all user/date combinations
INSERT INTO daily_summaries (user_id, date, total_calories, total_protein, total_carbs, total_fat, meal_count, updated_at)
SELECT 
  user_id,
  date,
  COALESCE(SUM(calories), 0)::INTEGER as total_calories,
  COALESCE(SUM((macros->>'protein')::numeric), 0) as total_protein,
  COALESCE(SUM((macros->>'carbs')::numeric), 0) as total_carbs,
  COALESCE(SUM((macros->>'fat')::numeric), 0) as total_fat,
  COUNT(*)::INTEGER as meal_count,
  NOW() as updated_at
FROM meals
GROUP BY user_id, date
ON CONFLICT (user_id, date)
DO UPDATE SET
  total_calories = EXCLUDED.total_calories,
  total_protein = EXCLUDED.total_protein,
  total_carbs = EXCLUDED.total_carbs,
  total_fat = EXCLUDED.total_fat,
  meal_count = EXCLUDED.meal_count,
  updated_at = NOW();

-- ============================================
-- STEP 2: Verify summaries were created
-- ============================================

SELECT 
  'Verification' as check_name,
  COUNT(DISTINCT user_id) as users_with_summaries,
  COUNT(*) as total_summaries,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM daily_summaries;

-- ============================================
-- STEP 3: Check specific user
-- ============================================

SELECT 
  'User summaries' as check_name,
  user_id,
  date,
  total_calories,
  meal_count,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
ORDER BY date DESC;

-- ============================================
-- STEP 4: Compare with meals
-- ============================================

SELECT 
  'Comparison' as check_name,
  COALESCE(m.user_id, ds.user_id) as user_id,
  COALESCE(m.date, ds.date) as date,
  COALESCE(m.meal_count, 0) as meals_count,
  COALESCE(ds.meal_count, 0) as summary_count,
  COALESCE(m.total_calories, 0) as meals_calories,
  COALESCE(ds.total_calories, 0) as summary_calories
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

-- Done! ✅
-- All existing meals now have corresponding daily_summaries
-- Future meals will automatically create summaries via trigger

