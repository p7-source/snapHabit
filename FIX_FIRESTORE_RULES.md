# Fix: Firestore Rules for User Profiles

## Error: `Missing or insufficient permissions` when saving profile

The onboarding flow saves user profiles to `profiles/{userId}`, but your Firestore rules don't allow writes to this collection.

## Current Issue

Your Firestore rules currently allow all access until December 16, 2025, but this might not be working. Let's update them to explicitly allow profile creation.

## Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **"Firestore Database"** in the left sidebar
4. Click **"Rules"** tab at the top

## Step 2: Update Firestore Rules

**Replace ALL existing rules with these:**

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

## Step 3: Publish the Rules

**CRITICAL:** After pasting the rules:

1. Click **"Publish"** button (top right)
2. Wait for confirmation: "Rules published successfully"
3. **DO NOT** just save - you must click "Publish"!

## Step 4: Verify Rules Are Active

1. Click **"Rules Playground"** (top right, next to Publish)
2. Test profile creation:
   - **Location:** `profiles/test-user-id`
   - **Authenticated:** ✅ Yes
   - **Operation:** Create
   - **User ID:** `test-user-id`
3. Click **"Run"**
4. Should show: ✅ **Allow**

## What These Rules Do

### Profiles Collection (`profiles/{userId}`)
- ✅ **Read:** Any authenticated user can read profiles
- ✅ **Create:** Users can only create their own profile (`userId` must match `request.auth.uid`)
- ✅ **Update:** Users can only update their own profile
- ✅ **Delete:** Users can only delete their own profile

### Meals Collection (`meals/{mealId}`)
- ✅ **Read:** Users can read their own meals
- ✅ **Create:** Users can create meals with their own `userId`
- ✅ **Update:** Users can update their own meals
- ✅ **Delete:** Users can delete their own meals

## Alternative: Temporary Open Rules (Development Only)

If you want to test quickly, you can temporarily use these rules (⚠️ **NOT for production**):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all authenticated users (for testing only!)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING:** These rules allow any authenticated user to read/write anywhere. Only use for testing!

## Testing After Updating Rules

1. Make sure you're logged in
2. Go through onboarding flow
3. Complete all 3 steps
4. Click "Save" on step 3
5. Should redirect to dashboard without errors

## Common Mistakes

### ❌ Mistake 1: Rules Not Published
- **Symptom:** Rules look correct but save still fails
- **Fix:** Click "Publish" button (not just save)

### ❌ Mistake 2: Wrong Collection Name
- **Symptom:** Rules allow but collection name doesn't match
- **Fix:** Ensure collection is `profiles` (not `profile` or `userProfiles`)

### ❌ Mistake 3: User ID Mismatch
- **Symptom:** Creating profile with wrong user ID
- **Fix:** Use `user.uid` from authenticated user

## Verify Your Current Rules

1. Go to Firestore Database → Rules
2. Check if rules match the pattern above
3. Check if "Published" timestamp is recent
4. If not, click "Publish"

## Still Not Working?

1. **Check browser console** for exact error message
2. **Check Network tab** for 403 status code
3. **Verify user is logged in:**
   ```javascript
   console.log("User:", authInstance?.currentUser?.uid)
   ```
4. **Verify collection name:**
   ```javascript
   console.log("Collection: profiles")
   console.log("Document ID:", user.uid)
   ```

