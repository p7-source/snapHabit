-- SIMPLE TRIGGER TEST
-- Test if the trigger is working correctly

-- ============================================
-- STEP 1: Check current summary
-- ============================================

SELECT 
  'Before test' as phase,
  date,
  total_calories,
  meal_count,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND date = '2025-11-21';

-- ============================================
-- STEP 2: Trigger UPDATE by updating ai_advice
-- ============================================

-- This will trigger the UPDATE trigger
UPDATE meals 
SET ai_advice = ai_advice  -- No change, but triggers UPDATE event
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND id = 'b79a0d5a-f1d8-4226-8392-18f50b6156dc';

-- ============================================
-- STEP 3: Check if summary updated_at changed
-- ============================================

SELECT 
  'After UPDATE' as phase,
  date,
  total_calories,
  meal_count,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND date = '2025-11-21';

-- If trigger is working, updated_at should have changed

-- ============================================
-- STEP 4: Better test - INSERT a new meal
-- ============================================

-- This tests the INSERT trigger (most important)
-- Uncomment to test:

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
  'user_35oA1jDhbHemAbiN3Wq4U5hclPu',
  'Test Meal - Trigger Test',
  150,
  '{"protein": 15, "carbs": 25, "fat": 5}'::jsonb,
  'Test advice',
  '2025-11-21',
  NOW()
);

-- Check if summary was updated
SELECT 
  'After INSERT' as phase,
  date,
  total_calories,
  meal_count,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND date = '2025-11-21';

-- Expected: total_calories should be 750 (600 + 150)
-- Expected: meal_count should be 2 (1 + 1)

-- Clean up test meal (optional)
DELETE FROM meals
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND food_name = 'Test Meal - Trigger Test'
  AND date = '2025-11-21';
*/

-- ============================================
-- STEP 5: Verify summary matches meals
-- ============================================

WITH meal_totals AS (
  SELECT 
    COUNT(*) as meal_count,
    SUM(calories) as total_calories
  FROM meals
  WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
    AND date = '2025-11-21'
),
summary_totals AS (
  SELECT 
    meal_count,
    total_calories
  FROM daily_summaries
  WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
    AND date = '2025-11-21'
)
SELECT 
  'Verification' as phase,
  COALESCE(m.meal_count, 0) as meals_count,
  COALESCE(s.meal_count, 0) as summary_count,
  COALESCE(m.total_calories, 0) as meals_calories,
  COALESCE(s.total_calories, 0) as summary_calories,
  CASE 
    WHEN COALESCE(m.meal_count, 0) = COALESCE(s.meal_count, 0) 
      AND COALESCE(m.total_calories, 0) = COALESCE(s.total_calories, 0)
    THEN '✅ Match - Trigger working!'
    ELSE '❌ Mismatch - Check trigger'
  END as status
FROM meal_totals m
CROSS JOIN summary_totals s;

-- Expected: Should show ✅ Match if trigger is working

