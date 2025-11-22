# Clerk Authentication Migration Guide

This document outlines the migration from Supabase Auth to Clerk authentication.

## ✅ Completed Steps

1. **Installed Clerk SDK**: `@clerk/nextjs` package installed
2. **Updated Middleware**: Replaced Supabase auth middleware with `clerkMiddleware()`
3. **Updated Layout**: Wrapped app with `<ClerkProvider>` in `app/layout.tsx`
4. **Created Auth Hook**: New `useClerkAuth()` hook replaces `useSupabaseAuth()`
5. **Updated Login/Register Pages**: Now use Clerk's `<SignIn>` and `<SignUp>` components
6. **Updated All Auth References**: Replaced `useSupabaseAuth()` in:
   - `app/dashboard/page.tsx`
   - `app/upload/page-client.tsx`
   - `components/onboarding/OnboardingFlow.tsx`
7. **Updated Sign Out**: Now uses Clerk's `signOut()` method

## 🔧 Required Setup

### 1. Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

Get these from your [Clerk Dashboard](https://dashboard.clerk.com/last-active?path=api-keys).

### 2. Configure Clerk Redirect URLs

In your Clerk Dashboard:
- Go to **Paths** settings
- Set **Sign-in path**: `/login`
- Set **Sign-up path**: `/register`
- Set **After sign-in URL**: `/dashboard`
- Set **After sign-up URL**: `/onboarding`

### 3. Database User ID Migration

**Important**: Your Supabase database currently uses Supabase user IDs. You have two options:

#### Option A: Create User Mapping Table (Recommended)
Create a table to map Clerk user IDs to Supabase user IDs:

```sql
CREATE TABLE user_mappings (
  clerk_user_id TEXT PRIMARY KEY,
  supabase_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

Then update your queries to:
1. Look up the Supabase user ID from the mapping table
2. Use that ID for database queries

#### Option B: Migrate All Data (Clean Slate)
If you're okay with users re-registering:
1. Export existing data
2. Clear user-related tables
3. Users sign up again with Clerk
4. Import data with new Clerk user IDs

## 📝 Code Changes Summary

### Auth Hook
- **Old**: `useSupabaseAuth()` from `@/lib/use-supabase-auth`
- **New**: `useClerkAuth()` from `@/lib/use-clerk-auth`

### User Object Structure
- **Old**: Supabase `User` object with `id`, `email`, etc.
- **New**: Clerk user object with `id`, `email`, `firstName`, `lastName`

### Sign Out
- **Old**: `await supabase.auth.signOut()`
- **New**: `const { signOut } = useClerk(); await signOut()`

### Login/Register Forms
- **Old**: Custom forms with Supabase auth
- **New**: Clerk's `<SignIn>` and `<SignUp>` components

## 🔄 Post-Authentication Actions

Clerk handles authentication automatically. To record daily logins after sign-in, you can:

1. **Use Clerk Webhooks**: Set up webhooks to trigger when users sign in
2. **Client-Side Hook**: Use `useUser()` hook and `useEffect` to detect sign-in
3. **Middleware**: Add logic in middleware to record login

Example client-side approach:

```typescript
import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

export function usePostAuthActions() {
  const { user, isLoaded } = useUser()
  
  useEffect(() => {
    if (isLoaded && user) {
      // Record daily login
      recordDailyLogin(user.id)
    }
  }, [user, isLoaded])
}
```

## 🚨 Breaking Changes

1. **User IDs Changed**: Clerk user IDs are different from Supabase user IDs
2. **Auth State**: Auth state management is now handled by Clerk
3. **OAuth**: OAuth providers need to be configured in Clerk Dashboard
4. **Email Verification**: Handled automatically by Clerk (no manual setup needed)

## 📚 Next Steps

1. ✅ Set up Clerk account and get API keys
2. ✅ Add environment variables
3. ✅ Configure redirect URLs in Clerk Dashboard
4. ⚠️ **Decide on user ID migration strategy**
5. ⚠️ **Update database queries to use Clerk user IDs**
6. ⚠️ **Test authentication flow end-to-end**
7. ⚠️ **Update any remaining Supabase auth references**

## 🔍 Files Still Using Supabase Auth (May Need Updates)

- `components/auth/LoginForm.tsx` - Can be removed (using Clerk component now)
- `components/auth/RegisterForm.tsx` - Can be removed (using Clerk component now)
- `components/auth/ForgotPasswordForm.tsx` - Clerk handles this
- `components/auth/ResetPasswordForm.tsx` - Clerk handles this
- `lib/use-supabase-auth.ts` - Can be removed (replaced by `use-clerk-auth.ts`)

## 📖 Clerk Documentation

- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components](https://clerk.com/docs/components/overview)
- [Clerk Hooks](https://clerk.com/docs/references/react/use-user)

