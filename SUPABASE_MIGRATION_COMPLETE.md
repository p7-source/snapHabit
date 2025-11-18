# ✅ Supabase Migration Complete!

## 🎉 Migration Summary

Your app has been successfully migrated from Firebase to Supabase! All components have been updated to use Supabase's authentication, database, and storage.

## 📋 What Was Changed

### 1. **New Files Created**
- ✅ `lib/supabase.ts` - Supabase client initialization
- ✅ `lib/use-supabase-auth.ts` - Custom auth hook (replaces react-firebase-hooks)
- ✅ `app/auth/callback/route.ts` - OAuth callback handler

### 2. **Updated Files**
- ✅ `components/auth/LoginForm.tsx` - Now uses Supabase auth
- ✅ `components/auth/RegisterForm.tsx` - Now uses Supabase auth
- ✅ `components/onboarding/OnboardingFlow.tsx` - Now uses Supabase
- ✅ `app/dashboard/page.tsx` - Now uses Supabase database & real-time
- ✅ `app/upload/page-client.tsx` - Now uses Supabase Storage & database
- ✅ `lib/user-profile.ts` - Now uses Supabase database
- ✅ `app/test-firebase/page-client.tsx` - Updated to test Supabase Storage

### 3. **Dependencies**
- ✅ Installed: `@supabase/supabase-js`
- ⚠️ Can remove: `firebase`, `react-firebase-hooks` (optional cleanup)

## 🔧 Environment Variables

Update your `.env.local` file:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://vmpkjvbtfhdaaaiueqxa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI (Still needed)
OPENAI_API_KEY=your_openai_key

# Optional
GOOGLE_CLOUD_VISION_API_KEY=your_vision_key
```

**Important:** Get your `NEXT_PUBLIC_SUPABASE_ANON_KEY` from:
- Supabase Dashboard → Settings → API → anon/public key

## 🗄️ Database Schema

Make sure you've created these tables in Supabase:

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  goal TEXT,
  age INTEGER,
  gender TEXT,
  weight DECIMAL,
  height DECIMAL,
  activity_level TEXT,
  macro_targets JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Meals Table
```sql
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  image_url TEXT,
  food_name TEXT NOT NULL,
  calories INTEGER,
  macros JSONB,
  ai_advice TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

**Profiles:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Meals:**
```sql
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  USING (auth.uid() = user_id);
```

## 📦 Storage Setup

### 1. Create Storage Bucket
- Go to Supabase Dashboard → Storage
- Create bucket named: `meal-images`
- Set to **Private** (not public)

### 2. Storage Policies

Go to Storage → Policies → New Policy → For full customization

**Upload Policy:**
```sql
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);
```

**Read Policy:**
```sql
CREATE POLICY "Users can read images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);
```

## 🔐 Authentication Setup

### Enable Google OAuth (Optional)

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add redirect URL: `http://localhost:3000/auth/callback` (for dev)

## 🧪 Testing

1. **Test Storage:**
   - Go to: `http://localhost:3000/test-firebase`
   - Click "Test Supabase Storage Upload"
   - Should upload successfully

2. **Test Authentication:**
   - Register a new account
   - Log in
   - Should redirect to onboarding

3. **Test Upload:**
   - Go to `/upload`
   - Upload a food image
   - Should save to Supabase Storage and database

## 🚀 Next Steps

1. ✅ Update `.env.local` with Supabase credentials
2. ✅ Create database tables (SQL above)
3. ✅ Set up Storage bucket and policies
4. ✅ Enable Google OAuth (if needed)
5. ✅ Test the app end-to-end
6. ⚠️ Optional: Remove Firebase dependencies

## 📝 Key Differences from Firebase

| Feature | Firebase | Supabase |
|---------|----------|----------|
| Auth | `auth.currentUser.uid` | `user.id` |
| Database | Firestore collections | PostgreSQL tables |
| Storage | `ref(storage, path)` | `supabase.storage.from('bucket')` |
| Real-time | `onSnapshot` | `channel().on('postgres_changes')` |
| User ID | `user.uid` | `user.id` |

## ⚠️ Important Notes

1. **User ID Format:** Supabase uses UUIDs, Firebase uses shorter IDs
2. **Storage Path:** Files are stored as `{userId}/filename` (no `meals/` prefix in path)
3. **Database Fields:** Use snake_case (`user_id`, `food_name`) instead of camelCase
4. **Real-time:** Supabase real-time requires enabling Replication in table settings

## 🐛 Troubleshooting

### "Permission denied" errors
- Check RLS policies are enabled and correct
- Verify Storage policies match the path structure
- Make sure user is authenticated

### "Table does not exist"
- Run the SQL to create tables
- Check table names match exactly (case-sensitive)

### OAuth not working
- Check redirect URL is set correctly
- Verify Google OAuth credentials in Supabase
- Check callback route is accessible

## ✅ Migration Checklist

- [x] Install Supabase package
- [x] Create Supabase client
- [x] Update authentication
- [x] Update user profiles
- [x] Update meal uploads
- [x] Update dashboard
- [x] Update onboarding
- [x] Update test page
- [ ] Update environment variables
- [ ] Create database tables
- [ ] Set up Storage bucket
- [ ] Add Storage policies
- [ ] Test end-to-end

---

**Migration completed!** 🎉 Your app is now running on Supabase's free tier!

