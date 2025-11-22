-- TEST TRIGGER FUNCTIONALITY
-- This will test if the trigger is working correctly
-- Run this after setting up daily_summaries

-- ============================================
-- STEP 1: Check current state
-- ============================================

-- Replace with your actual Clerk user_id
SET test_user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu';

-- Get today's date (YYYY-MM-DD format)
SELECT 
  'Current State' as test_phase,
  COUNT(*) as meals_count,
  COALESCE(SUM(calories), 0) as total_calories
FROM meals
WHERE user_id = current_setting('test_user_id', true)
  AND date = CURRENT_DATE;

-- Check if summary exists
SELECT 
  'Summary Before' as test_phase,
  total_calories,
  total_protein,
  total_carbs,
  total_fat,
  meal_count
FROM daily_summaries
WHERE user_id = current_setting('test_user_id', true)
  AND date = CURRENT_DATE;

-- ============================================
-- STEP 2: Test INSERT trigger (if you want to test)
-- ============================================

-- WARNING: Only run this if you want to create a test meal
-- Uncomment the lines below to test INSERT trigger:

/*
-- Insert a test meal
INSERT INTO meals (
  user_id,
  food_name,
  calories,
  macros,
  ai_advice,
  date,
  created_at
) VALUES (
  current_setting('test_user_id', true),
  'Test Meal - Trigger Test',
  100,
  '{"protein": 10, "carbs": 20, "fat": 5}'::jsonb,
  'Test advice',
  CURRENT_DATE,
  NOW()
);

-- Check if summary was updated
SELECT 
  'Summary After INSERT' as test_phase,
  total_calories,
  total_protein,
  total_carbs,
  total_fat,
  meal_count
FROM daily_summaries
WHERE user_id = current_setting('test_user_id', true)
  AND date = CURRENT_DATE;

-- Clean up test meal (optional)
DELETE FROM meals
WHERE user_id = current_setting('test_user_id', true)
  AND food_name = 'Test Meal - Trigger Test'
  AND date = CURRENT_DATE;
*/

-- ============================================
-- STEP 3: Manual verification query
-- ============================================

-- Compare meals totals with daily_summaries for today
-- Replace 'user_35oA1jDhbHemAbiN3Wq4U5hclPu' with your user_id

WITH meal_totals AS (
  SELECT 
    user_id,
    date,
    COALESCE(SUM(calories), 0) as calc_calories,
    COALESCE(SUM((macros->>'protein')::numeric), 0) as calc_protein,
    COALESCE(SUM((macros->>'carbs')::numeric), 0) as calc_carbs,
    COALESCE(SUM((macros->>'fat')::numeric), 0) as calc_fat,
    COUNT(*) as calc_meal_count
  FROM meals
  WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'  -- Replace with your user_id
    AND date = CURRENT_DATE
  GROUP BY user_id, date
),
summary_totals AS (
  SELECT 
    user_id,
    date,
    total_calories as summary_calories,
    total_protein as summary_protein,
    total_carbs as summary_carbs,
    total_fat as summary_fat,
    meal_count as summary_meal_count
  FROM daily_summaries
  WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'  -- Replace with your user_id
    AND date = CURRENT_DATE
)
SELECT 
  'Verification' as test_phase,
  COALESCE(m.calc_calories, 0) as meals_calories,
  COALESCE(s.summary_calories, 0) as summary_calories,
  COALESCE(m.calc_calories, 0) = COALESCE(s.summary_calories, 0) as calories_match,
  COALESCE(m.calc_meal_count, 0) as meals_count,
  COALESCE(s.summary_meal_count, 0) as summary_count,
  COALESCE(m.calc_meal_count, 0) = COALESCE(s.summary_meal_count, 0) as count_match
FROM meal_totals m
FULL OUTER JOIN summary_totals s ON m.user_id = s.user_id AND m.date = s.date;

-- Expected: calories_match and count_match should be TRUE if trigger is working
-- If no meals exist, both sides will be 0 (which also matches)

-- ============================================
-- STEP 4: Check all users' summaries
-- ============================================

SELECT 
  'All Summaries' as test_phase,
  user_id,
  date,
  total_calories,
  meal_count,
  updated_at
FROM daily_summaries
ORDER BY updated_at DESC
LIMIT 10;

