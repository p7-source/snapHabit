# End-to-End Testing Guide

Complete testing guide for SnapHabit Macro Budget Tracker application.

---

## 🚀 Prerequisites

1. **Server Running**
   ```bash
   npm run dev
   ```
   - Server should be running on http://localhost:3000
   - Check terminal for any errors

2. **Environment Variables Set**
   - Firebase credentials configured in `.env.local`
   - OpenAI API key configured
   - (Optional) Google Cloud Vision API key

3. **Browser Ready**
   - Open Chrome/Firefox/Edge
   - Open Developer Tools (F12) to see console
   - Clear browser cache if needed

---

## 📋 Test Scenarios

### Test Scenario 1: New User Registration & Onboarding

#### 1.1: Access Landing Page
- [ ] Navigate to http://localhost:3000
- [ ] **Expected:** Landing page loads with:
  - SnapHabit logo/header
  - Hero section with tagline
  - Three feature cards (Quick Capture, Smart Analysis, AI Insights)
  - "Get Started" button
  - Login button in header

#### 1.2: Register New Account
- [ ] Click "Login" → "Register" (or go to http://localhost:3000/register)
- [ ] Fill in registration form:
  - Email: `test@example.com` (use unique email for testing)
  - Password: `password123` (min 6 characters)
  - Confirm Password: `password123`
- [ ] Click "Create Account"
- [ ] **Expected:** 
  - Account created successfully
  - Redirected to `/onboarding` page
  - No console errors

**Alternative: Google Sign-In**
- [ ] Click "Google" button
- [ ] Complete Google authentication
- [ ] **Expected:** Redirected to `/onboarding`

---

### Test Scenario 2: Onboarding Flow

#### 2.1: Step 1 - Goal Selection
- [ ] **Expected:** See 4 goal options with icons:
  - [ ] Lose Weight (blue, TrendingDown icon)
  - [ ] Maintain Weight (green, Activity icon)
  - [ ] Build Muscle (purple, TrendingUp icon)
  - [ ] Custom (orange, Settings icon)
- [ ] Click on "Lose Weight"
- [ ] **Expected:** Card highlights, border changes to primary color
- [ ] Click "Next" button
- [ ] **Expected:** Progress bar moves to 33%, moves to Step 2

**Test All Goals:**
- [ ] Test "Maintain Weight" → Click Next
- [ ] Test "Build Muscle" → Click Next
- [ ] Test "Custom" → Click Next
- [ ] **Expected:** All goals work, progress bar updates

#### 2.2: Step 2 - Personal Information

**Age Input:**
- [ ] Enter age: `25`
- [ ] **Expected:** Input accepts number, no errors

**Gender Selection:**
- [ ] Click "Male"
- [ ] **Expected:** Button highlights
- [ ] Try "Female" and "Other"
- [ ] **Expected:** All options work

**Weight Input with Unit Toggle:**
- [ ] **Test kg:**
  - [ ] Ensure "kg" is selected (default)
  - [ ] Enter weight: `70`
  - [ ] **Expected:** Input accepts value
- [ ] **Test lbs:**
  - [ ] Click "lbs" toggle
  - [ ] Enter weight: `154`
  - [ ] **Expected:** Unit changes, input accepts value
  - [ ] Toggle back to "kg"
  - [ ] **Expected:** Value converts (154 lbs = ~70 kg)

**Height Input with Unit Toggle:**
- [ ] **Test cm:**
  - [ ] Ensure "cm" is selected (default)
  - [ ] Enter height: `175`
  - [ ] **Expected:** Input accepts value
- [ ] **Test ft+in:**
  - [ ] Click "ft + in" toggle
  - [ ] Enter feet: `5`
  - [ ] Enter inches: `9`
  - [ ] **Expected:** Both inputs work, converts to cm (5'9" = ~175 cm)
  - [ ] Toggle back to "cm"
  - [ ] **Expected:** Value converts correctly

**Activity Level:**
- [ ] See 5 activity level options:
  - [ ] Sedentary
  - [ ] Lightly Active
  - [ ] Moderately Active
  - [ ] Very Active
  - [ ] Extremely Active
- [ ] Click "Moderately Active"
- [ ] **Expected:** Card highlights
- [ ] Hover over info icon (ℹ️) next to "Activity Level"
- [ ] **Expected:** Tooltip appears explaining activity levels

**BMR & TDEE Preview:**
- [ ] After filling all fields, scroll down
- [ ] **Expected:** See BMR and TDEE preview box
- [ ] Hover over "BMR" info icon
- [ ] **Expected:** Tooltip explains "Basal Metabolic Rate"
- [ ] Hover over "TDEE" info icon
- [ ] **Expected:** Tooltip explains "Total Daily Energy Expenditure"
- [ ] **Expected:** Values are calculated and displayed

**Validation:**
- [ ] Try clicking "Next" without filling all fields
- [ ] **Expected:** Button disabled, cannot proceed
- [ ] Fill all required fields
- [ ] **Expected:** "Next" button enabled
- [ ] Click "Next"
- [ ] **Expected:** Progress bar moves to 67%, moves to Step 3

#### 2.3: Step 3 - Macro Calculation & Review

**Auto-Calculated Macros (Lose/Maintain/Build Muscle):**
- [ ] **Expected:** See calculated macro targets:
  - [ ] Calories (e.g., 1800 kcal)
  - [ ] Protein (e.g., 140g)
  - [ ] Carbs (e.g., 135g)
  - [ ] Fat (e.g., 60g)
- [ ] **Expected:** Values are reasonable and match goal
- [ ] See summary showing:
  - [ ] Goal type
  - [ ] Activity level
  - [ ] TDEE value

**Custom Goal - Manual Adjustment:**
- [ ] Go back to Step 1, select "Custom"
- [ ] Complete Step 2
- [ ] **Expected:** Step 3 shows editable inputs
- [ ] **Test Calories:**
  - [ ] Change calories from default to `2000`
  - [ ] **Expected:** Value updates
- [ ] **Test Protein:**
  - [ ] Change protein to `150`
  - [ ] **Expected:** Value updates
- [ ] **Test Carbs:**
  - [ ] Change carbs to `200`
  - [ ] **Expected:** Value updates
- [ ] **Test Fat:**
  - [ ] Change fat to `65`
  - [ ] **Expected:** Value updates
- [ ] Try entering negative numbers
  - [ ] **Expected:** Values stay at 0 (validation)

**Complete Onboarding:**
- [ ] Review all macro values
- [ ] Click "Looks good, let's start!" button
- [ ] **Expected:**
  - Button shows "Saving..." with spinner
  - Profile saved to Firestore
  - Redirected to `/dashboard`
  - No console errors

---

### Test Scenario 3: Dashboard - Macro Budget Tracking

#### 3.1: Initial Dashboard State
- [ ] **Expected:** Dashboard loads successfully
- [ ] See header: "Today's Macro Budget"
- [ ] See 4 circular progress bars:
  - [ ] Calories (center shows 0)
  - [ ] Protein (center shows 0g)
  - [ ] Carbs (center shows 0g)
  - [ ] Fat (center shows 0g)
- [ ] **Expected:** All progress bars are empty (green circles)
- [ ] See "Remaining" amounts below each bar:
  - [ ] Calories: Shows full target (e.g., "1800 kcal remaining")
  - [ ] Protein: Shows full target (e.g., "140g remaining")
  - [ ] Carbs: Shows full target
  - [ ] Fat: Shows full target
- [ ] See summary cards showing "0 / [target]" for each macro
- [ ] See empty state: "No meals tracked yet"

#### 3.2: Navigation
- [ ] Click "Add Meal" button (top right)
- [ ] **Expected:** Navigate to `/upload`
- [ ] Click "Dashboard" link
- [ ] **Expected:** Navigate back to dashboard
- [ ] Click "Sign Out"
- [ ] **Expected:** Logged out, redirected to homepage

---

### Test Scenario 4: Food Upload & Analysis

#### 4.1: Upload Meal Photo
- [ ] Navigate to `/upload` (or click "Upload Meal")
- [ ] **Expected:** Upload page loads
- [ ] See upload area with camera icon
- [ ] **Test Image Upload:**
  - [ ] Click upload area or drag & drop
  - [ ] Select a food image (any food photo)
  - [ ] **Expected:** 
    - Image preview appears
    - Image shows in preview area
    - "Remove" button appears

#### 4.2: Analyze Meal
- [ ] Click "Analyze Meal" button
- [ ] **Expected:**
  - Button shows "Analyzing Meal..." with spinner
  - Loading state active
- [ ] Wait 10-30 seconds for AI analysis
- [ ] **Expected:**
  - Analysis results appear
  - Food name displayed (e.g., "Grilled chicken breast")
  - Initial macro values shown

#### 4.3: Portion Adjustment
- [ ] **Expected:** See "Portion Size" section
- [ ] See portion buttons: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- [ ] **Test 0.5x:**
  - [ ] Click "0.5x"
  - [ ] **Expected:**
    - Button highlights
    - Calories halve (e.g., 400 → 200)
    - Protein, Carbs, Fat all reduce by 50%
    - Original values show with strikethrough
- [ ] **Test 1x (Standard):**
  - [ ] Click "1x"
  - [ ] **Expected:** Values return to original
- [ ] **Test 1.5x:**
  - [ ] Click "1.5x"
  - [ ] **Expected:** All values increase by 50%
- [ ] **Test 2x:**
  - [ ] Click "2x"
  - [ ] **Expected:** All values double
- [ ] **Expected:** Real-time updates, no page refresh needed

#### 4.4: Save Meal
- [ ] Adjust portion to preference (or leave at 1x)
- [ ] Review AI advice section
- [ ] Click "Save to Dashboard"
- [ ] **Expected:**
  - Button shows "Saving..." with spinner
  - Image uploads to Firebase Storage
  - Meal data saves to Firestore
  - Redirected to `/dashboard`
  - No errors in console

---

### Test Scenario 5: Dashboard with Meals

#### 5.1: Progress Bars Update
- [ ] After saving first meal, check dashboard
- [ ] **Expected:**
  - Progress bars show progress (not empty)
  - Circles fill based on percentage
  - Color coding:
    - Green: 0-79% consumed
    - Yellow: 80-99% consumed
    - Red: 100%+ consumed
- [ ] **Expected:** "Remaining" amounts decreased
- [ ] **Expected:** Summary cards show consumed amounts

#### 5.2: Meal Timeline
- [ ] Scroll down to "Recent Meals" section
- [ ] **Expected:** See saved meal displayed:
  - [ ] Food photo (thumbnail)
  - [ ] Food name
  - [ ] Date and time
  - [ ] Macro breakdown (calories, protein, carbs, fat)
  - [ ] AI advice section

#### 5.3: Multiple Meals
- [ ] Upload 2-3 more meals with different foods
- [ ] Adjust portions differently for each
- [ ] Save all meals
- [ ] **Expected:**
  - Progress bars update cumulatively
  - All meals appear in timeline
  - Remaining amounts decrease with each meal
  - Meals ordered by most recent first

#### 5.4: Budget Limits
- [ ] Keep adding meals until approaching targets
- [ ] **Watch progress bars:**
  - [ ] As you approach 80%, bars turn yellow
  - [ ] At 100%, bars turn red
  - [ ] Over 100%, bars stay red, show over-budget
- [ ] **Expected:** Visual feedback is clear

---

### Test Scenario 6: Daily Reset

#### 6.1: Today's Meals Only
- [ ] Add several meals today
- [ ] **Expected:** All meals count toward today's budget
- [ ] **Note:** Meals from previous days won't show (by design)
- [ ] **Expected:** Dashboard only shows today's meals

---

### Test Scenario 7: User Profile & Settings

#### 7.1: Profile Persistence
- [ ] Complete onboarding with specific macros
- [ ] Log out
- [ ] Log back in
- [ ] **Expected:** 
  - Dashboard shows same macro targets
  - Profile data persisted in Firestore

#### 7.2: Re-onboarding
- [ ] Log out
- [ ] Register new account
- [ ] **Expected:** Redirected to onboarding
- [ ] Complete onboarding with different values
- [ ] **Expected:** New profile saved, different targets shown

---

### Test Scenario 8: Error Handling

#### 8.1: Network Errors
- [ ] Disconnect internet
- [ ] Try to upload meal
- [ ] **Expected:** Error message displayed
- [ ] Reconnect internet
- [ ] **Expected:** Can retry successfully

#### 8.2: Invalid Inputs
- [ ] Go to onboarding
- [ ] Try entering invalid data:
  - [ ] Age: `200` (too high)
  - [ ] Weight: `-10` (negative)
  - [ ] Height: `50` (too short)
- [ ] **Expected:** Validation prevents invalid values

#### 8.3: Missing API Keys
- [ ] If OpenAI key missing:
  - [ ] Try analyzing meal
  - [ ] **Expected:** Clear error message
- [ ] If Firebase not configured:
  - [ ] Try saving meal
  - [ ] **Expected:** Error message, no crash

---

### Test Scenario 9: Mobile Responsiveness

#### 9.1: Mobile View
- [ ] Open browser DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select mobile device (iPhone/Android)
- [ ] **Test all pages:**
  - [ ] Landing page: Layout stacks vertically
  - [ ] Onboarding: Forms are touch-friendly
  - [ ] Dashboard: Progress bars stack nicely
  - [ ] Upload: Image upload works on mobile
- [ ] **Expected:** All features work on mobile

#### 9.2: Tablet View
- [ ] Switch to tablet view (iPad)
- [ ] **Expected:** Layout adapts, still functional

---

### Test Scenario 10: Edge Cases

#### 10.1: Very High/Low Values
- [ ] Test with extreme values:
  - [ ] Weight: 50kg (very light)
  - [ ] Weight: 150kg (very heavy)
  - [ ] Age: 18 (young)
  - [ ] Age: 70 (older)
- [ ] **Expected:** Macros calculate correctly

#### 10.2: Rapid Interactions
- [ ] Quickly click through onboarding steps
- [ ] **Expected:** No race conditions, data saves correctly

#### 10.3: Browser Refresh
- [ ] Complete onboarding
- [ ] Refresh browser (F5)
- [ ] **Expected:** Dashboard loads, data persists

---

## ✅ Test Checklist Summary

### Core Functionality
- [ ] User registration works
- [ ] Onboarding flow completes successfully
- [ ] Macro targets calculated correctly
- [ ] Dashboard displays progress bars
- [ ] Food upload and analysis works
- [ ] Portion adjustment works
- [ ] Meals save to dashboard
- [ ] Progress tracking updates correctly

### UI/UX
- [ ] All pages load without errors
- [ ] Navigation works smoothly
- [ ] Forms are user-friendly
- [ ] Error messages are clear
- [ ] Loading states show properly
- [ ] Mobile responsive

### Data Persistence
- [ ] User profile saves to Firestore
- [ ] Meals save to Firestore
- [ ] Images upload to Firebase Storage
- [ ] Data persists after logout/login

### Edge Cases
- [ ] Handles missing data gracefully
- [ ] Validates inputs properly
- [ ] Shows helpful error messages
- [ ] No console errors

---

## 🐛 Common Issues & Solutions

### Issue: Onboarding redirects immediately
**Solution:** Check if profile already exists. Delete from Firestore or use new account.

### Issue: Progress bars not showing
**Solution:** 
- Check browser console for errors
- Verify user profile exists
- Check if meals are from today

### Issue: Image upload fails
**Solution:**
- Check Firebase Storage rules
- Verify Firebase config in `.env.local`
- Check browser console for errors

### Issue: AI analysis fails
**Solution:**
- Verify `OPENAI_API_KEY` in `.env.local`
- Check OpenAI account has credits
- Check network connection

### Issue: Macros not calculating
**Solution:**
- Verify all onboarding fields filled
- Check unit conversions (kg/lbs, cm/ft+in)
- Check browser console for calculation errors

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
OS: ___________

Test Results:
- Registration: [ ] Pass [ ] Fail
- Onboarding: [ ] Pass [ ] Fail
- Dashboard: [ ] Pass [ ] Fail
- Upload: [ ] Pass [ ] Fail
- Portion Adjustment: [ ] Pass [ ] Fail
- Progress Tracking: [ ] Pass [ ] Fail
- Mobile: [ ] Pass [ ] Fail

Issues Found:
1. 
2. 
3. 

Notes:
```

---

## 🎯 Quick Smoke Test (5 minutes)

For a quick test of core functionality:

1. ✅ Register new account
2. ✅ Complete onboarding (use default values)
3. ✅ Upload one meal photo
4. ✅ Analyze meal
5. ✅ Adjust portion to 1.5x
6. ✅ Save to dashboard
7. ✅ Verify progress bars updated
8. ✅ Check meal appears in timeline

**If all pass → Core functionality works!**

---

## 📝 Testing Tips

1. **Use Browser DevTools:**
   - Console tab: Check for errors
   - Network tab: Verify API calls
   - Application tab: Check localStorage/Firestore

2. **Test Different Goals:**
   - Try all 4 goal types
   - Verify macro calculations differ

3. **Test Unit Conversions:**
   - Switch between kg/lbs
   - Switch between cm/ft+in
   - Verify calculations stay correct

4. **Test Portion Adjustments:**
   - Try all multipliers
   - Verify calculations are accurate

5. **Monitor Console:**
   - Keep DevTools open
   - Watch for errors/warnings
   - Check network requests

---

**Happy Testing! 🚀**

