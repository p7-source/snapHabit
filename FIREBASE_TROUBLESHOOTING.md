# Firebase Storage & Firestore Troubleshooting Guide

## Issue: Firebase Storage/Firestore Not Working

Let's systematically check and fix the issues.

---

## Step 1: Verify Environment Variables

Check your `.env.local` file has ALL these variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**⚠️ IMPORTANT:**
- All variables must start with `NEXT_PUBLIC_`
- `STORAGE_BUCKET` format: `your-project-id.appspot.com`
- Restart dev server after changing `.env.local`

---

## Step 2: Verify Firebase Rules Are Published

### Firestore Rules:
1. Go to Firebase Console → Firestore Database → Rules
2. Check "Last published" timestamp (should be recent)
3. If not published, click "Publish"

**Rules should be:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    match /meals/{mealId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Storage Rules:
1. Go to Firebase Console → Storage → Rules
2. Check "Last published" timestamp (should be recent)
3. If not published, click "Publish"

**Rules should be:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /meals/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Step 3: Check Browser Console

Open browser console (F12) and look for:

### For Storage Issues:
- `Firebase Storage is not initialized`
- `Missing or insufficient permissions`
- `storage/unauthorized`
- `storage/permission-denied`

### For Firestore Issues:
- `Firestore is not initialized`
- `Missing or insufficient permissions`
- `permission-denied`

---

## Step 4: Verify User Authentication

Run this in browser console:

```javascript
// Check if Firebase is loaded
console.log("Firebase:", typeof firebase !== 'undefined' ? 'Loaded' : 'Not loaded')

// Check authentication
import { getAuth } from 'firebase/auth'
const auth = getAuth()
console.log("Current user:", auth.currentUser?.uid)
console.log("User email:", auth.currentUser?.email)
```

**If user is null:**
- Sign out and sign back in
- Check login page is working

---

## Step 5: Test Storage Initialization

Run this in browser console:

```javascript
// Test Storage
import { getStorage } from 'firebase/storage'
const storage = getStorage()
console.log("Storage:", storage ? 'Initialized' : 'Not initialized')
console.log("Storage bucket:", storage?.app?.options?.storageBucket)
```

**If Storage is not initialized:**
- Check `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in `.env.local`
- Restart dev server

---

## Step 6: Test Firestore Initialization

Run this in browser console:

```javascript
// Test Firestore
import { getFirestore } from 'firebase/firestore'
const db = getFirestore()
console.log("Firestore:", db ? 'Initialized' : 'Not initialized')
```

---

## Step 7: Check Network Tab

1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Try uploading an image or saving profile
4. Look for failed requests:
   - **403** = Permission denied (rules issue)
   - **401** = Not authenticated
   - **404** = Not found (wrong path)
   - **500** = Server error

---

## Step 8: Common Issues & Fixes

### Issue 1: "Storage is not initialized"
**Fix:**
- Check `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in `.env.local`
- Format: `your-project-id.appspot.com`
- Restart dev server

### Issue 2: "Permission denied"
**Fix:**
- Update Firestore/Storage rules
- Click "Publish" (not just save)
- Sign out and sign back in

### Issue 3: "User not authenticated"
**Fix:**
- Sign out and sign back in
- Check login is working
- Verify auth token is valid

### Issue 4: "Network error"
**Fix:**
- Check internet connection
- Check Firebase project is active
- Check browser console for CORS errors

---

## Step 9: Quick Test Script

Run this in browser console to test everything:

```javascript
// Complete Firebase test
async function testFirebase() {
  console.log("🧪 Testing Firebase...")
  
  // Test imports
  try {
    const { getAuth, getStorage, getFirestore } = await import('firebase/auth')
    const { getAuth: getAuth2 } = await import('firebase/storage')
    const { getFirestore: getFirestore2 } = await import('firebase/firestore')
    
    // Test Auth
    const auth = getAuth()
    console.log("✅ Auth:", auth ? 'OK' : 'FAILED')
    console.log("   User:", auth.currentUser?.uid || 'Not logged in')
    
    // Test Storage
    const storage = getStorage()
    console.log("✅ Storage:", storage ? 'OK' : 'FAILED')
    console.log("   Bucket:", storage?.app?.options?.storageBucket || 'Not set')
    
    // Test Firestore
    const db = getFirestore()
    console.log("✅ Firestore:", db ? 'OK' : 'FAILED')
    
    // Test rules (if user is logged in)
    if (auth.currentUser) {
      console.log("✅ User authenticated:", auth.currentUser.uid)
      console.log("   Email:", auth.currentUser.email)
    } else {
      console.log("⚠️  User not authenticated - sign in first")
    }
    
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

testFirebase()
```

---

## Step 10: Restart Everything

If nothing works:

1. **Stop dev server** (Ctrl+C)
2. **Clear browser cache**
3. **Sign out and sign back in**
4. **Restart dev server:** `npm run dev`
5. **Try again**

---

## Still Not Working?

1. **Check Firebase Console:**
   - Is project active?
   - Are APIs enabled? (Storage API, Firestore API)
   - Check project settings

2. **Check Environment Variables:**
   - All `NEXT_PUBLIC_` variables set?
   - Values match Firebase Console?
   - Dev server restarted?

3. **Check Rules:**
   - Both Firestore and Storage rules published?
   - Rules syntax correct?
   - User authenticated?

4. **Share Error Details:**
   - Browser console error message
   - Network tab status codes
   - Which operation fails (upload, save profile, etc.)

