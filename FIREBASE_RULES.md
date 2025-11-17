# Firebase Security Rules

## Current Status

Your Firestore rules are currently set to allow all access until December 16, 2025. This is fine for development/testing, but you'll need to update them for production.

## Firebase Storage Rules (IMPORTANT - This is likely your issue!)

Go to **Firebase Console → Storage → Rules** and update them to:

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

**Why this matters:** If Storage rules are too restrictive or missing, images won't upload even if Firestore rules allow it.

## Firestore Rules (Current - Works for Testing)

Your current rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 16);
    }
  }
}
```

**This works for now**, but here are better rules for production:

### Production Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Meals - users can read/write their own meals
    match /meals/{mealId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## How to Update Rules

1. **Storage Rules:**
   - Go to Firebase Console
   - Click "Storage" in left sidebar
   - Click "Rules" tab
   - Paste the Storage rules above
   - Click "Publish"

2. **Firestore Rules:**
   - Go to Firebase Console
   - Click "Firestore Database" in left sidebar
   - Click "Rules" tab
   - Update rules (keep current ones for now, or use production rules)
   - Click "Publish"

## Testing After Updating Rules

1. Make sure you're logged in
2. Try uploading an image
3. Check browser console for errors
4. Check Firebase Console → Storage → Files to see if image appears
5. Check Firebase Console → Firestore → Data to see if meal document appears

## Common Errors

- **"Permission denied" in Storage:** Update Storage rules (see above)
- **"Permission denied" in Firestore:** Update Firestore rules (see above)
- **"Storage is not initialized":** Check `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in `.env.local`

