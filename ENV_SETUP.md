# Environment Variables Setup Guide

## Quick Setup

1. **Copy the example file**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in your environment variables** (see below)

3. **Run the app**
   ```bash
   npm run dev
   ```

## Required Environment Variables

### 1. Firebase Configuration (REQUIRED)

Get these from: [Firebase Console](https://console.firebase.google.com) → Your Project → Project Settings → General → Your apps → Web app

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 2. OpenAI API Key (REQUIRED)

Get from: [OpenAI Platform](https://platform.openai.com/api-keys)

```env
OPENAI_API_KEY=sk-...
```

**Note:** This is required for nutrition analysis. Without it, the `/api/analyze-food` endpoint will fail.

## Optional Environment Variables

### 3. Google Cloud Vision API Key (OPTIONAL)

Get from: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

```env
GOOGLE_CLOUD_VISION_API_KEY=AIza...
```

**Note:** If not provided, the app uses mock food detection (random food names). For real AI-powered food recognition, add this key.

## Complete .env.local Example

```env
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=snaphabit-12345.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=snaphabit-12345
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=snaphabit-12345.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=sk-proj-...

# Google Cloud Vision API Configuration (OPTIONAL)
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyC...
```

## Minimum Setup to Run

For basic functionality, you need at minimum:

✅ **Firebase config** (all 6 variables) - Required for authentication and data storage  
✅ **OpenAI API key** - Required for nutrition analysis  

The app will work with just these two, using mock food detection if Google Vision API key is missing.

## Security Notes

- ⚠️ **Never commit `.env.local` to git** - It's already in `.gitignore`
- 🔒 Keep your API keys secure
- 📝 Use different keys for development and production
- 🚨 Never share your API keys publicly

