# Push Notifications Implementation Guide

## Overview
This guide shows how to implement Web Push Notifications for your SnapHabit app. Users will receive notifications for:
- Daily macro reminders
- Low protein/carbs/fat warnings
- Streak reminders
- Daily summary reports

## Architecture

We'll use **Supabase + Web Push API**:
- Uses Supabase for backend storage
- Web Push API for browser notifications
- Service Worker for handling notifications
- Free and integrates with your existing setup

---

## Step 1: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for Web Push.

### Generate Keys Online:
1. Go to: https://web-push-codelab.glitch.me/
2. Click "Generate VAPID Keys"
3. Copy the **Public Key** and **Private Key**

### Or Generate Locally:
```bash
npm install -g web-push
web-push generate-vapid-keys
```

### Add to `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_EMAIL=mailto:your-email@example.com
```

---

## Step 2: Create Service Worker

Create `public/sw.js`:

```javascript
// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  
  const title = data.title || 'SnapHabit'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png', // Add your app icon
    badge: '/badge-72x72.png',
    image: data.image,
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'default',
    vibrate: [200, 100, 200],
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  
  const urlToOpen = event.notification.data.url || '/dashboard'
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
```

---

## Step 3: Install Dependencies

```bash
npm install web-push
npm install --save-dev @types/web-push
```

---

## Step 4: Create Push Notification Helper

Create `lib/push-notifications.ts`:

```typescript
import { getSupabaseClient } from "./supabase"

// Check if browser supports push notifications
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    return 'denied'
  }
  
  const permission = await Notification.requestPermission()
  return permission
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) {
    return null
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered:', registration)
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(
  userId: string
): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    return null
  }
  
  // Check permission
  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      return null
    }
  }
  
  // Register service worker
  const registration = await registerServiceWorker()
  if (!registration) {
    return null
  }
  
  // Get VAPID public key
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    console.error('VAPID public key not found')
    return null
  }
  
  // Convert VAPID key to Uint8Array
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
  
  // Subscribe to push
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    })
    
    // Save subscription to Supabase
    await savePushSubscription(userId, subscription)
    
    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(
  userId: string
): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false
  }
  
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      await subscription.unsubscribe()
      await deletePushSubscription(userId, subscription.endpoint)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Unsubscribe failed:', error)
    return false
  }
}

// Save subscription to database
async function savePushSubscription(
  userId: string,
  subscription: PushSubscription
): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,endpoint',
    })
  
  if (error) {
    console.error('Error saving push subscription:', error)
  }
}

// Delete subscription from database
async function deletePushSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
  
  if (error) {
    console.error('Error deleting push subscription:', error)
  }
}

// Helper: Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}

// Helper: Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
```

---

## Step 5: Create Database Table

Run this SQL in Supabase SQL Editor (`supabase-push-subscriptions.sql`):

```sql
-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- { p256dh: string, auth: string }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON push_subscriptions;

-- Create policies
CREATE POLICY "Users can read own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Step 6: Create Notification Settings Component

Create `components/notifications/NotificationSettings.tsx`:

```typescript
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff } from "lucide-react"
import { 
  isPushNotificationSupported,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from "@/lib/push-notifications"
import { useSupabaseAuth } from "@/lib/use-supabase-auth"

export default function NotificationSettings() {
  const [user] = useSupabaseAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported(isPushNotificationSupported())
      setPermission(Notification.permission)
      checkSubscriptionStatus()
    }
  }, [user])

  const checkSubscriptionStatus = async () => {
    if (!isPushNotificationSupported() || !user) return
    
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleEnable = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const permission = await requestNotificationPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        await subscribeToPushNotifications(user.id)
        setIsSubscribed(true)
      } else {
        alert('Notification permission denied. Please enable it in your browser settings.')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      alert('Failed to enable notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      await unsubscribeFromPushNotifications(user.id)
      setIsSubscribed(false)
    } catch (error) {
      console.error('Error disabling notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about your macro goals, streaks, and daily summaries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Status: {isSubscribed ? 'Enabled' : 'Disabled'}
            </p>
            {permission === 'denied' && (
              <p className="text-sm text-destructive mb-4">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            )}
          </div>
          
          {!isSubscribed ? (
            <Button 
              onClick={handleEnable} 
              disabled={isLoading || permission === 'denied'}
              className="w-full"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          ) : (
            <Button 
              onClick={handleDisable} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Disabling...' : 'Disable Notifications'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Step 7: Create API Route to Send Notifications

Create `app/api/send-notification/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server-side

