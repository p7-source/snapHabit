# SnapHabit Setup Guide

## Quick Start

1. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```

2. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication (Email/Password + Google Sign-In)
   - Create Firestore database
   - Enable Firebase Storage
   - Copy your Firebase config to `.env.local`

3. **Create `.env.local` file**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   OPENAI_API_KEY=your_openai_key

   # Optional - uses mock if not provided
   GOOGLE_CLOUD_VISION_API_KEY=your_vision_key
   ```

4. **Configure Firestore Security Rules**
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

5. **Configure Firebase Storage Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /meals/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

6. **Run the app**
   ```bash
   npm run dev
   ```

7. **Open browser**
   - Navigate to http://localhost:3000
   - Register a new account or sign in with Google
   - Upload a meal photo and get AI-powered nutrition insights!

## Notes

- The app works without `GOOGLE_CLOUD_VISION_API_KEY` (uses mock food detection)
- OpenAI API key is required for nutrition analysis
- Make sure Firebase Auth, Firestore, and Storage are all enabled

