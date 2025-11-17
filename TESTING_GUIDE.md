# UI Testing Guide

## 🚀 Quick Start

1. **Make sure the dev server is running:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   - Navigate to: http://localhost:3000

---

## 📋 Step-by-Step Testing Guide

### 1. Test New User Registration & Onboarding

#### Step 1.1: Register a New Account
1. Go to http://localhost:3000
2. Click **"Login"** in the top right
3. Click **"Register"** or go to http://localhost:3000/register
4. Fill in:
   - Email: `test@example.com`
   - Password: `password123` (min 6 characters)
   - Confirm Password: `password123`
5. Click **"Create Account"**
6. **Expected:** You should be redirected to `/onboarding`

#### Step 1.2: Complete Onboarding Flow

**Step 1: Select Goal**
- You'll see 3 options: "Lose Weight", "Maintain Weight", "Gain Weight"
- Click on one (e.g., "Lose Weight")
- Click **"Next"**
- **Expected:** Progress bar moves to 20%, moves to next step

**Step 2: Enter Age & Gender**
- Enter your age (e.g., `25`)
- Select gender: Male, Female, or Other
- Click **"Next"**
- **Expected:** Progress bar moves to 40%, moves to next step

**Step 3: Enter Weight & Height**
- Enter weight in kg (e.g., `70`)
- Enter height in cm (e.g., `175`)
- Click **"Next"**
- **Expected:** Progress bar moves to 60%, moves to next step

**Step 4: Select Activity Level**
- Choose one:
  - Sedentary (Little to no exercise)
  - Lightly Active (Light exercise 1-3 days/week)
  - Moderately Active (Moderate exercise 3-5 days/week)
  - Very Active (Hard exercise 6-7 days/week)
  - Extremely Active (Very hard exercise, physical job)
- Click **"Next"**
- **Expected:** Progress bar moves to 80%, moves to final step

**Step 5: Review Macro Targets**
- You'll see your calculated macro targets:
  - Calories (e.g., 1800 kcal)
  - Protein (e.g., 140g)
  - Carbs (e.g., 180g)
  - Fat (e.g., 50g)
- Review your goal and activity level
- Click **"Complete Setup"**
- **Expected:** You're redirected to `/dashboard`

---

### 2. Test Dashboard with Macro Budget Tracking

#### Step 2.1: View Empty Dashboard
1. After onboarding, you should be on the dashboard
2. **Expected to see:**
   - Header: "Today's Macro Budget"
   - 4 circular progress bars (Calories, Protein, Carbs, Fat)
   - All progress bars at 0% (empty circles)
   - "Remaining" amounts showing full targets
   - Summary cards showing "0 / [target]" for each macro
   - Empty state: "No meals tracked yet"

#### Step 2.2: Verify Progress Bars
- **Calories:** Should show 0 in center, full target as "Remaining"
- **Protein:** Should show 0g, full target remaining
- **Carbs:** Should show 0g, full target remaining
- **Fat:** Should show 0g, full target remaining
- All circles should be green (empty = good)

---

### 3. Test Food Upload & Portion Adjustment

#### Step 3.1: Upload a Meal Photo
1. Click **"Upload Meal"** button (top right or in header)
2. You'll be taken to `/upload`
3. **Upload an image:**
   - Click the upload area or drag & drop
   - Select any food image (or use a test image)
4. **Expected:** Image preview appears

#### Step 3.2: Analyze the Meal
1. Click **"Analyze Meal"** button
2. Wait for AI analysis (may take 10-30 seconds)
3. **Expected to see:**
   - Food name (e.g., "Grilled chicken breast with rice")
   - Initial macro values displayed
   - Portion adjustment section

#### Step 3.3: Test Portion Adjustment
1. **Find the "Portion Size" section**
2. **Test different multipliers:**
   - Click **"0.5x"** → Values should halve
   - Click **"0.75x"** → Values should reduce by 25%
   - Click **"1x"** → Values return to original (standard)
   - Click **"1.25x"** → Values increase by 25%
   - Click **"1.5x"** → Values increase by 50%
   - Click **"2x"** → Values double
3. **Expected:**
   - Selected button highlights (primary color)
   - Calories, Protein, Carbs, Fat update in real-time
   - Original values show with strikethrough when adjusted
   - Current values shown prominently

#### Step 3.4: Save the Meal
1. Adjust portion to your preference (or leave at 1x)
2. Click **"Save to Dashboard"**
3. **Expected:**
   - Button shows "Saving..." with spinner
   - Redirects to `/dashboard` after save

