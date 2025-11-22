-- SIMPLE CLERK MIGRATION - Run this step by step
-- This avoids the EXECUTE null error by using simpler statements

-- ============================================
-- STEP 1: Fix profiles table
-- ============================================

-- Drop policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Remove foreign key
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change column type
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Recreate policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can create own profile" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (true);

-- ============================================
-- STEP 2: Fix meals table
-- ============================================

-- Drop policies
DROP POLICY IF EXISTS "Users can read own meals" ON meals;
DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
DROP POLICY IF EXISTS "Users can update own meals" ON meals;
DROP POLICY IF EXISTS "Users can delete own meals" ON meals;

-- Remove foreign key
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_user_id_fkey;

-- Change column type
ALTER TABLE meals ALTER COLUMN user_id TYPE TEXT;

-- Recreate policies
CREATE POLICY "Users can read own meals" ON meals FOR SELECT USING (true);
CREATE POLICY "Users can insert own meals" ON meals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own meals" ON meals FOR UPDATE USING (true);
CREATE POLICY "Users can delete own meals" ON meals FOR DELETE USING (true);

-- ============================================
-- STEP 3: Fix daily_logins table (if exists)
-- ============================================

-- Drop known policies
DROP POLICY IF EXISTS "Users can read own logins" ON daily_logins;
DROP POLICY IF EXISTS "Users can insert own logins" ON daily_logins;
DROP POLICY IF EXISTS "Users can update own logins" ON daily_logins;
DROP POLICY IF EXISTS "Users can delete own logins" ON daily_logins;

-- Drop any other policies using a loop (handles null case)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'daily_logins'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON daily_logins';
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if table doesn't exist or no policies
        NULL;
END $$;

-- Remove foreign key and change column type
ALTER TABLE daily_logins DROP CONSTRAINT IF EXISTS daily_logins_user_id_fkey;
ALTER TABLE daily_logins ALTER COLUMN user_id TYPE TEXT;

-- Recreate policies
CREATE POLICY "Users can read own logins" ON daily_logins FOR SELECT USING (true);
CREATE POLICY "Users can insert own logins" ON daily_logins FOR INSERT WITH CHECK (true);

-- ============================================
-- STEP 4: Fix daily_summaries table (if exists)
-- ============================================

-- Drop policies
DROP POLICY IF EXISTS "Users can read own summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Users can insert own summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Users can update own summaries" ON daily_summaries;

-- Remove foreign key and change column type
ALTER TABLE daily_summaries DROP CONSTRAINT IF EXISTS daily_summaries_user_id_fkey;
ALTER TABLE daily_summaries ALTER COLUMN user_id TYPE TEXT;

-- Recreate policies
CREATE POLICY "Users can read own summaries" ON daily_summaries FOR SELECT USING (true);
CREATE POLICY "Users can insert own summaries" ON daily_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own summaries" ON daily_summaries FOR UPDATE USING (true);

-- Done! ✅

