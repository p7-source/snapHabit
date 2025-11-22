-- Fix for daily_summaries timezone issue
-- This adds a date column to meals table and updates the trigger to use it

-- ============================================
-- STEP 1: Add date column to meals table
-- ============================================
ALTER TABLE meals ADD COLUMN IF NOT EXISTS date DATE;

-- Set date for existing meals (using UTC date for backward compatibility)
UPDATE meals SET date = DATE(created_at) WHERE date IS NULL;

-- Make date NOT NULL (after setting values for existing rows)
ALTER TABLE meals ALTER COLUMN date SET NOT NULL;

-- ============================================
-- STEP 2: Update trigger to use date column
-- ============================================
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  meal_date DATE;
  user_uuid UUID;
BEGIN
  -- Determine which user_id and date to use
  IF TG_OP = 'DELETE' THEN
    user_uuid := OLD.user_id;
    -- Use date column instead of DATE(created_at) to match local timezone
    meal_date := OLD.date;
  ELSE
    user_uuid := NEW.user_id;
    -- Use date column instead of DATE(created_at) to match local timezone
    meal_date := NEW.date;
  END IF;

  -- Recalculate totals for this user and date
  -- Use date column in WHERE clause to ensure we only count meals from the same date
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
    AND date = meal_date  -- Use date column instead of DATE(created_at)
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
      AND date = meal_date  -- Use date column instead of DATE(created_at)
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
-- STEP 3: Verify the changes
-- ============================================
-- Check that date column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'meals' AND column_name = 'date';

-- Check that trigger function is updated
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_daily_summary';