---

### 4. Test Dashboard with Meals

#### Step 4.1: Verify Progress Bars Update
1. After saving a meal, you should be on the dashboard
2. **Expected to see:**
   - Progress bars now show progress (not empty)
   - Circles fill based on percentage consumed
   - **Color coding:**
     - Green: 0-79% (good)
     - Yellow: 80-99% (warning)
     - Red: 100%+ (over budget)
   - "Remaining" amounts decreased
   - Summary cards show consumed amounts

#### Step 4.2: Check Meal Timeline
1. Scroll down to "Recent Meals" section
2. **Expected to see:**
   - Your saved meal with photo
   - Food name
   - Date and time
   - Macro breakdown (calories, protein, carbs, fat)
   - AI advice section

#### Step 4.3: Add More Meals
1. Click **"Upload Meal"** again
2. Upload and analyze another meal
3. Adjust portion if needed
4. Save to dashboard
5. **Expected:**
   - Progress bars update with cumulative totals
   - Multiple meals appear in timeline
   - Remaining amounts decrease further

#### Step 4.4: Test Budget Limits
1. Keep adding meals until you approach your targets
2. **Watch the progress bars:**
   - As you get closer to 80%, bars turn yellow
   - At 100%, bars turn red
   - Over 100%, bars stay red and show over-budget

---

### 5. Test Edge Cases

#### Test 5.1: New User Without Profile
1. **Log out** (click "Sign Out")
2. **Register a new account** with different email
3. **Expected:** Redirected to onboarding (not dashboard)

#### Test 5.2: Existing User Login
1. **Log out**
2. **Log in** with existing account
3. **Expected:**
   - If profile exists → Go to dashboard
   - If no profile → Redirected to onboarding

#### Test 5.3: Daily Reset
1. The dashboard only shows **today's meals**
2. Meals from previous days won't count toward today's budget
3. **Note:** This is by design - each day starts fresh

---

## 🎯 What to Look For

### ✅ Success Indicators

**Onboarding:**
- Smooth 5-step flow
- Progress bar updates correctly
- Macro targets calculated and displayed
- Can complete setup successfully

**Dashboard:**
- Circular progress bars render correctly
- Progress fills smoothly
- Colors change appropriately (green → yellow → red)
- Remaining amounts calculate correctly
- Summary cards show accurate consumed/target ratios

**Upload & Portion:**
- Image uploads successfully
- AI analysis completes
- Portion adjustment works instantly
- Values recalculate correctly
- Original values show when adjusted
- Meal saves and appears on dashboard

**Budget Tracking:**
- Only today's meals count
- Progress bars reflect current consumption
- Remaining amounts are accurate
- Visual feedback is clear

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property 'macroTargets' of null"
**Solution:** Make sure you completed onboarding. Log out and register a new account.

### Issue: Progress bars not showing
**Solution:** Check browser console for errors. Make sure you have a user profile.

### Issue: Portion adjustment not working
**Solution:** Make sure you've analyzed a meal first. The adjustment buttons only appear after analysis.

### Issue: Meals not appearing on dashboard
**Solution:** 
- Check if meals are from today (only today's meals show)
- Check browser console for Firestore errors
- Verify Firebase is configured correctly

---

## 📱 Mobile Testing

The app is mobile-first! Test on:
- **Mobile browser** (Chrome/Safari on phone)
- **Tablet** (iPad, Android tablet)
- **Responsive mode** in browser DevTools (F12 → Toggle device toolbar)

**Expected:**
- Progress bars stack vertically on mobile
- Portion buttons wrap nicely
- Forms are easy to fill on touch screens
- Navigation is accessible

---

## 🎨 Visual Checklist

- [ ] Progress bars are circular and smooth
- [ ] Colors change correctly (green/yellow/red)
- [ ] Numbers are readable and accurate
- [ ] Remaining amounts update correctly
- [ ] Portion buttons highlight when selected
- [ ] Meal timeline displays correctly
- [ ] Mobile layout works well
- [ ] Loading states show spinners
- [ ] Error messages are clear

---

## 🚀 Quick Test Flow

**Fastest way to test everything:**

1. Register → Onboarding → Complete all 5 steps
2. Upload meal → Analyze → Adjust portion → Save
3. Check dashboard → Verify progress bars updated
4. Upload 2-3 more meals → Watch progress bars fill
5. Test portion adjustment on each meal

**Total time: ~5-10 minutes**

---

Happy testing! 🎉

