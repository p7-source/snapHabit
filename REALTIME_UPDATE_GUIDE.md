# Real-Time Dashboard Update Guide

## How It Works

The dashboard uses multiple mechanisms to ensure it updates in real-time:

### 1. **Real-Time Subscription** (Primary)
- Supabase real-time listens for INSERT/UPDATE/DELETE events on the `meals` table
- When a new meal is inserted, automatically triggers `refetchMeals()`
- **Requires**: Supabase real-time must be enabled for the `meals` table

### 2. **URL Parameter Refetch** (From Upload)
- When you click "View Dashboard" after uploading, redirects with `?refetch=timestamp`
- Dashboard detects this parameter and refetches meals
- **Works**: Always works, even if real-time is disabled

### 3. **Window Focus/Visibility** (Fallback)
- Refetches when you switch back to the browser tab
- Refetches when page becomes visible
- **Works**: Always works as a fallback

### 4. **Polling** (Backup)
- Automatically refetches every 10 seconds if page is visible
- Ensures updates even if other mechanisms fail
- **Works**: Always works, but uses more resources

## Enable Supabase Real-Time

For the best experience, enable real-time in Supabase:

1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Find the `meals` table
3. Toggle **Enable Replication** to ON
4. Save changes

**Note**: Real-time is optional. The app will work with polling and focus-based refetching.

## Testing Real-Time Updates

1. **Open Dashboard** in one browser tab
2. **Open Upload page** in another tab (or same tab)
3. **Upload a meal** and click "Save Meal"
4. **Check Dashboard** - should update automatically within 1-2 seconds

## Console Logs to Check

When real-time is working, you'll see:
```
✅ Real-time subscription active
🔄 Real-time event received: INSERT { ... }
🆕 New meal inserted, refetching...
🔄 Refetching meals...
✅ Refetched 5 meals
```

If real-time isn't working, you'll see:
```
⚠️ Real-time subscription error - will use fallback refetch
🔄 Polling: refetching meals...
```

## Troubleshooting

### Dashboard Not Updating

1. **Check Browser Console**:
   - Look for `✅ Real-time subscription active`
   - If you see `⚠️ Real-time subscription error`, real-time is disabled

2. **Enable Real-Time in Supabase**:
   - Dashboard → Database → Replication
   - Enable for `meals` table

3. **Check Polling**:
   - Wait 10 seconds - dashboard should auto-refresh
   - Check console for `🔄 Polling: refetching meals...`

4. **Manual Refresh**:
   - Click "View Dashboard" button after upload
   - Or refresh the page manually

### Real-Time Not Working

**Common Causes**:
- Real-time not enabled in Supabase (most common)
- Network/firewall blocking WebSocket connections
- Supabase project on free tier (real-time may have limits)

**Solution**: The app will automatically fall back to polling every 10 seconds.

## Current Implementation

- ✅ Real-time subscription (if enabled)
- ✅ URL parameter refetch (from upload redirect)
- ✅ Window focus/visibility refetch
- ✅ Polling every 10 seconds (backup)
- ✅ Multiple fallback mechanisms ensure updates

The dashboard **will update** even if real-time is disabled, thanks to polling and focus-based refetching.




