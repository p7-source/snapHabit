# Detailed Guide: Testing Scenario 4 - Food Upload & Analysis

## 🎯 Overview

This guide walks you through testing the food upload and AI analysis feature step-by-step.

---

## 📋 Prerequisites

Before starting:
- ✅ You're logged in to the app
- ✅ You've completed onboarding (have macro targets set)
- ✅ You're on the dashboard or upload page
- ✅ Server is running (http://localhost:3000)
- ✅ OpenAI API key is configured

---

## 🧪 Step-by-Step Test Instructions

### Step 1: Navigate to Upload Page

**Option A: From Dashboard**
1. Go to http://localhost:3000/dashboard
2. Click the **"Upload Meal"** button (top right or in header)
3. **Expected:** Navigate to `/upload` page

**Option B: Direct URL**
1. Go directly to http://localhost:3000/upload
2. **Expected:** Page loads (if not logged in, redirects to login)

**Verify Page Loads:**
- [ ] Page title: "Upload Your Meal"
- [ ] Subtitle: "Take a photo of your meal and get instant nutrition insights"
- [ ] Upload area visible with camera icon
- [ ] Navigation bar at top
- [ ] No console errors

---

### Step 2: Prepare Test Image

**Option A: Use Real Food Photo**
- Take a photo of any food with your phone
- Transfer to computer
- Save in an accessible location

**Option B: Use Sample Food Images**
- Download food images from:
  - Unsplash (search "food")
  - Pexels (search "food")
  - Or use any food photo you have

**Recommended Test Images:**
- ✅ Clear food photo (e.g., chicken and rice)
- ✅ Multiple items (e.g., salad with protein)
- ✅ Single item (e.g., pizza slice)
- ✅ Complex meal (e.g., full plate with sides)

**Image Requirements:**
- Format: JPG, PNG, or WebP
- Size: Any (app handles resizing)
- Quality: Clear, well-lit photos work best

---

### Step 3: Upload Image

**Method 1: Click to Upload**
1. Click on the upload area (box with camera icon)
2. File picker opens
3. Navigate to your test image
4. Select the image
5. Click "Open"
6. **Expected:**
   - Image preview appears
   - Image displays in preview area
   - "Remove" button appears
   - Upload area shows selected image

**Method 2: Drag & Drop**
1. Open file explorer
2. Drag your test image file
3. Drop it onto the upload area
4. **Expected:**
   - Image preview appears
   - Image displays immediately
   - "Remove" button appears

**Verify Upload:**
- [ ] Image preview shows correctly
- [ ] Image is not distorted
- [ ] "Remove" button is visible
- [ ] Can see the food in the preview

**Test Remove:**
- [ ] Click "Remove" button
- [ ] **Expected:** Image disappears, upload area resets
- [ ] Upload image again to continue testing

---

### Step 4: Analyze Meal

**Before Analysis:**
- [ ] Image is uploaded and visible
- [ ] "Analyze Meal" button is visible
- [ ] Button is enabled (not disabled)

**Start Analysis:**
1. Click the **"Analyze Meal"** button
2. **Expected Immediately:**
   - Button text changes to "Analyzing Meal..."
   - Spinner/loading icon appears
   - Button becomes disabled
   - No page refresh

**During Analysis (10-30 seconds):**
- [ ] Loading state persists
- [ ] Button shows spinner
- [ ] Can see "Analyzing Meal..." text
- [ ] No errors in console (check F12)

**After Analysis Completes:**
- [ ] Loading state disappears
- [ ] Analysis results appear below
- [ ] Button disappears (replaced by results)
- [ ] No error messages

---

### Step 5: Verify Analysis Results

**Expected Results Section:**
- [ ] Card appears with "Analysis Results" header
- [ ] Food name displayed (e.g., "Grilled chicken breast with rice")
- [ ] Portion adjustment section visible
- [ ] Macro values displayed
- [ ] AI advice section visible

**Food Name:**
- [ ] Food name is displayed prominently
- [ ] Name is relevant to the image
- [ ] Format: Clear, readable text

**Initial Macro Values:**
- [ ] Calories displayed (e.g., "400")
- [ ] Protein displayed (e.g., "30g")
- [ ] Carbs displayed (e.g., "45g")
- [ ] Fat displayed (e.g., "15g")
- [ ] All values are positive numbers
- [ ] Values seem reasonable for the food

**AI Advice:**
- [ ] "AI Nutrition Advice" section visible
- [ ] Advice text is displayed
- [ ] Text is 2-3 sentences
- [ ] Advice is relevant and helpful

---

### Step 6: Test Portion Adjustment

**Locate Portion Section:**
- [ ] See "Portion Size" label
- [ ] See current portion (e.g., "1x (Standard)")
- [ ] See 6 buttons: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- [ ] Default is "1x" (highlighted)

**Test Each Multiplier:**

**0.5x (Half Portion):**
1. Click "0.5x" button
2. **Expected:**
   - Button highlights (primary color)
   - Portion label changes to "0.5x"
   - Calories reduce by 50% (e.g., 400 → 200)
   - Protein reduces by 50% (e.g., 30g → 15g)
   - Carbs reduce by 50% (e.g., 45g → 22.5g)
   - Fat reduces by 50% (e.g., 15g → 7.5g)
   - Original values show with strikethrough
   - Updates happen instantly (no delay)

**0.75x (Three-Quarter Portion):**
1. Click "0.75x" button
2. **Expected:**
   - Button highlights
   - All values reduce by 25% from original
   - Original values still show with strikethrough

**1x (Standard - Original):**
1. Click "1x" button
2. **Expected:**
   - Button highlights
   - Values return to original
   - Strikethrough disappears
   - Portion label shows "1x (Standard)"

**1.25x (One and Quarter):**
1. Click "1.25x" button
2. **Expected:**
   - Values increase by 25% from original
   - Original values show with strikethrough

**1.5x (One and Half):**
1. Click "1.5x" button
2. **Expected:**
   - Values increase by 50% from original
   - Original values show with strikethrough

**2x (Double):**
1. Click "2x" button
2. **Expected:**
   - Values double from original
   - Original values show with strikethrough

**Verify Calculations:**
- [ ] All calculations are accurate
- [ ] Values update in real-time
- [ ] No page refresh needed
- [ ] Strikethrough shows original values correctly

---

### Step 7: Save Meal to Dashboard

**Before Saving:**
- [ ] Analysis is complete
- [ ] Portion is adjusted (or left at 1x)
- [ ] All macro values are visible
- [ ] "Save to Dashboard" button is visible

**Save Meal:**
1. Click **"Save to Dashboard"** button
2. **Expected Immediately:**
   - Button text changes to "Saving..."
   - Spinner appears
   - Button becomes disabled
   - No page refresh

**During Save (2-5 seconds):**
- [ ] Loading state persists
- [ ] Image uploads to Firebase Storage
- [ ] Meal data saves to Firestore
- [ ] No errors in console

**After Save Completes:**
- [ ] Redirected to `/dashboard`
- [ ] Dashboard loads successfully
- [ ] No error messages
- [ ] Meal appears in timeline

---

### Step 8: Verify Meal Saved on Dashboard

**Check Progress Bars:**
- [ ] Progress bars updated (not empty)
- [ ] Circles show progress filled
- [ ] Color is green (if under 80%)
- [ ] "Remaining" amounts decreased
- [ ] Summary cards show consumed amounts

**Check Meal Timeline:**
1. Scroll down to "Recent Meals" section
2. **Expected:** See your saved meal
3. **Verify Meal Display:**
   - [ ] Food photo thumbnail visible
   - [ ] Food name matches what was analyzed
   - [ ] Date and time displayed (today's date)
   - [ ] Macro breakdown shows:
     - [ ] Calories (matches saved value)
     - [ ] Protein (matches saved value)
     - [ ] Carbs (matches saved value)
     - [ ] Fat (matches saved value)
   - [ ] AI advice section visible

**Verify Values Match:**
- [ ] Calories on dashboard = Calories you saved
- [ ] Protein on dashboard = Protein you saved
- [ ] Carbs on dashboard = Carbs you saved
- [ ] Fat on dashboard = Fat you saved

---

## 🧪 Advanced Testing

### Test Multiple Meals

1. Upload second meal
2. Analyze with different portion (e.g., 1.5x)
3. Save to dashboard
4. **Expected:**
   - Progress bars update cumulatively
   - Both meals appear in timeline
   - Remaining amounts decrease further
   - Total consumed = sum of all meals

### Test Different Foods

Try analyzing:
- [ ] Protein-heavy meal (chicken, fish)
- [ ] Carb-heavy meal (pasta, rice)
- [ ] Mixed meal (salad with protein)
- [ ] Snack (fruit, nuts)
- [ ] **Expected:** Different macro profiles for each

### Test Portion Edge Cases

- [ ] Very small portion (0.5x)
- [ ] Very large portion (2x)
- [ ] Switch between multipliers multiple times
- [ ] **Expected:** All calculations remain accurate

---

## 🐛 Error Scenarios to Test

### Error 1: No Image Selected
- [ ] Try clicking "Analyze Meal" without uploading image
- [ ] **Expected:** Button disabled or error message

### Error 2: Analysis Fails
- [ ] If OpenAI API key is missing/invalid:
  - [ ] Error message appears
  - [ ] Message is clear and helpful
  - [ ] Can retry or go back

### Error 3: Network Issues
- [ ] Disconnect internet
- [ ] Try analyzing meal
- [ ] **Expected:** Error message about network
- [ ] Reconnect and retry
- [ ] **Expected:** Works after reconnection

### Error 4: Save Fails
- [ ] If Firebase Storage fails:
  - [ ] Error message appears
  - [ ] Can retry saving
  - [ ] No data loss

---

## ✅ Success Criteria Checklist

**Upload:**
- [ ] Can upload image via click
- [ ] Can upload image via drag & drop
- [ ] Image preview works
- [ ] Can remove and re-upload

**Analysis:**
- [ ] Analysis completes successfully
- [ ] Food name is detected
- [ ] Macros are calculated
- [ ] AI advice is provided
- [ ] Results display correctly

**Portion Adjustment:**
- [ ] All multipliers work (0.5x to 2x)
- [ ] Calculations are accurate
- [ ] Updates are instant
- [ ] Original values show when adjusted

**Save:**
- [ ] Meal saves successfully
- [ ] Redirects to dashboard
- [ ] Progress bars update
- [ ] Meal appears in timeline
- [ ] Values match what was saved

---

## 📊 Test Results Template

```
Test Date: ___________
Tester: ___________
Test Image: ___________

Upload Test:
- Image upload: [ ] Pass [ ] Fail
- Image preview: [ ] Pass [ ] Fail
- Remove image: [ ] Pass [ ] Fail

Analysis Test:
- Analysis completes: [ ] Pass [ ] Fail
- Food name detected: [ ] Pass [ ] Fail
- Macros calculated: [ ] Pass [ ] Fail
- AI advice shown: [ ] Pass [ ] Fail
- Time taken: _____ seconds

Portion Adjustment Test:
- 0.5x works: [ ] Pass [ ] Fail
- 0.75x works: [ ] Pass [ ] Fail
- 1x works: [ ] Pass [ ] Fail
- 1.25x works: [ ] Pass [ ] Fail
- 1.5x works: [ ] Pass [ ] Fail
- 2x works: [ ] Pass [ ] Fail
- Calculations accurate: [ ] Pass [ ] Fail

Save Test:
- Saves successfully: [ ] Pass [ ] Fail
- Redirects correctly: [ ] Pass [ ] Fail
- Dashboard updates: [ ] Pass [ ] Fail
- Values match: [ ] Pass [ ] Fail

Issues Found:
1. 
2. 
3. 

Notes:
```

---

## 💡 Pro Tips

1. **Use Real Food Photos:**
   - Better AI detection
   - More realistic testing
   - See actual macro calculations

2. **Test Different Portion Sizes:**
   - Verify calculations are correct
   - Check that original values show correctly

3. **Monitor Console:**
   - Keep DevTools open (F12)
   - Watch for errors during analysis
   - Check network requests

4. **Test Multiple Times:**
   - Upload same image multiple times
   - Try different portion adjustments
   - Verify consistency

5. **Check Dashboard After Each Save:**
   - Verify progress bars update
   - Check cumulative totals
   - Ensure meals appear correctly

---

## 🎯 Quick Test (2 minutes)

For a quick test:
1. ✅ Upload any food image
2. ✅ Click "Analyze Meal" (wait 10-30s)
3. ✅ Adjust portion to 1.5x
4. ✅ Click "Save to Dashboard"
5. ✅ Verify meal appears on dashboard

**If all pass → Upload & Analysis works!**

---

**Ready to test? Start with Step 1! 🚀**