// Configure VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
const vapidEmail = process.env.VAPID_EMAIL!

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data, icon, badge } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    // Get user's push subscriptions
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, keys')
      .eq('user_id', userId)
    
    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 })
    }
    
    // Send notification to all subscriptions
    const promises = subscriptions.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      }
      
      const payload = JSON.stringify({
        title: title || 'SnapHabit',
        body: body || 'You have a new notification',
        icon: icon || '/icon-192x192.png',
        badge: badge || '/badge-72x72.png',
        data: data || {},
      })
      
      try {
        await webpush.sendNotification(subscription, payload)
      } catch (error: any) {
        // If subscription is invalid, delete it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
        throw error
      }
    })
    
    await Promise.allSettled(promises)
    
    return NextResponse.json({ success: true, sent: subscriptions.length })
  } catch (error: any) {
    console.error('Error sending notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

---

## Step 8: Add Notification Triggers

Create `lib/notification-triggers.ts`:

```typescript
import { getSupabaseClient } from "./supabase"
import { UserProfile } from "@/types/user"
import { Meal } from "@/types/meal"

// Send notification helper
async function sendNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title,
        body,
        data,
      }),
    })
    
    if (!response.ok) {
      console.error('Failed to send notification')
    }
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}

// Check if user needs macro reminder
export async function checkMacroReminders(
  userId: string,
  profile: UserProfile,
  meals: Meal[]
): Promise<void> {
  // Calculate current totals
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.macros?.protein || 0),
      carbs: acc.carbs + (meal.macros?.carbs || 0),
      fat: acc.fat + (meal.macros?.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
  
  const targets = profile.macroTargets
  const now = new Date()
  const hour = now.getHours()
  
  // Afternoon reminder (2 PM) - check if low on protein
  if (hour === 14 && totals.protein < targets.protein * 0.3) {
    await sendNotification(
      userId,
      'Low on Protein! 🥩',
      `You've only had ${Math.round(totals.protein)}g of protein today. Your target is ${targets.protein}g.`,
      { url: '/dashboard' }
    )
  }
  
  // Evening reminder (6 PM) - check if low on carbs
  if (hour === 18 && totals.carbs < targets.carbs * 0.4) {
    await sendNotification(
      userId,
      'Low on Carbs! 🍞',
      `You've only had ${Math.round(totals.carbs)}g of carbs today. Your target is ${targets.carbs}g.`,
      { url: '/dashboard' }
    )
  }
}

// Send daily summary
export async function sendDailySummary(
  userId: string,
  profile: UserProfile,
  meals: Meal[]
): Promise<void> {
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.macros?.protein || 0),
      carbs: acc.carbs + (meal.macros?.carbs || 0),
      fat: acc.fat + (meal.macros?.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
  
  const targets = profile.macroTargets
  const caloriesPercent = (totals.calories / targets.calories) * 100
  
  let message = ''
  if (caloriesPercent >= 90 && caloriesPercent <= 110) {
    message = '🎉 Perfect! You hit your calorie target today!'
  } else if (caloriesPercent < 90) {
    message = `You're at ${Math.round(caloriesPercent)}% of your calorie target.`
  } else {
    message = `You exceeded your calorie target by ${Math.round(caloriesPercent - 100)}%.`
  }
  
  await sendNotification(
    userId,
    'Daily Summary 📊',
    message,
    { url: '/dashboard' }
  )
}

// Send streak reminder
export async function sendStreakReminder(userId: string, streak: number): Promise<void> {
  await sendNotification(
    userId,
    'Keep Your Streak Going! 🔥',
    `You're on a ${streak}-day streak! Log in today to keep it going.`,
    { url: '/dashboard' }
  )
}
```

---

## Step 9: Add to Dashboard

Add notification settings to your dashboard or create a settings page:

```typescript
import NotificationSettings from "@/components/notifications/NotificationSettings"

