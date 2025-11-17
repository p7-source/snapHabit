# Exact Firebase Rules - Copy and Paste

## 🔴 CRITICAL: Update BOTH Firestore AND Storage Rules

---

## 1. FIRESTORE RULES

### Location: Firebase Console → Firestore Database → Rules

**Copy this EXACT code:**

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

**Steps:**
1. Go to Firebase Console
2. Click "Firestore Database" → "Rules" tab
3. Delete ALL existing rules
4. Paste the code above
5. Click **"Publish"** button (top right)
6. Wait for "Rules published successfully" message

---

## 2. STORAGE RULES

### Location: Firebase Console → Storage → Rules

**Copy this EXACT code:**

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

**Steps:**
1. Go to Firebase Console
2. Click "Storage" → "Rules" tab
3. Delete ALL existing rules
4. Paste the code above
5. Click **"Publish"** button (top right)
6. Wait for "Rules published successfully" message

---

## ✅ Verification Checklist

After publishing both rules:

- [ ] Firestore rules show "Last published: [recent time]"
- [ ] Storage rules show "Last published: [recent time]"
- [ ] Both show "Rules published successfully" message

---

## 🧪 Test the Rules

### Test Firestore Rules:
1. Go to Firestore Database → Rules → Rules Playground
2. Test profile:
   - Location: `profiles/test-user-123`
   - Authenticated: ✅ Yes
   - Operation: Create
   - User ID: `test-user-123`
   - Click "Run" → Should show ✅ **Allow**

3. Test meal:
   - Location: `meals/test-meal-123`
   - Authenticated: ✅ Yes
   - Operation: Create
   - User ID: `test-user-123`
   - Click "Run" → Should show ✅ **Allow**

### Test Storage Rules:
1. Go to Storage → Rules → Rules Playground
2. Test upload:
   - Location: `meals/test-user-123/test.jpg`
   - Authenticated: ✅ Yes
   - Operation: Write
   - User ID: `test-user-123`
   - Click "Run" → Should show ✅ **Allow**

---

## ⚠️ Common Mistakes

### ❌ Mistake 1: Not Publishing
- **Symptom:** Rules look correct but still get permission errors
- **Fix:** You MUST click "Publish" (not just save)

### ❌ Mistake 2: Wrong Collection Name
- **Symptom:** Rules allow but collection doesn't match
- **Fix:** Collection must be exactly `profiles` (not `profile` or `userProfiles`)

### ❌ Mistake 3: Only Updating One
- **Symptom:** One works but other doesn't
- **Fix:** Update BOTH Firestore AND Storage rules

---

## 🔄 After Updating Rules

1. **Sign out and sign back in** (refreshes auth token)
2. **Clear browser cache** (optional but recommended)
3. **Try the operation again** (onboarding or upload)

---

## 📋 What These Rules Allow

### Firestore:
- ✅ Users can create/read/update their own profile in `profiles/{userId}`
- ✅ Users can create/read/update their own meals in `meals/{mealId}`
- ❌ Users cannot access other users' data
- ❌ Users cannot access other collections

### Storage:
- ✅ Users can upload images to `meals/{userId}/...`
- ✅ Users can read images from `meals/{userId}/...`
- ❌ Users cannot upload to other paths
- ❌ Users cannot access other users' folders

---

## 🆘 Still Not Working?

If you still get permission errors after publishing both rules:

1. **Check browser console** for exact error message
2. **Check Network tab** for 403 status codes
3. **Verify user is logged in:**
   ```javascript
   // Run in browser console
   console.log("User:", firebase.auth().currentUser?.uid)
   ```
4. **Sign out and sign back in** to refresh auth token
5. **Check "Last published" timestamp** is recent for both rules

