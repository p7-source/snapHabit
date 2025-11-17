# Debugging Image Upload Issues

## Current Issue: Upload Timeout

The upload is timing out after 30 seconds, which usually indicates one of these problems:

## 1. Firebase Storage Rules (MOST LIKELY)

**Check your Storage rules:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click "Storage" in left sidebar
4. Click "Rules" tab
5. Make sure you have these rules:

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

6. Click "Publish"

## 2. Check Browser Console

Open browser console (F12) and look for:
- `📤 Uploading to Firebase Storage...` - Upload started
- `❌ Upload error:` - Error details
- Error code (e.g., `storage/unauthorized`, `storage/permission-denied`)

## 3. Check Network Tab

1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Try uploading
4. Look for failed requests to Firebase Storage
5. Check the response status code:
   - `403` = Permission denied (Storage rules issue)
   - `401` = Not authenticated
   - `500` = Server error

## 4. Verify Authentication

Make sure you're logged in:
- Check if user is authenticated
- Verify `authInstance?.currentUser` is not null
- Check browser console for auth errors

## 5. Verify Environment Variables

Check `.env.local` has:
```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## 6. Test Storage Rules

You can test rules in Firebase Console:
1. Go to Storage → Rules
2. Click "Rules Playground"
3. Test with:
   - Location: `meals/{userId}/test.jpg`
   - Authenticated: Yes
   - Operation: Write

## Common Error Codes

- `storage/unauthorized` - Not authenticated or rules deny access
- `storage/permission-denied` - Storage rules blocking upload
- `storage/network-request-failed` - Network issue
- `storage/object-not-found` - File not found after upload
- `storage/quota-exceeded` - Storage quota exceeded

## Quick Fix Checklist

- [ ] Storage rules allow authenticated users to write
- [ ] User is logged in
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is set correctly
- [ ] No network errors in browser console
- [ ] Storage bucket exists in Firebase Console