// In your dashboard or settings page:
<NotificationSettings />
```

---

## Step 10: Schedule Notifications (Optional)

You can use Supabase Edge Functions or a cron job to send scheduled notifications. For now, you can trigger them from the client side based on time.

### Example: Check macros periodically

Add to your dashboard component:

```typescript
useEffect(() => {
  if (!user || !profile) return
  
  // Check every hour
  const interval = setInterval(async () => {
    const { checkMacroReminders } = await import('@/lib/notification-triggers')
    await checkMacroReminders(user.id, profile, filteredMeals)
  }, 60 * 60 * 1000) // 1 hour
  
  return () => clearInterval(interval)
}, [user, profile, filteredMeals])
```

---

## Environment Variables

Add these to your `.env.local`:

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_EMAIL=mailto:your-email@example.com

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note:** Get `SUPABASE_SERVICE_ROLE_KEY` from:
- Supabase Dashboard → Settings → API → Service Role Key (keep this secret!)

---

## Testing

### 1. Enable Notifications
1. Open your app
2. Click "Enable Notifications" button
3. Grant permission when browser prompts

### 2. Test Sending Notification
You can test by calling the API directly:

```typescript
// In browser console or test file
fetch('/api/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'your-user-id',
    title: 'Test Notification',
    body: 'This is a test notification!',
    data: { url: '/dashboard' }
  })
})
```

### 3. Verify
- Check browser console for errors
- Verify notification appears
- Click notification to verify it opens dashboard

---

## Troubleshooting

### Notifications not showing?
- ✅ Check browser permission settings (Settings → Notifications)
- ✅ Verify service worker is registered (check browser DevTools → Application → Service Workers)
- ✅ Check VAPID keys are correct in `.env.local`
- ✅ Verify subscription is saved in database
- ✅ Ensure you're on HTTPS (or localhost)

### Service Worker not registering?
- ✅ Ensure `sw.js` is in `public/` folder
- ✅ Check browser console for errors
- ✅ Verify file is accessible at `/sw.js`
- ✅ Clear browser cache and reload

### API route failing?
- ✅ Check VAPID keys in environment variables
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- ✅ Check `web-push` package is installed
- ✅ Verify subscription exists in database

### Permission denied?
- ✅ User must grant permission in browser
- ✅ Check browser settings → Notifications
- ✅ Some browsers require user interaction before requesting permission

---

## Browser Support

- ✅ Chrome/Edge (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Safari (macOS 16+)
- ❌ Safari iOS (not supported - use native iOS notifications instead)
- ❌ Opera (limited support)

---

## Security Notes

1. **VAPID Private Key**: Never expose in client-side code
2. **Service Role Key**: Keep secret, only use in server-side code
3. **HTTPS Required**: Push notifications only work over HTTPS (or localhost)
4. **User Consent**: Always request permission before subscribing

---

## Next Steps

- [ ] Add notification preferences (what types of notifications user wants)
- [ ] Schedule daily summaries at end of day (9 PM)
- [ ] Add notification history/log
- [ ] Implement notification actions (buttons in notifications)
- [ ] Add quiet hours (don't send notifications at night)
- [ ] Create notification center in app

---

## Resources

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)

---

## Quick Start Checklist

- [ ] Generate VAPID keys
- [ ] Add keys to `.env.local`
- [ ] Create `public/sw.js` service worker
- [ ] Install `web-push` package
- [ ] Create `lib/push-notifications.ts`
- [ ] Run SQL to create `push_subscriptions` table
- [ ] Create `components/notifications/NotificationSettings.tsx`
- [ ] Create `app/api/send-notification/route.ts`
- [ ] Create `lib/notification-triggers.ts`
- [ ] Add notification settings to dashboard
- [ ] Test notifications

---

## Example Usage

### Send a notification from anywhere in your app:

```typescript
import { sendNotification } from '@/lib/notification-triggers'

// Send macro reminder
await checkMacroReminders(userId, profile, meals)

// Send daily summary
await sendDailySummary(userId, profile, meals)

// Send streak reminder
await sendStreakReminder(userId, streak)
```

### Or call API directly:

```typescript
fetch('/api/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    title: 'Custom Title',
    body: 'Custom message',
    data: { url: '/dashboard' }
  })
})
```

---

That's it! Your push notification system is ready to use. 🎉

