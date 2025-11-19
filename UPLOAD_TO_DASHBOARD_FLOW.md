# Upload to Dashboard Flow - Debugging Guide

## Complete Flow Overview

### Step 1: User Uploads Image (`app/upload/page-client.tsx`)

1. **User selects image** → `handleImageSelect()` called
2. **User clicks "Analyze Food"** → Image sent to `/api/analyze-food`
3. **AI analyzes image** → Returns `MealAnalysis` with food name, calories, macros
4. **User adjusts portion** → `adjustedAnalysis` updated with new values
5. **User clicks "Save Meal"** → `handleSave()` called

### Step 2: Save Meal (`handleSave()` function)

**What happens:**
1. ✅ Validates user, image, and analysis exist
2. ✅ Compresses image if > 1MB
3. ✅ Uploads image to Supabase Storage (`meal-images` bucket)
4. ✅ Gets public URL for the image
5. ✅ **Saves meal to Supabase database** (`meals` table)

**Console logs to check:**
```
💾 Saving meal to database...
   Meal document: { user_id, image_url, food_name, calories, macros, ai_advice }
✅ Meal saved successfully to database!
   Saved meal data: { id, user_id, created_at, calories, macros, ... }
   Meal ID: <uuid>
   Meal created_at: <timestamp>
   Meal calories: <number>
   Meal macros: { protein, carbs, fat }
✅ Upload flow completed successfully!
```

**If you see errors:**
- `❌ Database error:` → Check error code, message, and details
- Common errors:
  - `permission denied` → RLS policies not set correctly
  - `relation "meals" does not exist` → Table not created
  - `invalid input syntax` → Data type mismatch

### Step 3: Redirect to Dashboard

**What happens:**
1. User clicks "View Dashboard" button
2. Redirects to `/dashboard?refetch=${Date.now()}`
3. Full page reload (using `window.location.href`)

### Step 4: Dashboard Loads (`app/dashboard/page.tsx`)

