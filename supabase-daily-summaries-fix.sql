-- Fix for daily_summaries trigger to handle timezone correctly
-- This ensures dates are calculated consistently with the frontend

-- ============================================
-- FIXED FUNCTION TO UPDATE/INSERT SUMMARY
-- ============================================
-- This version uses DATE() which extracts the date part from the timestamp
-- The key fix: Ensure we're only calculating for the specific date of the meal
-- and not including meals from other dates

CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  meal_date DATE;
  user_uuid UUID;
BEGIN
  -- Determine which user_id and date to use
  IF TG_OP = 'DELETE' THEN
    user_uuid := OLD.user_id;
    -- Extract date from timestamp (uses server timezone, typically UTC)
    meal_date := DATE(OLD.created_at);
  ELSE
    user_uuid := NEW.user_id;
    -- Extract date from timestamp (uses server timezone, typically UTC)
    meal_date := DATE(NEW.created_at);
  END IF;

  -- IMPORTANT: Only recalculate totals for THIS specific date
  -- The WHERE clause ensures we only sum meals from the exact same date
  INSERT INTO daily_summaries (user_id, date, total_calories, total_protein, total_carbs, total_fat, meal_count, updated_at)
  SELECT 
    user_uuid,
    meal_date,
    COALESCE(SUM(calories), 0)::INTEGER,
    COALESCE(SUM((macros->>'protein')::numeric), 0),
    COALESCE(SUM((macros->>'carbs')::numeric), 0),
    COALESCE(SUM((macros->>'fat')::numeric), 0),
    COUNT(*)::INTEGER,
    NOW()
  FROM meals
  WHERE user_id = user_uuid
    -- CRITICAL: Only include meals from the exact same date
    -- DATE() function extracts date part, ensuring we only count meals from this date
    AND DATE(created_at) = meal_date
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
    WHERE user_id = user_uuid 
      AND DATE(created_at) = meal_date
  ) THEN
    DELETE FROM daily_summaries 
    WHERE user_id = user_uuid 
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
-- VERIFICATION: Check if trigger is working correctly
-- ============================================
-- Run this query to verify the trigger is calculating correctly:
-- 
-- SELECT 
--   m.id,
--   m.user_id,
--   m.food_name,
--   m.calories,
--   DATE(m.created_at) as meal_date,
--   ds.date as summary_date,
--   ds.total_calories,
--   ds.meal_count
-- FROM meals m
-- LEFT JOIN daily_summaries ds ON m.user_id = ds.user_id AND DATE(m.created_at) = ds.date
-- WHERE m.user_id = 'your-user-id-here'
-- ORDER BY m.created_at DESC
-- LIMIT 10;
--
-- This should show that each meal's DATE(created_at) matches the summary's date

