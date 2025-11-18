# How to Update Firebase Storage Rules

## 📍 Step-by-Step Guide

### Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **Sign in** with your Google account (the one you used to create the Firebase project)

### Step 2: Select Your Project

1. Click on your project name (e.g., "snap-habit-mvp" or your project name)
2. If you have multiple projects, select the correct one from the dropdown

### Step 3: Navigate to Storage

1. In the left sidebar, look for **"Storage"** (it's usually under "Build" section)
2. Click on **"Storage"**
3. If you see a "Get started" button, click it to enable Storage (first time only)

### Step 4: Open Rules Tab

1. Once in Storage, you'll see tabs at the top: **"Files"**, **"Rules"**, **"Usage"**
2. Click on the **"Rules"** tab

### Step 5: Update the Rules

1. You'll see a code editor with the current Storage rules
2. **Delete all existing code** in the editor
3. **Copy and paste** the following rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to their own folder (meals)
    match /meals/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to upload test files to their own folder
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

### Step 6: Publish the Rules

1. **IMPORTANT:** After pasting the rules, click the **"Publish"** button (usually at the top right of the editor)
2. Wait for the confirmation message: **"Rules published successfully"**
3. You should see a timestamp showing when the rules were last published

## ✅ Verification

After publishing, verify:

1. **Check the timestamp:** You should see "Last published: [current time]" near the top
2. **No syntax errors:** The editor should not show any red error messages
3. **Rules are saved:** Refresh the page - your rules should still be there

## 🎯 Visual Guide

```
Firebase Console
├── Your Project
    └── Storage (left sidebar)
        └── Rules (top tab)
            └── Code Editor
                └── [Paste rules here]
                    └── [Click "Publish" button]
```

## ⚠️ Common Mistakes

### ❌ Mistake 1: Not Clicking "Publish"
- **Symptom:** Rules look correct but still get permission errors
- **Fix:** You MUST click "Publish" (not just save or close the tab)

### ❌ Mistake 2: Wrong Project
- **Symptom:** Rules update but app still doesn't work
- **Fix:** Make sure you're in the correct Firebase project (check project name at top)

### ❌ Mistake 3: Syntax Errors
- **Symptom:** Red error messages in the editor
- **Fix:** Check for typos, missing brackets, or semicolons

## 🧪 Test Your Rules

After publishing, you can test the rules:

1. In the Rules tab, click **"Rules Playground"** (usually a button or link)
2. Test a scenario:
   - **Location:** `test/test-user-123/test-file.txt`
   - **Authenticated:** ✅ Yes
   - **Operation:** Write
   - **User ID:** `test-user-123`
   - Click **"Run"**
   - Should show ✅ **Allow**

## 📱 Alternative: Using Firebase CLI

If you prefer using the command line:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login:
   ```bash
   firebase login
   ```

3. Initialize (if not already):
   ```bash
   firebase init storage
   ```

4. Create/edit `storage.rules` file in your project root:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /meals/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       match /test/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       match /{allPaths=**} {
         allow read, write: if false;
       }
     }
   }
   ```

5. Deploy:
   ```bash
   firebase deploy --only storage
   ```

## 🔄 After Updating Rules

1. **Sign out and sign back in** to your app (refreshes auth token)
2. **Clear browser cache** (optional but recommended)
3. **Try the operation again** (upload or test)

## 🆘 Still Having Issues?

If you still get permission errors:

1. **Check browser console** (F12) for exact error messages
2. **Verify rules are published:** Check "Last published" timestamp is recent
3. **Test in Rules Playground:** Use the playground to verify rules work
4. **Check user authentication:** Make sure you're logged in when testing
5. **Verify project:** Double-check you're in the correct Firebase project

## 📋 Quick Checklist

- [ ] Opened Firebase Console
- [ ] Selected correct project
- [ ] Navigated to Storage → Rules
- [ ] Pasted the new rules
- [ ] Clicked "Publish" button
- [ ] Saw "Rules published successfully" message
- [ ] Verified timestamp is recent
- [ ] Signed out and back in to app
- [ ] Tested the upload

---

**Need help?** Check the browser console for specific error messages and share them for more targeted assistance.

