-- Daily Logins Table for Tracking User Login Streaks
-- Run this in Supabase SQL Editor

-- Create daily_logins table
CREATE TABLE IF NOT EXISTS daily_logins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  login_date DATE NOT NULL,  -- Date only (no time), for daily tracking
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, login_date)  -- One login record per user per day
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_logins_user_date ON daily_logins(user_id, login_date DESC);

-- Enable Row Level Security
ALTER TABLE daily_logins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own logins" ON daily_logins;
DROP POLICY IF EXISTS "Users can insert own logins" ON daily_logins;

-- Create policies
CREATE POLICY "Users can read own logins"
  ON daily_logins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logins"
  ON daily_logins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE daily_logins IS 'Tracks daily user logins for streak calculation';

