# Fix Date Filtering Issue

## Problem
Total calories showing 14380 (way too high) - this means ALL meals from all days are being included, not just today's meals.

## Root Cause
Date filtering in frontend is not working correctly. All meals are passing the `isSameDay` check.

## Solution: Use Database-Level Filtering

Instead of filtering in the frontend, let's filter at the database level using Supabase's date functions.

### Step 1: Update Dashboard Query

Change the query to filter by date in the database:

```typescript
// Instead of fetching all meals and filtering in frontend:
supabase
  .from('meals')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

// Use date filtering in the query:
const today = new Date()
const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

supabase
  .from('meals')
  .select('*')
  .eq('user_id', user.id)
  .gte('created_at', todayStart.toISOString())
  .lte('created_at', todayEnd.toISOString())
  .order('created_at', { ascending: false })
```

### Step 2: Alternative - Use DATE() Function

Supabase supports PostgreSQL date functions. We can use:

```typescript
// Filter by date using PostgreSQL DATE() function
const todayStr = new Date().toISOString().split('T')[0] // "2024-11-18"

supabase
  .from('meals')
  .select('*')
  .eq('user_id', user.id)
  .gte('created_at', `${todayStr}T00:00:00.000Z`)
  .lte('created_at', `${todayStr}T23:59:59.999Z`)
  .order('created_at', { ascending: false })
```

## Quick Fix Implementation

I'll update the dashboard to use database-level filtering for the daily view, which will be more reliable than frontend filtering.

