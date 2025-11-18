# Alternative Databases to Firebase

## 🎯 Overview

If you want to replace Firebase, here are the best alternatives for your Next.js nutrition tracking app. Each option includes authentication, database, and storage.

---

## 🥇 Top Recommendations

### 1. **Supabase** (Most Similar to Firebase) ⭐ RECOMMENDED

**Why it's great:**
- ✅ PostgreSQL database (more powerful than Firestore)
- ✅ Built-in authentication (email, Google, GitHub, etc.)
- ✅ Storage for images (similar to Firebase Storage)
- ✅ Real-time subscriptions
- ✅ Row Level Security (RLS) for permissions
- ✅ Free tier: 500MB database, 1GB storage, 2GB bandwidth
- ✅ Very similar API to Firebase (easy migration)

**Setup:**
```bash
npm install @supabase/supabase-js
```

**Example:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Auth
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Database
const { data: meals } = await supabase
  .from('meals')
  .select('*')
  .eq('user_id', userId)

// Storage
const { data: file } = await supabase.storage
  .from('meal-images')
  .upload(`${userId}/${filename}`, imageFile)
```

**Pricing:** Free tier → $25/month (Pro)

**Website:** [supabase.com](https://supabase.com)

---

### 2. **PostgreSQL + NextAuth + AWS S3 / Cloudinary**

**Why it's great:**
- ✅ Most flexible and customizable
- ✅ PostgreSQL is industry standard
- ✅ Full control over your data
- ✅ Can use any hosting (Vercel Postgres, Neon, Supabase, etc.)

**Components:**
- **Database:** PostgreSQL (via Vercel Postgres, Neon, or Supabase)
- **Auth:** NextAuth.js (supports many providers)
- **Storage:** AWS S3, Cloudinary, or Supabase Storage

**Setup:**
```bash
npm install next-auth @auth/prisma-adapter prisma @prisma/client
npm install @aws-sdk/client-s3  # or cloudinary
```

**Example:**
```typescript
// Database with Prisma
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const meal = await prisma.meal.create({
  data: {
    userId: user.id,
    foodName: 'Chicken',
    calories: 300,
    // ...
  }
})

// Auth with NextAuth
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
})

// Storage with Cloudinary
import { v2 as cloudinary } from 'cloudinary'
const result = await cloudinary.uploader.upload(imageFile)
```

**Pricing:** Varies (Vercel Postgres: $20/month, Cloudinary: Free tier available)

**Best for:** Full control and customization

---

### 3. **MongoDB Atlas + NextAuth + Cloudinary**

**Why it's great:**
- ✅ NoSQL database (similar to Firestore)
- ✅ Easy to use with Mongoose
- ✅ Free tier: 512MB storage
- ✅ Good for flexible schemas

**Setup:**
```bash
npm install mongoose next-auth cloudinary
```

**Example:**
```typescript
// Database with Mongoose
import mongoose from 'mongoose'

const mealSchema = new mongoose.Schema({
  userId: String,
  foodName: String,
  calories: Number,
  // ...
})

const Meal = mongoose.model('Meal', mealSchema)

