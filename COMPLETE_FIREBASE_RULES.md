# Complete Firebase Rules Setup

## Current Error: "Missing or insufficient permissions"

This error can occur in both **Firestore** and **Storage**. Make sure you update BOTH sets of rules.

## Step 1: Firestore Rules (for profiles and meals)

### Go to Firebase Console → Firestore Database → Rules

**Copy and paste these EXACT rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can read/write their own profile
    match /profiles/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Meals - users can read/write their own meals
    match /meals/{mealId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**⚠️ IMPORTANT:** Click **"Publish"** button (not just save!)

## Step 2: Storage Rules (for image uploads)

### Go to Firebase Console → Storage → Rules

**Copy and paste these EXACT rules:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to their own folder
    match /meals/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**⚠️ IMPORTANT:** Click **"Publish"** button (not just save!)

## Step 3: Verify Rules Are Published

### For Firestore:
1. Go to Firestore Database → Rules
2. Check the "Last published" timestamp at the top
3. It should show a recent time (just now)
4. If it shows "Never published" or old date, click "Publish"

### For Storage:
1. Go to Storage → Rules
2. Check the "Last published" timestamp at the top
3. It should show a recent time (just now)
4. If it shows "Never published" or old date, click "Publish"

## Step 4: Test Rules

### Test Firestore Rules:
1. Go to Firestore Database → Rules → Rules Playground
2. Test profile creation:
   - Location: `profiles/test-user-id`
   - Authenticated: ✅ Yes
   - Operation: Create
   - User ID: `test-user-id`
   - Should show: ✅ **Allow**

3. Test meal creation:
   - Location: `meals/test-meal-id`
   - Authenticated: ✅ Yes
   - Operation: Create
   - User ID: `test-user-id`
   - Should show: ✅ **Allow**

### Test Storage Rules:
1. Go to Storage → Rules → Rules Playground
2. Test upload:
   - Location: `meals/test-user-id/test.jpg`
   - Authenticated: ✅ Yes
   - Operation: Write
   - User ID: `test-user-id`
   - Should show: ✅ **Allow**

## Collections Used in This App

### Firestore Collections:
- `profiles/{userId}` - User profile data
- `meals/{mealId}` - Meal entries with `userId` field

### Storage Paths:
- `meals/{userId}/{filename}` - Uploaded meal images

## Troubleshooting

### Issue: Still getting permission errors after updating rules

**Check:**
1. ✅ Rules are **published** (not just saved)
2. ✅ User is **authenticated** (logged in)
3. ✅ Collection names match exactly (`profiles`, `meals`)
4. ✅ Path structure matches rules

### Issue: Rules Playground shows "Deny"

**Check:**
1. User ID in test matches `request.auth.uid`
2. Collection name is correct
3. Rules syntax is correct (no typos)

### Issue: Works in Rules Playground but not in app

**Check:**
1. User is actually authenticated in app
2. Browser console shows user.uid
3. Network tab shows 403 errors (permission denied)

## Quick Test Script

Run this in browser console to verify:

```javascript
// Check authentication
const auth = firebase.auth();
console.log("User authenticated:", auth.currentUser?.uid);

// Check Firestore
const db = firebase.firestore();
const testProfileRef = db.collection('profiles').doc(auth.currentUser?.uid);
console.log("Profile path:", testProfileRef.path);

// Check Storage
const storage = firebase.storage();
const testStorageRef = storage.ref(`meals/${auth.currentUser?.uid}/test.jpg`);
console.log("Storage path:", testStorageRef.fullPath);
```

## Alternative: Temporary Open Rules (Development Only)

If you want to test quickly, you can temporarily use these rules (⚠️ **NOT for production**):

### Firestore (Temporary):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage (Temporary):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING:** These allow any authenticated user to read/write anywhere. Only use for testing!

## Still Not Working?

1. **Clear browser cache** and try again
2. **Sign out and sign back in** to refresh auth token
3. **Check browser console** for exact error message
4. **Check Network tab** for 403 status codes
5. **Verify environment variables** in `.env.local`

