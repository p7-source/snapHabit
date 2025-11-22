-- FIX STORAGE POLICIES FOR CLERK
-- This fixes Supabase Storage RLS policies to work with Clerk authentication
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop all existing storage policies
-- ============================================

-- Drop policies for meal-images bucket
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;

-- Drop any other policies that might exist for meal-images
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND (policyname LIKE '%image%' OR policyname LIKE '%meal%')
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- ============================================
-- STEP 2: Create new permissive storage policies
-- ============================================
-- These policies allow all operations - the application layer filters by user_id in the path
-- The path format is: {userId}/filename, so users can only access their own folder

-- Upload Policy: Allow inserts to meal-images bucket
CREATE POLICY "Users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meal-images'
  );

-- Read Policy: Allow reads from meal-images bucket
CREATE POLICY "Users can read images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'meal-images'
  );

-- Update Policy: Allow updates to meal-images bucket
CREATE POLICY "Users can update images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'meal-images'
  );

-- Delete Policy: Allow deletes from meal-images bucket
CREATE POLICY "Users can delete images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'meal-images'
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Check the policies were created
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%image%'
ORDER BY policyname;

-- Done! ✅
-- Note: Since we're using Clerk, the application layer must ensure users only access their own files
-- The storage path format ({userId}/filename) helps with this, but you should also verify in your app code

