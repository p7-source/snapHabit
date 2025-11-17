# Fix: Missing or Insufficient Permissions

## Error: `FirebaseError: Missing or insufficient permissions`

This error means Firebase Storage rules are blocking your upload. Here's how to fix it:

## Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **"Storage"** in the left sidebar
4. Click **"Rules"** tab at the top

## Step 2: Copy and Paste These Rules

**IMPORTANT:** Replace ALL existing rules with these:

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

## Step 3: Publish the Rules

**CRITICAL:** After pasting the rules:

1. Click **"Publish"** button (top right)
2. Wait for confirmation: "Rules published successfully"
3. **DO NOT** just save - you must click "Publish"!

## Step 4: Verify Rules Are Active

1. Click **"Rules Playground"** (top right, next to Publish)
2. Test with:
   - **Location:** `meals/test-user-id/test.jpg`
   - **Authenticated:** ✅ Yes
   - **Operation:** Write
   - **User ID:** `test-user-id`
3. Click **"Run"**
4. Should show: ✅ **Allow**

## Step 5: Test Upload Again

1. Go back to your app
2. Try uploading an image
3. Check browser console for success message

## Common Mistakes

### ❌ Mistake 1: Rules Not Published
- **Symptom:** Rules look correct but upload still fails
- **Fix:** Click "Publish" button (not just save)

### ❌ Mistake 2: Wrong Path Pattern
- **Symptom:** Rules allow but path doesn't match
- **Fix:** Ensure path is exactly `meals/{userId}/...`

### ❌ Mistake 3: User Not Authenticated
- **Symptom:** `request.auth` is null
- **Fix:** Ensure user is logged in before upload

### ❌ Mistake 4: User ID Mismatch
- **Symptom:** Uploading to wrong user folder
- **Fix:** Use `user.uid` from authenticated user

## Alternative: Temporary Test Rules (Development Only)

If you want to test quickly, you can temporarily use these rules (⚠️ **NOT for production**):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // TEMPORARY: Allow all authenticated users (for testing only!)
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING:** These rules allow any authenticated user to read/write anywhere. Only use for testing!

## Verify Your Current Rules

1. Go to Storage → Rules
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
4. **Verify path:**
   ```javascript
   console.log("Path:", `meals/${user.uid}/...`)
   ```

## Quick Test Script

Run this in browser console to test:

```javascript
// Test authentication
const auth = firebase.auth();
console.log("Current user:", auth.currentUser?.uid);

// Test storage path
const storage = firebase.storage();
const testRef = storage.ref(`meals/${auth.currentUser?.uid}/test.jpg`);
console.log("Test path:", testRef.fullPath);
```

