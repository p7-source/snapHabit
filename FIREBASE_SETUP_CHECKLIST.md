# Firebase Setup Verification Checklist

## ⚠️ Important: Restart Required!

**Next.js only loads environment variables when the server starts!**

If you just added Firebase credentials, you **MUST** restart the dev server:

1. **Stop the server**: Press `Ctrl+C` in the terminal running `npm run dev`
2. **Start it again**: Run `npm run dev`

---

## ✅ Verify Your .env.local File

Make sure your `.env.local` file has **all 6 Firebase variables** with the **exact names**:

```env
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Common Issues:

1. **Variable names must start with `NEXT_PUBLIC_`**
   - ✅ Correct: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - ❌ Wrong: `FIREBASE_API_KEY` (missing NEXT_PUBLIC_)

2. **No spaces around the `=` sign**
   - ✅ Correct: `NEXT_PUBLIC_FIREBASE_API_KEY=value`
   - ❌ Wrong: `NEXT_PUBLIC_FIREBASE_API_KEY = value`

3. **No quotes needed** (unless value contains spaces)
   - ✅ Correct: `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...`
   - ⚠️  Quotes are OK: `NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyC..."`

4. **All 6 variables are required**
   - Missing any one will cause Firebase to fail

---

## 🔍 Quick Verification Steps

1. **Check file exists**: `.env.local` should be in the project root
2. **Check all 6 variables are present**
3. **Check variable names are correct** (must start with `NEXT_PUBLIC_`)
4. **Restart the dev server** (most important!)

---

## 🧪 After Restarting, Test:

1. **Homepage**: http://localhost:3000 ✅ Should work
2. **Login page**: http://localhost:3000/login ✅ Should work
3. **Upload page**: http://localhost:3000/upload 
   - ✅ Should redirect to login (if not logged in)
   - ✅ Should load (if logged in)
   - ❌ Should NOT return 500 error

4. **API endpoint**: http://localhost:3000/api/analyze-food ✅ Should work

---

## 🐛 Troubleshooting

### If upload page still returns 500 after restart:

1. **Check browser console** (F12) for Firebase errors
2. **Check server terminal** for error messages
3. **Verify Firebase project is active** in Firebase Console
4. **Verify Authentication is enabled** in Firebase Console
5. **Verify Firestore is enabled** in Firebase Console
6. **Verify Storage is enabled** in Firebase Console

### Common Error Messages:

- `Firebase: Error (auth/invalid-api-key)` → API key is wrong
- `Firebase: Error (auth/project-not-found)` → Project ID is wrong
- `Cannot read property 'auth' of undefined` → Firebase not initialized (check env vars)

---

## 📝 Complete .env.local Template

```env
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=sk-your_openai_key_here

# Google Cloud Vision API Configuration (OPTIONAL)
# GOOGLE_CLOUD_VISION_API_KEY=your_vision_key_here
```

---

## ✅ Success Indicators

After restarting with correct Firebase config:

- ✅ Upload page redirects to login (not 500 error)
- ✅ Login page loads without errors
- ✅ Register page loads without errors
- ✅ No Firebase errors in browser console
- ✅ No Firebase errors in server terminal

---

**Remember: Always restart the dev server after changing .env.local!**

