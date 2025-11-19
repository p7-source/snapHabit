-- Daily Summaries Table - Pre-calculated Cumulative Totals
-- This table stores daily totals for each user, updated automatically via triggers
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE DAILY_SUMMARIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
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
-- 2. CREATE INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date 
ON daily_summaries(user_id, date DESC);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Users can insert own summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Users can update own summaries" ON daily_summaries;

-- Create policies
CREATE POLICY "Users can read own summaries"
  ON daily_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
  ON daily_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries"
  ON daily_summaries FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE FUNCTION TO UPDATE/INSERT SUMMARY
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
    meal_date := DATE(OLD.created_at);
  ELSE
    user_uuid := NEW.user_id;
    meal_date := DATE(NEW.created_at);
  END IF;

  -- Recalculate totals for this user and date
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
-- 6. CREATE TRIGGERS
-- ============================================

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trigger_update_daily_summary_insert ON meals;
DROP TRIGGER IF EXISTS trigger_update_daily_summary_update ON meals;
DROP TRIGGER IF EXISTS trigger_update_daily_summary_delete ON meals;

-- Create triggers
CREATE TRIGGER trigger_update_daily_summary_insert
  AFTER INSERT ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary();

CREATE TRIGGER trigger_update_daily_summary_update
  AFTER UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary();

CREATE TRIGGER trigger_update_daily_summary_delete
  AFTER DELETE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary();

-- ============================================
-- 7. BACKFILL EXISTING DATA (Optional)
-- ============================================
-- This will create summaries for all existing meals

INSERT INTO daily_summaries (user_id, date, total_calories, total_protein, total_carbs, total_fat, meal_count, updated_at)
SELECT 
  user_id,
  DATE(created_at) as date,
  COALESCE(SUM(calories), 0)::INTEGER as total_calories,
  COALESCE(SUM((macros->>'protein')::numeric), 0) as total_protein,
  COALESCE(SUM((macros->>'carbs')::numeric), 0) as total_carbs,
  COALESCE(SUM((macros->>'fat')::numeric), 0) as total_fat,
  COUNT(*)::INTEGER as meal_count,
  NOW() as updated_at
FROM meals
GROUP BY user_id, DATE(created_at)
ON CONFLICT (user_id, date)
DO UPDATE SET
  total_calories = EXCLUDED.total_calories,
  total_protein = EXCLUDED.total_protein,
  total_carbs = EXCLUDED.total_carbs,
  total_fat = EXCLUDED.total_fat,
  meal_count = EXCLUDED.meal_count,
  updated_at = NOW();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'daily_summaries';

-- Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'meals'
  AND trigger_name LIKE '%daily_summary%';

-- View today's summary for a user (replace 'user-id-here' with actual user ID)
-- SELECT * FROM daily_summaries 
-- WHERE user_id = 'user-id-here' 
--   AND date = CURRENT_DATE;

