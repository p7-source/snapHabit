# Firebase Storage Test Page

## 🧪 Purpose

This test page helps you verify that Firebase Storage is working correctly with your app. It uploads a simple text file to a user-specific path and shows you the result.

## 📍 Access the Test Page

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:**
   ```
   http://localhost:3000/test-firebase
   ```

3. **Make sure you're logged in** (the page will redirect you to login if not)

## 🎯 What It Tests

The test page will:
- ✅ Check if Firebase Storage is initialized
- ✅ Verify user authentication
- ✅ Create a simple text file
- ✅ Upload it to Firebase Storage at path: `test/{userId}/test-file.txt`
- ✅ Retrieve the download URL
- ✅ Display success or error message

## 📋 Prerequisites

### 1. Firebase Storage Rules

Make sure your Firebase Storage rules include the test path. Update your Storage rules in Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Meals path (for actual app)
    match /meals/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Test path (for testing)
    match /test/{userId}/{allPaths=**} {
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

**Important:** Click **"Publish"** after updating the rules!

### 2. Environment Variables

Make sure your `.env.local` file has all Firebase configuration variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🚀 How to Use

1. **Log in to your app** (if not already logged in)

2. **Go to** `http://localhost:3000/test-firebase`

3. **Click the "Test Firebase Storage Upload" button**

4. **Wait for the result:**
   - ✅ **Success:** You'll see a green success message with a download URL
   - ❌ **Failed:** You'll see a red error message with details

5. **Check the browser console** (F12) for detailed logs

## ✅ Expected Success Result

If everything is working, you should see:

```
✅ Success!
File uploaded successfully!

Download URL: https://firebasestorage.googleapis.com/...
```

You can click the download URL to verify the file was uploaded correctly.

## ❌ Common Errors & Solutions

### Error: "Permission denied"

**Cause:** Firebase Storage rules don't allow the upload

**Solution:**
1. Go to Firebase Console → Storage → Rules
2. Add the test path rule (see Prerequisites above)
3. Click **"Publish"**
4. Sign out and sign back in
5. Try again

### Error: "Firebase Storage is not initialized"

**Cause:** Missing or incorrect Firebase configuration

**Solution:**
1. Check your `.env.local` file has all 6 Firebase variables
2. Restart your dev server (`npm run dev`)
3. Make sure variable names start with `NEXT_PUBLIC_`

### Error: "Upload timeout"

**Cause:** Network issue or Storage rules blocking the upload

**Solution:**
1. Check your internet connection
2. Verify Storage rules are published
3. Check browser console for more details

### Error: "User authentication failed"

**Cause:** User is not logged in or session expired

**Solution:**
1. Sign out and sign back in
2. Make sure you're logged in before testing

## 🔍 Debugging Tips

1. **Open Browser Console (F12)** to see detailed logs:
   - User ID
   - File name and size
   - Storage path
   - Upload progress
   - Error details

2. **Check Firebase Console:**
   - Go to Storage → Files
   - Look for `test/{your-user-id}/test-*.txt`
   - If the file appears, upload worked!

3. **Verify Rules:**
   - Go to Storage → Rules
   - Check "Last published" timestamp is recent
   - Use Rules Playground to test the path

## 📝 What Gets Uploaded

The test creates a simple text file with:
- Current timestamp
- Your user ID
- A test message

File path: `test/{userId}/test-{timestamp}.txt`

## 🧹 Cleanup

After testing, you can delete test files from Firebase Console:
1. Go to Storage → Files
2. Navigate to `test/{your-user-id}/`
3. Delete the test files

Or leave them - they're small and won't affect your app.

## 🎯 Next Steps

Once the test succeeds:
- ✅ Firebase Storage is working correctly
- ✅ Your Storage rules are correct
- ✅ You can proceed with actual meal image uploads

If the test fails, fix the issues before trying to upload meal images.

