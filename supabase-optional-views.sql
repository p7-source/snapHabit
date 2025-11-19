-- Optional Database Views for Macro Tracking
-- These are NOT required - the app works fine without them
-- Only add if you want pre-calculated totals for performance

-- ============================================
-- OPTIONAL VIEW 1: Daily Meal Totals
-- ============================================
-- This view pre-calculates daily totals for each user
-- You can query it directly instead of calculating in frontend

CREATE OR REPLACE VIEW daily_meal_totals AS
SELECT 
  user_id,
  DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York') as meal_date,  -- Adjust timezone as needed
  COUNT(*) as meal_count,
  SUM(calories) as total_calories,
  SUM((macros->>'protein')::numeric) as total_protein,
  SUM((macros->>'carbs')::numeric) as total_carbs,
  SUM((macros->>'fat')::numeric) as total_fat
FROM meals
GROUP BY user_id, DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York');

-- Usage:
-- SELECT * FROM daily_meal_totals 
-- WHERE user_id = 'your-user-id' 
--   AND meal_date = CURRENT_DATE;

-- ============================================
-- OPTIONAL VIEW 2: Today's Totals (Simpler)
-- ============================================
-- This view shows only today's totals for all users

CREATE OR REPLACE VIEW today_meal_totals AS
SELECT 
  user_id,
  COUNT(*) as meal_count,
  SUM(calories) as total_calories,
  SUM((macros->>'protein')::numeric) as total_protein,
  SUM((macros->>'carbs')::numeric) as total_carbs,
  SUM((macros->>'fat')::numeric) as total_fat
FROM meals
WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York') = CURRENT_DATE
GROUP BY user_id;

-- Usage:
-- SELECT * FROM today_meal_totals WHERE user_id = 'your-user-id';

-- ============================================
-- OPTIONAL: Performance Indexes
-- ============================================
-- These indexes speed up queries (especially with many meals)

-- Index for filtering by user and date
CREATE INDEX IF NOT EXISTS idx_meals_user_date 
ON meals(user_id, DATE(created_at));

-- Index for real-time subscriptions (already ordered by created_at)
CREATE INDEX IF NOT EXISTS idx_meals_user_created 
ON meals(user_id, created_at DESC);

-- Index for date filtering
CREATE INDEX IF NOT EXISTS idx_meals_created_date 
ON meals(DATE(created_at));

-- ============================================
-- OPTIONAL: Function to Get Today's Totals
-- ============================================
-- This function returns today's totals for a user
-- Can be called from frontend or used in views

CREATE OR REPLACE FUNCTION get_today_totals(p_user_id UUID)
RETURNS TABLE (
  meal_count BIGINT,
  total_calories BIGINT,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(calories), 0)::BIGINT,
    COALESCE(SUM((macros->>'protein')::numeric), 0),
    COALESCE(SUM((macros->>'carbs')::numeric), 0),
    COALESCE(SUM((macros->>'fat')::numeric), 0)
  FROM meals
  WHERE user_id = p_user_id
    AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York') = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage:
-- SELECT * FROM get_today_totals('your-user-id');

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 1. These views/functions are OPTIONAL
-- 2. The app works fine with just the tables
-- 3. Views won't fix the macro update issue (that's a frontend problem)
-- 4. If you add views, you'll need to update frontend code to use them
-- 5. Timezone handling: Adjust 'America/New_York' to your timezone
-- 6. Views are read-only - they don't store data, just calculate on-the-fly

-- ============================================
-- To Use Views in Frontend (if you add them)
-- ============================================
-- Instead of:
--   supabase.from('meals').select('*').eq('user_id', userId)
-- 
-- You would do:
--   supabase.from('daily_meal_totals').select('*')
--     .eq('user_id', userId)
--     .eq('meal_date', new Date().toISOString().split('T')[0])