const meal = await Meal.create({
  userId: user.id,
  foodName: 'Chicken',
  calories: 300,
})
```

**Pricing:** Free tier → $9/month (M10)

**Website:** [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

---

### 4. **PlanetScale + NextAuth + Cloudinary**

**Why it's great:**
- ✅ MySQL database (serverless)
- ✅ Branching (like Git for databases)
- ✅ Free tier: 5GB storage, 1 billion reads/month
- ✅ Great for scaling

**Setup:**
```bash
npm install @planetscale/database next-auth
```

**Pricing:** Free tier → $29/month (Scaler)

**Website:** [planetscale.com](https://planetscale.com)

---

## 📊 Comparison Table

| Feature | Firebase | Supabase | PostgreSQL + NextAuth | MongoDB Atlas |
|---------|----------|----------|----------------------|---------------|
| **Database Type** | NoSQL (Firestore) | PostgreSQL | PostgreSQL | NoSQL |
| **Authentication** | ✅ Built-in | ✅ Built-in | NextAuth.js | NextAuth.js |
| **Storage** | ✅ Built-in | ✅ Built-in | AWS S3/Cloudinary | Cloudinary |
| **Real-time** | ✅ Yes | ✅ Yes | Via Supabase/Ably | Via MongoDB Change Streams |
| **Free Tier** | ✅ Generous | ✅ Good | Varies | ✅ Good |
| **Learning Curve** | Easy | Easy | Medium | Easy |
| **Migration Effort** | - | Low | Medium | Medium |
| **Best For** | Quick setup | Firebase alternative | Full control | NoSQL preference |

---

## 🚀 Migration Guide: Firebase → Supabase

### Step 1: Install Supabase

```bash
npm install @supabase/supabase-js
npm uninstall firebase
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create account and new project
3. Get your URL and anon key from Settings → API

### Step 3: Update Environment Variables

```env
# Remove Firebase
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...

# Add Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Create Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 5: Create Database Tables

In Supabase SQL Editor, run:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  goal TEXT,
  age INTEGER,
  gender TEXT,
  weight DECIMAL,
  height DECIMAL,
  activity_level TEXT,
  macro_targets JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meals table
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can read own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Step 6: Update Code

**Auth:**
```typescript
// Before (Firebase)
import { signInWithEmailAndPassword } from 'firebase/auth'
await signInWithEmailAndPassword(auth, email, password)

// After (Supabase)
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

**Database:**
```typescript
// Before (Firebase)
import { collection, addDoc } from 'firebase/firestore'
await addDoc(collection(db, 'meals'), mealData)

// After (Supabase)
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase
  .from('meals')
  .insert(mealData)
```

**Storage:**
```typescript
// Before (Firebase)
import { ref, uploadBytes } from 'firebase/storage'
const imageRef = ref(storage, `meals/${userId}/${filename}`)
await uploadBytes(imageRef, file)

// After (Supabase)
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase.storage
  .from('meal-images')
  .upload(`${userId}/${filename}`, file)
```

---

## 🎯 Recommendation for Your App

### **Best Choice: Supabase** ⭐

**Why:**
1. **Easiest migration** - Very similar to Firebase
2. **Better database** - PostgreSQL is more powerful than Firestore
3. **All-in-one** - Auth, database, and storage in one platform
4. **Free tier** - Good for testing and small apps
5. **Great documentation** - Easy to learn

### **If you want more control: PostgreSQL + NextAuth + Cloudinary**

**Why:**
1. **Full flexibility** - Choose each component
2. **Industry standard** - PostgreSQL is widely used
3. **Better for complex queries** - SQL is powerful
4. **More setup required** - But more customizable

---

## 📝 Quick Start: Supabase

1. **Sign up:** [supabase.com](https://supabase.com)
2. **Create project:** Click "New Project"
3. **Get credentials:** Settings → API → Copy URL and anon key
4. **Install:**
   ```bash
   npm install @supabase/supabase-js
   ```
5. **Create client:** See Step 4 above
6. **Create tables:** See Step 5 above
7. **Update code:** Replace Firebase calls with Supabase

---

## 🔄 Migration Checklist

- [ ] Choose alternative database
- [ ] Set up new database/storage
- [ ] Install new packages
- [ ] Update environment variables
- [ ] Create database schema/tables
- [ ] Update authentication code
- [ ] Update database queries
- [ ] Update storage uploads
- [ ] Test all features
- [ ] Migrate existing data (if any)
- [ ] Update documentation

---

## 💡 Need Help?

If you want help migrating to a specific database, let me know which one you prefer and I can:
1. Create the migration code
2. Update your existing files
3. Set up the new database schema
4. Test the integration

**Which database would you like to use?**

