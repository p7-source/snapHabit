# Daily Summaries - Setup Verification Guide

## ✅ Setup Complete

You've successfully run `supabase-daily-summaries.sql`. The following has been set up:

1. ✅ `daily_summaries` table created
2. ✅ Database triggers created (automatically update summaries when meals change)
3. ✅ Existing data backfilled
4. ✅ RLS policies enabled

## 🔍 How to Verify It's Working

### Step 1: Check Table Exists

Run in Supabase SQL Editor:
```sql
SELECT * FROM daily_summaries LIMIT 5;
```

You should see rows with columns:
- `id`, `user_id`, `date`
- `total_calories`, `total_protein`, `total_carbs`, `total_fat`
- `meal_count`, `created_at`, `updated_at`

### Step 2: Check Triggers Are Active

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'meals'
  AND trigger_name LIKE '%daily_summary%';
```

You should see 3 triggers:
- `trigger_update_daily_summary_insert`
- `trigger_update_daily_summary_update`
- `trigger_update_daily_summary_delete`

### Step 3: Test Automatic Updates

1. **Upload a new meal** via the app
2. **Check the summary** was updated:
   ```sql
   SELECT * FROM daily_summaries 
   WHERE user_id = 'YOUR_USER_ID' 
     AND date = CURRENT_DATE;
   ```
3. **Verify totals match** your meals:
   ```sql
   -- Compare summary vs actual meals
   SELECT 
     (SELECT total_calories FROM daily_summaries 
      WHERE user_id = 'YOUR_USER_ID' AND date = CURRENT_DATE) as summary_calories,
     (SELECT SUM(calories) FROM meals 
      WHERE user_id = 'YOUR_USER_ID' AND DATE(created_at) = CURRENT_DATE) as actual_calories;
   ```

### Step 4: Test Delete Updates Summary

1. Delete a meal (if you have delete functionality)
2. Check that the summary was automatically updated

## 🎯 What This Means

### Automatic Updates
- ✅ When you **insert** a meal → Summary automatically updates
- ✅ When you **update** a meal → Summary automatically recalculates
- ✅ When you **delete** a meal → Summary automatically updates

### Performance Benefits
- **Faster queries**: No need to calculate totals from all meals
- **Better for analytics**: Easy to query historical data
- **Consistent data**: Pre-calculated values are always accurate

### Current Status
- **Dashboard**: Currently calculates totals from meals (works perfectly)
- **Summaries**: Available and automatically maintained
- **Future**: Can optimize dashboard to use summaries for even faster loading

## 📊 Using Summaries in Code

The helper functions are available in `lib/daily-summaries.ts`:

```typescript
import { getTodaySummary, getSummaryForDate, getSummariesForRange } from '@/lib/daily-summaries'

// Get today's summary
const summary = await getTodaySummary(userId)

// Get summary for specific date
const summary = await getSummaryForDate(userId, new Date('2024-11-18'))

// Get summaries for date range (for weekly/monthly views)
const summaries = await getSummariesForRange(userId, startDate, endDate)
```

## 🚀 Next Steps

1. **Verify it's working** using the steps above
2. **Test automatic updates** by uploading a meal
3. **Optional**: Optimize dashboard to use summaries (current implementation works fine)
4. **Use summaries** for weekly/monthly analytics views

## 🐛 Troubleshooting

### Summaries not updating?
- Check triggers exist (Step 2 above)
- Check Supabase logs for trigger errors
- Verify RLS policies allow inserts/updates

### Totals don't match?
- Check timezone handling (summaries use DATE() which uses database timezone)
- Verify meal dates are correct
- Check if meals exist for that date

### Table doesn't exist?
- Re-run `supabase-daily-summaries.sql`
- Check for SQL errors in Supabase dashboard

