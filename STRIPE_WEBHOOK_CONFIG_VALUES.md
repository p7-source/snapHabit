# Stripe Webhook Configuration Values

## 📝 Fill in the Form

### 1. **Endpoint URL**

**For Production:**
```
https://yourdomain.com/api/webhooks/stripe
```
Replace `yourdomain.com` with your actual domain.

**For Local Development:**
⚠️ **Don't use localhost in Dashboard** - Use Stripe CLI instead:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 2. **Description** (Optional but Recommended)

```
SnapHabit - Subscription webhook handler
```
Or:
```
SnapHabit payment and subscription events
```

### 3. **Events to Listen To**

Click **"Select events"** and check these:

✅ **`checkout.session.completed`** (REQUIRED)
- Records subscription when payment completes

✅ **`customer.subscription.updated`** (Recommended)
- Updates subscription when plan changes or renews

✅ **`customer.subscription.deleted`** (Recommended)
- Handles subscription cancellations

### 4. **API Version**

✅ Already set to: `2025-11-17.clover` - This matches your code!

### 5. **Payload Style**

✅ **Snapshot** - This is correct (default)

## 🎯 Complete Configuration

**Endpoint URL:**
```
https://yourdomain.com/api/webhooks/stripe
```

**Description:**
```
SnapHabit - Subscription webhook handler
```

**Events:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**API Version:**
- `2025-11-17.clover` (already set)

## ⚠️ Important Notes

1. **For Local Testing**: Use Stripe CLI, not Dashboard webhook
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **For Production**: Use Dashboard webhook with your production URL

3. **HTTPS Required**: Production URL must use `https://` (not `http://`)

4. **After Creating**: Copy the webhook signing secret and add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

## 📋 Step-by-Step

1. **Fill Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
2. **Fill Description**: `SnapHabit - Subscription webhook handler`
3. **Click "Select events"**
4. **Check the 3 events** listed above
5. **Click "Add endpoint"** or **"Save"**
6. **Copy the signing secret** (starts with `whsec_...`)
7. **Add to `.env.local`**: `STRIPE_WEBHOOK_SECRET=whsec_...`
8. **Restart dev server**

## 🧪 Testing

After configuration:
1. Make a test payment
2. Check webhook events in Dashboard
3. Check your server logs for webhook processing
4. Verify subscription in Supabase

