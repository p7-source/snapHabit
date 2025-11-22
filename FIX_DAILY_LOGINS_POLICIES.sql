-- Quick fix for daily_logins table policies
-- Run this if you get the error about policies depending on user_id column

-- Drop all existing policies on daily_logins
DROP POLICY IF EXISTS "Users can read own logins" ON daily_logins;
DROP POLICY IF EXISTS "Users can insert own logins" ON daily_logins;
DROP POLICY IF EXISTS "Users can update own logins" ON daily_logins;
DROP POLICY IF EXISTS "Users can delete own logins" ON daily_logins;

-- Drop any auto-generated policies (they might have different names)
-- This will drop ALL policies on daily_logins table
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all policies and drop them
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'daily_logins'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON daily_logins';
    END LOOP;
END $$;

-- Now alter the column (policies are dropped)
ALTER TABLE daily_logins 
  DROP CONSTRAINT IF EXISTS daily_logins_user_id_fkey;

ALTER TABLE daily_logins 
  ALTER COLUMN user_id TYPE TEXT;

-- Recreate policies
CREATE POLICY "Users can read own logins"
  ON daily_logins FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own logins"
  ON daily_logins FOR INSERT
  WITH CHECK (true);

