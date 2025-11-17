# Firebase Storage Setup Guide

## Issue: Images Not Uploading to Firebase Storage

If images are not appearing in Firebase Storage, check the following:

## 1. Firebase Storage Rules

Go to Firebase Console → Storage → Rules and ensure you have rules that allow authenticated users to upload:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to their own folder
    match /meals/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 2. Verify Environment Variables

Check that your `.env.local` has the correct Storage bucket:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## 3. Check Browser Console

After uploading, check the browser console for:
- `📤 Uploading to Firebase Storage...` - Upload started
- `✅ Image uploaded successfully to Storage` - Upload completed
- `🔗 Getting download URL...` - Getting URL
- `✅ Image URL obtained:` - URL retrieved
- `💾 Saving meal to Firestore...` - Saving to database
- `✅ Meal saved to Firestore with ID:` - Success

## 4. Common Issues

### Issue: "Permission denied" error
**Solution**: Update Storage rules (see #1)

### Issue: "Storage is not initialized" error
**Solution**: Check that `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is set correctly

### Issue: Upload completes but no file in Storage
**Solution**: 
- Check Storage rules allow writes
- Verify the user is authenticated
- Check browser console for errors

### Issue: Firestore save fails
**Solution**: Check Firestore rules allow writes for authenticated users

## 5. Firestore Rules

Ensure your Firestore rules allow authenticated users to write:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /meals/{mealId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 6. Testing Steps

1. Open browser console (F12)
2. Go to `/upload` page
3. Upload an image
4. Watch console logs for each step
5. Check Firebase Console → Storage for uploaded files
6. Check Firebase Console → Firestore for meal documents

## 7. Debugging

If upload still fails, check:
- Network tab in browser DevTools for failed requests
- Firebase Console → Storage → Files tab
- Firebase Console → Firestore → Data tab
- Browser console for error messages