**Initial Fetch (useEffect #1):**
1. ✅ Fetches user profile
2. ✅ Fetches ALL meals from Supabase
3. ✅ Sets up real-time subscription

**Console logs to check:**
```
📦 Raw Supabase response: {
  mealsCount: <number>,
  error: null/error,
  firstMeal: { id, user_id, food_name, calories, macros, created_at },
  allMealIds: [<uuid1>, <uuid2>, ...]
}
🔍 All meals fetched: [<meal objects>]
📊 Total meals count: <number>
📋 Sample meal structure: { id, foodName, calories, macros, createdAt, ... }
```

**If you see errors:**
- `❌ Error fetching meals:` → Check error code, message, details
- `mealsCount: 0` → No meals found (check user_id matches)

### Step 5: Filter Meals by Date

**What happens:**
1. Dashboard filters meals using `isSameDay()` helper
2. Compares `meal.createdAt` with `today` (current date)

**Console logs to check:**
```
📅 Current date for filtering: {
  today: <ISO string>,
  todayLocal: <local string>,
  todayDateString: <date string>,
  timezoneOffset: <number>,
  todayYear: <number>,
  todayMonth: <number>,
  todayDay: <number>
}
🔄 Filtering meals, period: daily
📊 All meals before filtering: <number>
🍽️ Meal: <food name> {
  mealDateISO: <ISO string>,
  mealDate: <ISO string>,
  today: <ISO string>,
  isSameDay: true/false,
  mealLocalDate: <date string>,
  todayLocalDate: <date string>,
  mealYear: <number>,
  mealMonth: <number>,
  mealDay: <number>,
  todayYear: <number>,
  todayMonth: <number>,
  todayDay: <number>
}
✅ Filtered result: [<meal objects>]
🎯 Filtered meals for today: [<meal objects>]
🔢 Filtered meals count: <number>
```

**Common issues:**
- `isSameDay: false` → Timezone mismatch or date comparison issue
- `Filtered meals count: 0` → No meals match today's date
- Check `mealYear`, `mealMonth`, `mealDay` vs `todayYear`, `todayMonth`, `todayDay`

### Step 6: Calculate Totals (`components/dashboard/DailyView.tsx`)

**What happens:**
1. Receives filtered meals as props
2. Calculates cumulative totals using `reduce()`
3. Displays totals in `ProgressCircle` components

**Console logs to check:**
```
🎯 DailyView rendered with meals: <number> meals
📋 Meals received in DailyView: [
  { food, calories, caloriesType, macros, macrosType, date }
]
➕ [1/3] Processing meal for totals: {
  foodName: <name>,
  calories: <number>,
  protein: <number>,
  carbs: <number>,
  fat: <number>,
  currentAcc: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  newTotals: { calories: <sum>, protein: <sum>, carbs: <sum>, fat: <sum> }
}
💯 Final totals calculated: { calories, protein, carbs, fat }
📊 Totals breakdown: {
  mealsCount: <number>,
  totalCalories: <number>,
  totalProtein: <number>,
  totalCarbs: <number>,
  totalFat: <number>,
  targetCalories: <number>,
  targetProtein: <number>
}
🎨 Rendering ProgressCircle for Calories: {
  value: <number>,
  max: <number>,
  mealsCount: <number>,
  totals: { calories, protein, carbs, fat },
  profileTargets: { calories, protein, carbs, fat }
}
```

**Common issues:**
- `value: 0` → Totals not calculated (check if meals array is empty)
- `caloriesType: "string"` → Type conversion issue (should be "number")
- `macrosType: "string"` → Macros not properly parsed

### Step 7: Real-time Updates

**What happens:**
1. Supabase real-time subscription listens for INSERT events
2. When new meal is inserted, triggers refetch

**Console logs to check:**
```
🆕 Real-time INSERT event detected, refetching meals...
✅ Real-time refetch completed: <number> meals
📋 New meal added: {
  food: <name>,
  calories: <number>,
  date: <ISO string>
}
```

**If real-time doesn't work:**
- Check Supabase dashboard → Replication → Is real-time enabled?
- Check browser console for subscription errors
- App will still work with focus/visibility refetching

## Debugging Checklist

### ✅ Check 1: Meal is Saved to Database
1. Open browser console
2. Upload a meal
3. Look for: `✅ Meal saved successfully to database!`
4. Check: `Meal ID`, `Meal created_at`, `Meal calories`, `Meal macros`
5. **If missing:** Check for `❌ Database error:` and fix the issue

### ✅ Check 2: Dashboard Fetches Meals
1. Navigate to dashboard
2. Look for: `📦 Raw Supabase response:`
3. Check: `mealsCount` should be > 0
4. Check: `allMealIds` should include the meal ID from step 1
5. **If 0 meals:** Check user_id matches, check RLS policies

### ✅ Check 3: Meals Filtered by Date
1. Look for: `🔄 Filtering meals, period: daily`
2. Check: `🍽️ Meal:` logs show `isSameDay: true`
3. Check: `🔢 Filtered meals count:` should match number of meals today
4. **If 0 filtered:** Check date comparison (year, month, day match)

### ✅ Check 4: Totals Calculated
1. Look for: `💯 Final totals calculated:`
2. Check: `totalCalories` should be sum of all meals
3. Check: `🎨 Rendering ProgressCircle` shows correct `value` and `max`
4. **If totals are 0:** Check if meals array is empty or values are strings

### ✅ Check 5: ProgressCircle Updates
1. Check browser DOM: `<ProgressCircle value={X} max={Y}>`
2. `value` should match `totalCalories` from step 4
3. `max` should match `profile.macroTargets.calories`
4. **If value is 0:** Check if `filteredMeals` is empty or totals calculation failed

## Common Issues & Solutions

### Issue 1: "Meal saved but dashboard shows 0"
**Solution:**
- Check if `created_at` timestamp is today's date
- Check timezone: `mealDate` vs `today` comparison
- Verify `isSameDay()` function is working correctly

### Issue 2: "Totals are 0 but meals exist"
**Solution:**
- Check if `calories` and `macros` are numbers (not strings)
- Check `caloriesType` and `macrosType` in console logs
- Verify type conversion in meal mapping

### Issue 3: "Real-time not updating"
**Solution:**
- Check Supabase real-time is enabled
- App will still work with focus/visibility refetching
- Check console for subscription errors

### Issue 4: "Dashboard doesn't refetch after upload"
**Solution:**
- Check URL has `?refetch=` parameter
- Check console for: `🔄 Refetch parameter detected`
- Verify `refetchMeals()` is called
- Check focus/visibility events are firing

## Quick Test

1. **Upload a meal** → Check console for `✅ Meal saved successfully`
2. **Click "View Dashboard"** → Check console for `🔄 Refetch parameter detected`
3. **Check dashboard** → Should show meal and updated totals
4. **Upload another meal** → Should add to existing totals
5. **Check console** → All logs should show correct values

## Still Not Working?

Share these console logs:
1. `✅ Meal saved successfully` log (from upload)
2. `📦 Raw Supabase response` log (from dashboard)
3. `🔄 Filtering meals` logs (from dashboard)
4. `💯 Final totals calculated` log (from DailyView)
5. `🎨 Rendering ProgressCircle` log (from DailyView)

These logs will show exactly where the flow is breaking.

