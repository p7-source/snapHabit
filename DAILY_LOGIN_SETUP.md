# Daily Login Tracking Setup Guide

## Overview
This feature tracks when users log in each day and calculates their login streak (consecutive days logged in). This encourages daily engagement with the app.

## Setup Steps

### Step 1: Create Database Table
Run the SQL script in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase-daily-logins.sql`
3. Click "Run" to execute

This creates:
- `daily_logins` table to track login dates
- Indexes for fast queries
- Row Level Security (RLS) policies

### Step 2: Verify Table Creation
1. Go to Supabase Dashboard → Table Editor
2. Verify `daily_logins` table exists with columns:
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, References auth.users)
   - `login_date` (DATE)
   - `created_at` (TIMESTAMP)

### Step 3: Test the Feature
1. Log in to your app
2. Check the dashboard - you should see a "Daily Streak" card
3. Log in again tomorrow to see the streak increase

## How It Works

### Login Flow
1. User logs in via `LoginForm`
2. `recordDailyLogin()` is called automatically
3. A record is inserted into `daily_logins` table with today's date
4. If user already logged in today, the record is updated (no duplicate)

### Streak Calculation
- `getLoginStreak()` fetches all login dates for the user
- Counts consecutive days from today (or yesterday if today not logged in)
- Returns the current streak count

### Dashboard Display
- Shows current streak count
- Shows total days logged in
- Displays motivational messages based on streak milestones:
  - 0 days: "Start your streak by logging in tomorrow!"
  - 1-6 days: Shows days until first week streak
  - 7-29 days: Shows days until first month streak
  - 30+ days: "Amazing! You've maintained a X-day streak!"

## Files Created/Modified

### New Files:
1. `supabase-daily-logins.sql` - Database schema
2. `lib/daily-logins.ts` - Helper functions for login tracking
3. `components/dashboard/LoginStreakCard.tsx` - UI component for streak display
4. `DAILY_LOGIN_SETUP.md` - This setup guide

### Modified Files:
1. `components/auth/LoginForm.tsx` - Records login on successful authentication
2. `app/dashboard/page.tsx` - Fetches and displays streak data

## API Functions

### `recordDailyLogin(userId: string)`
Records a daily login for the user. Called automatically on login.

### `getLoginStreak(userId: string)`
Returns the current consecutive day streak (number).

### `getTotalDaysLoggedIn(userId: string)`
Returns total number of days the user has logged in.

### `getLastLoginDate(userId: string)`
Returns the last login date (Date object or null).

## Database Schema

```sql
CREATE TABLE daily_logins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  login_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, login_date)  -- One login per user per day
);
```

## Security
- Row Level Security (RLS) enabled
- Users can only read/insert their own login records
- Policies ensure data isolation between users

## Troubleshooting

### Streak not showing
1. Check if `daily_logins` table exists
2. Verify RLS policies are created
3. Check browser console for errors
4. Verify user is logged in

### Streak not updating
1. Check if `recordDailyLogin()` is being called on login
2. Verify database insert is successful (check Supabase logs)
3. Check if date format matches (YYYY-MM-DD)

### Streak calculation wrong
1. Verify login dates are stored correctly
2. Check timezone handling (uses local date)
3. Verify consecutive day logic in `getLoginStreak()`

## Future Enhancements
- Weekly/monthly streak goals
- Streak badges/achievements
- Streak history chart
- Streak reminders/notifications
- Leaderboard (optional)

