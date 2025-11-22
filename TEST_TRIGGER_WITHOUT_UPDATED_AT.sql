-- TEST TRIGGER WITHOUT UPDATED_AT COLUMN
-- Since meals table doesn't have updated_at, we'll update another column

-- ============================================
-- STEP 1: Check current summary state
-- ============================================

SELECT 
  'Before UPDATE' as test_phase,
  date,
  total_calories,
  meal_count,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND date = '2025-11-21';

-- ============================================
-- STEP 2: Update a meal (this should trigger the UPDATE trigger)
-- ============================================

-- Option 1: Update ai_advice (safe, doesn't affect calculations)
UPDATE meals 
SET ai_advice = ai_advice  -- No actual change, but triggers UPDATE event
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND id = 'b79a0d5a-f1d8-4226-8392-18f50b6156dc';

-- Option 2: Or update a comment/note field if you have one
-- UPDATE meals 
-- SET ai_advice = ai_advice  -- No actual change
-- WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
--   AND id = 'b79a0d5a-f1d8-4226-8392-18f50b6156dc';

-- ============================================
-- STEP 3: Check if summary was updated
-- ============================================

SELECT 
  'After UPDATE' as test_phase,
  date,
  total_calories,
  meal_count,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND date = '2025-11-21';

-- The updated_at timestamp should have changed if trigger worked

-- ============================================
-- STEP 4: Better test - Insert a new meal
-- ============================================

-- This is the best test since it uses INSERT trigger
-- Uncomment to test:

/*
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
  100,
  '{"protein": 10, "carbs": 20, "fat": 5}'::jsonb,
  'Test advice',
  '2025-11-21',
  NOW()
);

-- Check if summary was created/updated
SELECT 
  'After INSERT' as test_phase,
  date,
  total_calories,
  meal_count,
  updated_at
FROM daily_summaries
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND date = '2025-11-21';

-- Clean up test meal (optional)
DELETE FROM meals
WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
  AND food_name = 'Test Meal - Trigger Test'
  AND date = '2025-11-21';
*/

-- ============================================
-- STEP 5: Verify summary matches meals
-- ============================================

SELECT 
  'Verification' as test_phase,
  COALESCE(m.calc_count, 0) as meals_count,
  COALESCE(ds.meal_count, 0) as summary_count,
  COALESCE(m.calc_calories, 0) as meals_calories,
  COALESCE(ds.total_calories, 0) as summary_calories,
  CASE 
    WHEN COALESCE(m.calc_count, 0) = COALESCE(ds.meal_count, 0) 
      AND COALESCE(m.calc_calories, 0) = COALESCE(ds.total_calories, 0)
    THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM (
  SELECT 
    COUNT(*) as calc_count,
    SUM(calories) as calc_calories
  FROM meals
  WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
    AND date = '2025-11-21'
) m
CROSS JOIN (
  SELECT 
    meal_count,
    total_calories
  FROM daily_summaries
  WHERE user_id = 'user_35oA1jDhbHemAbiN3Wq4U5hclPu'
    AND date = '2025-11-21'
) ds;

-- Expected: Should show ✅ Match

