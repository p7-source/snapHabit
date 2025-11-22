# Fix: Daily Summary Timezone Issue

## Problem
When a user logs in, daily summaries are set to 0. But when they upload a meal, the dashboard shows macros from yesterday's total + newly uploaded meal (two days combined).

## Root Cause
Timezone mismatch between:
1. **Frontend initialization**: Uses local timezone dates (e.g., "2025-11-21" in user's local time)
2. **Database trigger**: Uses `DATE(created_at)` which extracts date in UTC timezone

Example:
- User in New York (UTC-5) logs in at 2 AM on Nov 21 (local time)
- Local date: "2025-11-21"
- UTC time: "2025-11-21T07:00:00Z" (7 AM UTC, still Nov 21)
- We initialize summary for "2025-11-21" (local)
- User uploads meal → Database stores `created_at` as UTC timestamp
- Trigger calculates `DATE(created_at)` = "2025-11-21" (UTC) ✅ This matches

But if user logs in at 11 PM on Nov 21 (local):
- Local date: "2025-11-21"  
- UTC time: "2025-11-22T04:00:00Z" (4 AM UTC, already Nov 22)
- We initialize summary for "2025-11-21" (local)
- User uploads meal → Database stores `created_at` as UTC timestamp
- Trigger calculates `DATE(created_at)` = "2025-11-22" (UTC) ❌ Mismatch!

## Solution
We need to ensure the database trigger and frontend initialization use the same date calculation.

### Option 1: Use UTC dates everywhere (Current approach)
- ✅ Simple
- ❌ Poor UX (user's "today" might be different from UTC "today")

### Option 2: Store date column in meals table (Recommended)
Add a `date` column to the `meals` table that stores the date in the user's local timezone, calculated when the meal is inserted.

### Option 3: Use timezone-aware trigger
Modify the trigger to use a timezone setting, but this requires knowing each user's timezone.

## Implementation: Option 2 (Recommended)

### Step 1: Add date column to meals table
```sql
ALTER TABLE meals ADD COLUMN IF NOT EXISTS date DATE;

-- Set date for existing meals
UPDATE meals SET date = DATE(created_at) WHERE date IS NULL;

-- Make date required for new meals
ALTER TABLE meals ALTER COLUMN date SET NOT NULL;

-- Add default to use local date (calculated from created_at)
-- Note: This still uses UTC, but we'll calculate it in the application
```

### Step 2: Update meal insertion to include date
In `app/upload/page-client.tsx`, when inserting a meal, calculate the date in local timezone and include it:

```typescript
const today = new Date()
const localDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const mealDoc = {
  user_id: user.id,
  image_url: storagePath,
  food_name: adjustedAnalysis.foodName,
  calories: ...,
  macros: macrosToSave,
  ai_advice: adjustedAnalysis.aiAdvice || "",
  date: localDateStr, // Add this
}
```

### Step 3: Update trigger to use date column
```sql
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  meal_date DATE;
  user_uuid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    user_uuid := OLD.user_id;
    meal_date := OLD.date; -- Use date column instead of DATE(created_at)
  ELSE
    user_uuid := NEW.user_id;
    meal_date := NEW.date; -- Use date column instead of DATE(created_at)
  END IF;

  -- Rest of the function stays the same, but use date column in WHERE clause
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
    AND date = meal_date -- Use date column
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    meal_count = EXCLUDED.meal_count,
    updated_at = NOW();

  -- Check also uses date column
  IF NOT EXISTS (
    SELECT 1 FROM meals 
    WHERE user_id = user_uuid 
      AND date = meal_date
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
```

## Quick Fix (Temporary)
For now, we've updated the initialization to use UTC dates to match the trigger. This ensures consistency but may cause UX issues for users in timezones far from UTC.

The proper fix is Option 2 above.

