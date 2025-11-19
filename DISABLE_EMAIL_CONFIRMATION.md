# How to Disable Email Confirmation in Supabase

## Problem
When email confirmation is enabled, users must verify their email before they can sign in. This can be inconvenient during development.

## Solution: Disable Email Confirmation

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project: https://supabase.com/dashboard
2. Select your project

### Step 2: Navigate to Authentication Settings
1. Click **"Authentication"** in the left sidebar
2. Click **"Settings"** (or go to: Authentication → Settings)

### Step 3: Disable Email Confirmation
1. Scroll down to the **"Email Auth"** section
2. Find the toggle for **"Enable email confirmations"**
3. **Turn it OFF** (toggle should be gray/unchecked)
4. Click **"Save"** at the bottom of the page

### Step 4: Test Registration
1. Try registering a new account
2. You should now be immediately logged in and redirected to `/onboarding`
3. No email confirmation required!

## Alternative: Keep Email Confirmation Enabled

If you want to keep email confirmation enabled (for production-like testing):

1. **After Registration**: Check your email inbox for the confirmation link
2. **Click the confirmation link** in the email
3. **Then sign in** with your email and password
4. The login form now has a **"Resend Confirmation Email"** button if you need it

## Notes
- Disabling email confirmation is recommended for **development only**
- For production, you should **re-enable** email confirmation for security
- The app now handles both scenarios gracefully

