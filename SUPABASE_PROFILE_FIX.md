# Fix Profile Save Error in Supabase

## 🔍 Common Causes

The error `{}` usually means one of these:

1. **Table doesn't exist** - Most common!
2. **RLS policies blocking insert**
3. **Missing required fields**
4. **Wrong column names**

## ✅ Step-by-Step Fix

### Step 1: Verify Table Exists

1. Go to Supabase Dashboard → Table Editor
2. Check if `profiles` table exists
3. If not, create it using SQL Editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  goal TEXT,
  age INTEGER,
  gender TEXT,
  weight DECIMAL,
  height DECIMAL,
  activity_level TEXT,
  macro_targets JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2: Enable RLS and Add Policies

```sql
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Step 3: Verify Table Structure

Check that your table has these exact columns:
- `id` (UUID, Primary Key, References auth.users)
- `goal` (TEXT)
- `age` (INTEGER)
- `gender` (TEXT)
- `weight` (DECIMAL)
- `height` (DECIMAL)
- `activity_level` (TEXT)
- `macro_targets` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Step 4: Test the Insert Manually

In Supabase SQL Editor, try:

```sql
-- Replace 'your-user-id-here' with actual user ID
INSERT INTO profiles (
  id, goal, age, gender, weight, height, activity_level, macro_targets
) VALUES (
  'your-user-id-here',
  'maintain',
  30,
  'male',
  75.5,
  175.0,
  'moderate',
  '{"calories": 2000, "protein": 150, "carbs": 200, "fat": 65}'::jsonb
);
```

If this fails, check the error message.

## 🐛 Debugging Steps

1. **Check browser console** - The updated code now logs detailed errors
2. **Check Supabase logs** - Dashboard → Logs → API Logs
3. **Verify user is authenticated** - Check `user.id` is not null
4. **Check RLS policies** - Make sure they're published

## 🔧 Alternative: Try Insert Instead of Upsert

If upsert still fails, try this simpler approach:

```typescript
// Try insert first, if it fails, do update
const { error: insertError } = await supabase
  .from('profiles')
  .insert(profileData)

if (insertError) {
  // If insert fails (profile exists), try update
  const { error: updateError } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', profile.userId)
  
  if (updateError) {
    // Handle error
  }
}
```

## 📋 Quick Checklist

- [ ] `profiles` table exists in Supabase
- [ ] Table has all required columns
- [ ] RLS is enabled on the table
- [ ] RLS policies are created and published
- [ ] User is authenticated (check `user.id`)
- [ ] Environment variables are set correctly
- [ ] Check browser console for detailed error logs

## 🆘 Still Not Working?

Run this in your browser console after trying to save:

```javascript
// Check if Supabase is initialized
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Check current user
const { getSupabaseClient } = await import('/lib/supabase')
const supabase = getSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)
```

Then check the detailed error logs in the console - they should now show exactly what's wrong!

