# Backend Architecture - How It Works

## 🏗️ Current Database Structure

### Tables (No Views Currently)

**1. `profiles` Table**
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,  -- Links to Supabase Auth
  goal TEXT,                                 -- lose/maintain/gain
  age INTEGER,
  gender TEXT,                               -- male/female/other
  weight DECIMAL,
  height DECIMAL,
  activity_level TEXT,                      -- sedentary/lightly/moderately/very/extremely
  macro_targets JSONB,                       -- { calories, protein, carbs, fat }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**2. `meals` Table**
```sql
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,  -- Links to user
  image_url TEXT,                                -- URL from Supabase Storage
  food_name TEXT NOT NULL,
  calories INTEGER,                              -- Stored as number
  macros JSONB,                                  -- { protein: 50, carbs: 30, fat: 10 }
  ai_advice TEXT,
  created_at TIMESTAMP DEFAULT NOW()             -- Used for filtering by date
);
```

## 🔄 How Data Flows

### Upload Flow (Backend Perspective)

```
1. User uploads image
   ↓
2. Image → Supabase Storage (meal-images bucket)
   ↓
3. Get public URL from Storage
   ↓
4. Save meal to database:
   INSERT INTO meals (user_id, image_url, food_name, calories, macros, ai_advice)
   VALUES (user_id, url, 'Chicken', 300, '{"protein": 50, "carbs": 0, "fat": 7}', 'advice')
   ↓
5. Database returns saved meal with id and created_at
```

### Dashboard Flow (Backend Perspective)

```
1. Dashboard requests meals:
   SELECT * FROM meals WHERE user_id = 'xxx' ORDER BY created_at DESC
   ↓
2. Supabase returns ALL meals for user
   ↓
3. Frontend filters by date (using isSameDay helper)
   ↓
4. Frontend calculates totals (using reduce function)
   ↓
5. Frontend displays in ProgressCircle components
```

## 🧮 Where Calculations Happen

### Current Architecture: **Frontend Calculations**

**All macro totals are calculated in the frontend:**
- ✅ Database stores individual meal data
- ✅ Frontend fetches all meals
- ✅ Frontend filters meals by date (today)
- ✅ Frontend sums up calories and macros
- ✅ Frontend displays totals

**Why this approach?**
- ✅ Simple and flexible
- ✅ No database overhead
- ✅ Easy to change calculations
- ✅ Works for daily/weekly/monthly views

**Potential issues:**
- ⚠️ If frontend filtering fails → totals show 0
- ⚠️ If date comparison fails → meals not included
- ⚠️ If type conversion fails → calculations wrong

## 🔍 Why Macros Might Not Be Updating

### Most Likely Causes (Frontend Issues)

1. **Date Filtering Issue**
   - Meals saved with `created_at` timestamp
   - Frontend compares `meal.createdAt` with `today`
   - If timezone mismatch → `isSameDay()` returns false
   - **Fix:** Check date comparison in console logs

2. **Type Conversion Issue**
   - Database stores `calories` as INTEGER
   - Database stores `macros` as JSONB
   - Frontend must convert to numbers
   - If conversion fails → totals stay 0
   - **Fix:** Check `caloriesType` and `macrosType` in logs

3. **State Update Issue**
   - Dashboard fetches meals
   - Sets `allMeals` state
   - Filters meals → `filteredMeals`
   - If state doesn't update → UI shows old data
   - **Fix:** Check if `setAllMeals()` is called

4. **Refetch Not Triggering**
   - After upload, dashboard should refetch
   - If refetch doesn't happen → old data shown
   - **Fix:** Check refetch triggers (URL param, focus, visibility)

### Less Likely Causes (Backend Issues)

1. **RLS Policy Blocking**
   - If RLS blocks SELECT → no meals returned
   - **Check:** Console should show error

2. **Data Not Saved**
   - If INSERT fails → meal not in database
   - **Check:** Console should show `❌ Database error`

3. **Wrong User ID**
   - If `user_id` doesn't match → meals not found
   - **Check:** Verify `user.id` matches `meal.user_id`

## 📊 Should We Add Database Views?

### Option 1: Daily Totals View (Could Help)

**Create a view that pre-calculates daily totals:**

