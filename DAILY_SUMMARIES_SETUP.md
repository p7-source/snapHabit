# Daily Summaries Table - Setup Guide

## 🎯 What This Does

Creates a `daily_summaries` table that **pre-calculates** cumulative macro totals for each user per day. This is updated automatically via database triggers whenever meals are inserted, updated, or deleted.

## ✅ Benefits

1. **Faster queries** - No need to calculate on-the-fly
2. **Always accurate** - Automatically updated via triggers
3. **Better for analytics** - Easy to query historical data
4. **Resolves update issues** - Totals are stored, not calculated

## 📋 Setup Steps

### Step 1: Run SQL Script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire contents of `supabase-daily-summaries.sql`
3. Click **Run** (or press Ctrl+Enter)
4. Verify success - you should see:
   - Table created
   - Triggers created
   - Existing data backfilled

### Step 2: Verify Setup

Run these queries in SQL Editor to verify:

```sql
-- Check table exists
SELECT * FROM daily_summaries LIMIT 5;

-- Check triggers exist
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers
WHERE event_object_table = 'meals'
  AND trigger_name LIKE '%daily_summary%';

-- Check today's summary (replace with your user ID)
SELECT * FROM daily_summaries 
WHERE user_id = 'your-user-id-here' 
  AND date = CURRENT_DATE;
```

### Step 3: Update Frontend (Optional)

The frontend can now use the `daily_summaries` table instead of calculating on-the-fly.

**Option A: Use Daily Summaries (Recommended)**
- Faster queries
- Pre-calculated totals
- Use `getTodaySummary()` from `lib/daily-summaries.ts`

**Option B: Keep Current Approach**
- Calculate on-the-fly from meals
- More flexible
- Current implementation

## 🔄 How It Works

### Automatic Updates

When a meal is inserted/updated/deleted:
1. Trigger fires → `update_daily_summary()` function
2. Function recalculates totals for that user/date
3. Updates or inserts row in `daily_summaries` table
4. If no meals exist for that date, deletes the summary

### Example Flow

**User uploads meal:**
```
1. INSERT INTO meals (user_id, calories, macros, created_at)
   VALUES ('user-123', 450, '{"protein":35,"carbs":25,"fat":20}', NOW())

2. Trigger fires automatically

3. Function calculates:
   SELECT SUM(calories), SUM(protein), SUM(carbs), SUM(fat), COUNT(*)
   FROM meals
   WHERE user_id = 'user-123' AND DATE(created_at) = '2024-11-18'

4. INSERT/UPDATE daily_summaries:
   - user_id: 'user-123'
   - date: '2024-11-18'
   - total_calories: 450
   - total_protein: 35
   - total_carbs: 25
   - total_fat: 20
   - meal_count: 1
```

**User uploads second meal:**
```
1. INSERT INTO meals (user_id, calories, macros, created_at)
   VALUES ('user-123', 350, '{"protein":20,"carbs":30,"fat":15}', NOW())

2. Trigger fires automatically

3. Function recalculates (now 2 meals):
   - total_calories: 800 (450 + 350)
   - total_protein: 55 (35 + 20)
   - total_carbs: 55 (25 + 30)
   - total_fat: 35 (20 + 15)
   - meal_count: 2

4. UPDATE daily_summaries with new totals
```

## 📊 Using in Frontend

### Current Approach (Calculate On-the-Fly)

```typescript
// app/dashboard/page.tsx
const allMeals = await fetchAllMeals(userId)
const todaysMeals = allMeals.filter(meal => isSameDay(meal.createdAt, today))
const totals = todaysMeals.reduce((sum, meal) => ({
  calories: sum.calories + meal.calories,
  // ...
}), { calories: 0, ... })
```

### New Approach (Use Daily Summaries)

```typescript
// app/dashboard/page.tsx
import { getTodaySummary } from '@/lib/daily-summaries'

const summary = await getTodaySummary(userId)
const totals = summary ? {
  calories: summary.totalCalories,
  protein: summary.totalProtein,
  carbs: summary.totalCarbs,
  fat: summary.totalFat,
} : { calories: 0, protein: 0, carbs: 0, fat: 0 }
```

## 🔍 Troubleshooting

### Issue: Summaries not updating

**Check:**
1. Triggers exist: `SELECT * FROM information_schema.triggers WHERE event_object_table = 'meals'`
2. Function exists: `SELECT * FROM pg_proc WHERE proname = 'update_daily_summary'`
3. Test trigger manually:
   ```sql
   -- Insert a test meal
   INSERT INTO meals (user_id, food_name, calories, macros)
   VALUES ('your-user-id', 'Test', 100, '{"protein":10,"carbs":10,"fat":10}');
   
   -- Check if summary was created/updated
   SELECT * FROM daily_summaries 
   WHERE user_id = 'your-user-id' 
     AND date = CURRENT_DATE;
   ```

### Issue: Wrong totals

**Check:**
1. Verify meals exist: `SELECT * FROM meals WHERE user_id = 'xxx' AND DATE(created_at) = CURRENT_DATE`
2. Verify summary: `SELECT * FROM daily_summaries WHERE user_id = 'xxx' AND date = CURRENT_DATE`
3. Manually recalculate:
   ```sql
   SELECT 
     SUM(calories) as total_calories,
     SUM((macros->>'protein')::numeric) as total_protein,
     COUNT(*) as meal_count
   FROM meals
   WHERE user_id = 'your-user-id'
     AND DATE(created_at) = CURRENT_DATE;
   ```

### Issue: Timezone problems

**Fix:** The triggers use `DATE(created_at)` which uses the database timezone. If you need local timezone:
- Modify the trigger function to use timezone conversion
- Or ensure `created_at` is stored in the correct timezone

## 🎯 Recommendation

**Use Daily Summaries if:**
- ✅ You want faster queries
- ✅ You need historical analytics
- ✅ Current on-the-fly calculation isn't working
- ✅ You want pre-calculated totals

**Keep Current Approach if:**
- ✅ On-the-fly calculation works fine
- ✅ You want simpler architecture
- ✅ You don't need historical summaries

## 📝 Next Steps

1. **Run the SQL script** (`supabase-daily-summaries.sql`)
2. **Verify it works** - upload a meal and check `daily_summaries` table
3. **Update frontend** (optional) - use `getTodaySummary()` instead of calculating
4. **Test thoroughly** - upload multiple meals and verify totals

The table and triggers will handle everything automatically! 🎉

