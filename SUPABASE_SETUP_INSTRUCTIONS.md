# Supabase Setup Instructions

## 🚀 Quick Setup

### Step 1: Run the SQL Script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Copy and paste the entire contents of `supabase-setup.sql`
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for "Success. No rows returned" message

### Step 2: Verify Tables Were Created

1. Go to **Table Editor** in Supabase Dashboard
2. You should see two tables:
   - ✅ `profiles`
   - ✅ `meals`

### Step 3: Verify Policies

1. Go to **Authentication** → **Policies** (or check in Table Editor)
2. For `profiles` table, you should see:
   - ✅ "Users can read own profile"
   - ✅ "Users can create own profile"
   - ✅ "Users can update own profile"
3. For `meals` table, you should see:
   - ✅ "Users can read own meals"
   - ✅ "Users can insert own meals"
   - ✅ "Users can update own meals"
   - ✅ "Users can delete own meals"

## ✅ What the Script Does

1. **Creates tables** (if they don't exist):
   - `profiles` - User profile data
   - `meals` - Meal entries

2. **Enables RLS** (Row Level Security):
   - Ensures users can only access their own data

3. **Drops existing policies** (if any):
   - Prevents "policy already exists" errors

4. **Creates new policies**:
   - Users can read/create/update their own profiles
   - Users can read/insert/update/delete their own meals

## 🧪 Test After Setup

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Try onboarding:**
   - Register a new account
   - Complete onboarding
   - Should save profile successfully

3. **Check console:**
   - Should see "✅ Profile saved successfully" message
   - No errors

## 🐛 If You Still Get Errors

### Error: "relation does not exist"
- **Fix:** Make sure you ran the SQL script completely
- Check Table Editor to verify tables exist

### Error: "permission denied"
- **Fix:** Check that RLS policies were created
- Verify policies are published (not just saved)

### Error: "duplicate key value"
- **Fix:** This is normal if profile already exists
- The code will handle updates automatically

## 📋 Quick Reference

**Table: `profiles`**
- Primary Key: `id` (UUID, references auth.users)
- Columns: goal, age, gender, weight, height, activity_level, macro_targets, created_at, updated_at

**Table: `meals`**
- Primary Key: `id` (UUID)
- Foreign Key: `user_id` (references auth.users)
- Columns: image_url, food_name, calories, macros, ai_advice, created_at

---

**After running the SQL script, try saving your profile again!**