```sql
CREATE OR REPLACE VIEW daily_meal_totals AS
SELECT 
  user_id,
  DATE(created_at) as meal_date,
  COUNT(*) as meal_count,
  SUM(calories) as total_calories,
  SUM((macros->>'protein')::numeric) as total_protein,
  SUM((macros->>'carbs')::numeric) as total_carbs,
  SUM((macros->>'fat')::numeric) as total_fat
FROM meals
GROUP BY user_id, DATE(created_at);
```

**Pros:**
- ✅ Pre-calculated totals (faster queries)
- ✅ Can query directly: `SELECT * FROM daily_meal_totals WHERE user_id = 'xxx' AND meal_date = CURRENT_DATE`
- ✅ Less frontend processing

**Cons:**
- ⚠️ More complex database setup
- ⚠️ Still need to handle timezone issues
- ⚠️ View needs to be updated when meals change
- ⚠️ Doesn't solve the root cause (likely frontend filtering)

### Option 2: Materialized View (For Performance)

```sql
CREATE MATERIALIZED VIEW daily_meal_totals_mv AS
SELECT 
  user_id,
  DATE(created_at) as meal_date,
  COUNT(*) as meal_count,
  SUM(calories) as total_calories,
  SUM((macros->>'protein')::numeric) as total_protein,
  SUM((macros->>'carbs')::numeric) as total_carbs,
  SUM((macros->>'fat')::numeric) as total_fat
FROM meals
GROUP BY user_id, DATE(created_at);

-- Refresh when needed
REFRESH MATERIALIZED VIEW daily_meal_totals_mv;
```

**Pros:**
- ✅ Very fast queries
- ✅ Good for analytics

**Cons:**
- ⚠️ Needs manual refresh
- ⚠️ Overkill for this use case

### Option 3: Computed Columns (Not Recommended)

PostgreSQL doesn't support computed columns directly, would need triggers.

## 🎯 Recommendation: **Keep Current Architecture**

**Why:**
1. ✅ Current setup is correct (simple tables)
2. ✅ Issue is likely frontend filtering/calculation
3. ✅ Views won't fix the root cause
4. ✅ Frontend calculation is more flexible

**What to do instead:**
1. ✅ Fix frontend date filtering
2. ✅ Fix frontend type conversion
3. ✅ Fix frontend state updates
4. ✅ Add better error handling

## 🔧 How to Debug

### Step 1: Check Database Directly

Run in Supabase SQL Editor:
```sql
-- Check if meals are saved
SELECT 
  id,
  user_id,
  food_name,
  calories,
  macros,
  created_at,
  DATE(created_at) as meal_date,
  CURRENT_DATE as today
FROM meals
WHERE user_id = 'your-user-id-here'
ORDER BY created_at DESC;
```

**What to check:**
- ✅ Are meals in the database?
- ✅ Does `meal_date` match `today`?
- ✅ Are `calories` and `macros` populated?

### Step 2: Check Frontend Logs

Look for these console logs:
```
📦 Raw Supabase response: { mealsCount: X, ... }
🔄 Filtering meals, period: daily
🍽️ Meal: { isSameDay: true/false, ... }
💯 Final totals calculated: { calories: X, ... }
```

### Step 3: Check Date Comparison

The issue is likely here:
```typescript
// In app/dashboard/page.tsx
const today = new Date()  // Current local time
const filtered = allMeals.filter((meal) => {
  const mealDate = new Date(meal.createdAt)  // From database (UTC)
  return isSameDay(mealDate, today)  // Compare local dates
})
```

**Potential issue:**
- Database stores UTC timestamps
- Frontend compares local dates
- If timezone offset → dates might not match

## 🚀 Optional: Add Index for Performance

If you have many meals, add an index:

```sql
-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_meals_user_date 
ON meals(user_id, DATE(created_at));

-- Index for real-time subscriptions
CREATE INDEX IF NOT EXISTS idx_meals_user_created 
ON meals(user_id, created_at DESC);
```

## 📝 Summary

**Current Backend:**
- ✅ Simple tables (profiles, meals)
- ✅ No views needed
- ✅ No computed columns needed
- ✅ RLS policies for security
- ✅ Real-time subscriptions for updates

**Issue Location:**
- 🔍 Likely in **frontend** (date filtering, type conversion, state updates)
- 🔍 Not in **backend** (database structure is correct)

**Next Steps:**
1. Check console logs to see where it breaks
2. Verify date comparison is working
3. Verify type conversion is working
4. Verify state updates are working
5. Only add views if you need performance optimization

