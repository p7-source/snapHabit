# How to Get Free API Keys for Testing

This guide walks you through getting free API keys for testing SnapHabit. All services offer free tiers that are perfect for development and testing.

## 📋 Required Keys

1. **Firebase** (Required) - 100% Free with generous limits
2. **OpenAI** (Required) - Free $5 credit for new users
3. **Google Cloud Vision** (Optional) - Free tier with $300 credit/month

---

## 🔥 1. Firebase Configuration (REQUIRED)

**Free Tier:** ✅ Completely free for development/testing with generous limits

### Steps:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Add project" or "Create a project"
   - Enter project name (e.g., "snaphabit-test")
   - Click "Continue"
   - Disable Google Analytics (optional, for faster setup)
   - Click "Create project"
   - Wait for project creation to complete

3. **Enable Authentication**
   - In the left sidebar, click "Authentication"
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password"
     - Toggle it ON
     - Click "Save"
   - Enable "Google"
     - Toggle it ON
     - Enter project support email (your email)
     - Click "Save"

4. **Create Firestore Database**
   - In the left sidebar, click "Firestore Database"
   - Click "Create database"
   - Select "Start in test mode" (we'll update rules later)
   - Choose a location (closest to you)
   - Click "Enable"

5. **Enable Storage**
   - In the left sidebar, click "Storage"
   - Click "Get started"
   - Start in test mode
   - Click "Done"

6. **Get Your Firebase Config**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"
   - Scroll down to "Your apps" section
   - Click the web icon `</>`
   - Enter app nickname (e.g., "web app")
   - Click "Register app"
   - Copy the config values shown (or you can get them later)

   **You'll see something like:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

7. **Copy to `.env.local`**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC... (apiKey)
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com (authDomain)
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id (projectId)
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com (storageBucket)
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789 (messagingSenderId)
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef (appId)
   ```

**Free Tier Limits:**
- 1 GB storage
- 10 GB/month bandwidth
- 50K reads/day
- 20K writes/day
- Perfect for testing! ✅

---

## 🤖 2. OpenAI API Key (REQUIRED)

**Free Tier:** $5 free credit for new accounts (perfect for testing)

### Steps:

1. **Create OpenAI Account**
   - Visit: https://platform.openai.com/signup
   - Sign up with email or Google account

2. **Add Payment Method** (Required, but you get $5 free credit)
   - Go to: https://platform.openai.com/account/billing
   - Add a payment method (credit/debit card)
   - **Don't worry:** You get $5 free credit, and charges only apply after you use it

3. **Create API Key**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Give it a name (e.g., "snaphabit-test")
   - Click "Create secret key"
   - **IMPORTANT:** Copy the key immediately! You won't be able to see it again.
   - Store it securely

4. **Copy to `.env.local`**
   ```env
   OPENAI_API_KEY=sk-proj-... (your key starts with sk-)
   ```

**Usage Tips:**
- The $5 credit usually lasts for hundreds of API calls for testing
- Monitor usage at: https://platform.openai.com/usage
- Set usage limits in billing settings to avoid unexpected charges

**Alternative (If you want to avoid payment method):**
- Look into free AI APIs like Hugging Face Inference API (limited but free)
- Or use mock responses for testing (modify the code temporarily)

---

## 👁️ 3. Google Cloud Vision API Key (OPTIONAL)

**Free Tier:** $300 free credit/month (lasts for thousands of requests!)

**Note:** This is optional! The app works without it (uses mock food detection).

### Steps:

1. **Create Google Cloud Account**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account
   - If new, you'll need to create a free trial account
   - Accept terms and add payment method (you get $300 free credit/month)

2. **Create a Project**
   - Click "Select a project" → "New Project"
   - Enter project name (e.g., "snaphabit-vision")
   - Click "Create"

3. **Enable Vision API**
   - Go to: https://console.cloud.google.com/apis/library/vision.googleapis.com
   - Make sure your project is selected
   - Click "Enable"

4. **Create API Key**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key that appears
   - (Optional) Click "Restrict key" to limit it to Vision API only

5. **Copy to `.env.local`**
   ```env
   GOOGLE_CLOUD_VISION_API_KEY=AIzaSyC... (your key)
   ```

**Free Tier Limits:**
- First 1,000 requests/month: FREE
- $300 free credit covers thousands more requests
- Perfect for testing! ✅

---

## 📝 Creating Your `.env.local` File

1. **Create the file** in your project root:
   ```bash
   # In Windows PowerShell or Command Prompt
   type nul > .env.local
   
   # Or just create it manually in your editor
   ```

2. **Add all your keys:**
   ```env
   # Firebase Configuration (REQUIRED)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # OpenAI Configuration (REQUIRED)
   OPENAI_API_KEY=sk-your_openai_key_here

   # Google Cloud Vision API Configuration (OPTIONAL)
   GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key_here
   ```

3. **Save the file**

4. **Verify it's in `.gitignore`** (it should be already, but double-check)

---

## ✅ Quick Start Checklist

- [ ] Firebase project created
- [ ] Firebase authentication enabled (Email + Google)
- [ ] Firestore database created
- [ ] Firebase Storage enabled
- [ ] Firebase config copied to `.env.local`
- [ ] OpenAI account created
- [ ] OpenAI API key generated and added to `.env.local`
- [ ] (Optional) Google Vision API enabled and key added
- [ ] `.env.local` file saved in project root

---

## 💡 Tips for Testing

1. **Start without Google Vision**: The app works with mock food detection if you skip the Vision API key. Get Firebase and OpenAI working first!

2. **Monitor Usage**: Keep an eye on your API usage:
   - OpenAI: https://platform.openai.com/usage
   - Google Cloud: https://console.cloud.google.com/billing

3. **Set Spending Limits**: 
   - OpenAI: Set usage limits in billing settings
   - Google Cloud: Set budget alerts in billing console

4. **Use Free Tiers Wisely**: All three services have generous free tiers perfect for testing. You shouldn't need to pay anything for development/testing.

---

## 🆘 Troubleshooting

**Firebase issues:**
- Make sure you enabled Email/Password AND Google sign-in
- Check that Firestore and Storage are enabled

**OpenAI issues:**
- Verify your API key starts with `sk-`
- Check if you've used up your $5 credit
- Make sure billing is set up (required even for free tier)

**Google Vision issues:**
- Verify the Vision API is enabled for your project
- Check that your API key isn't restricted incorrectly
- Remember: This is optional! The app works without it.

---

## 🔒 Security Reminder

- ⚠️ Never commit `.env.local` to git (it should already be in `.gitignore`)
- 🔒 Don't share your API keys publicly
- 📝 Use different keys for development and production
- 🚨 If you accidentally share a key, revoke it immediately and create a new one

---

Need help? Check the `ENV_SETUP.md` file for more details!

