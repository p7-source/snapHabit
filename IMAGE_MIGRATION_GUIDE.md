# Image Migration & Performance Optimization Guide

## Overview
This guide helps you:
1. **Migrate old image URLs** to storage paths (for privacy)
2. **Optimize image loading** to reduce bandwidth and improve performance

## Part 1: Migrate Old Image URLs

### Problem
Images uploaded before the privacy fix are stored with public URLs like:
```
https://{project}.supabase.co/storage/v1/object/public/meal-images/{userId}/filename.jpg
```

### Solution
Run the migration script to convert these to storage paths:
```
{userId}/filename.jpg
```

### Steps

1. **Ensure you have a Service Role Key** (for admin access):
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key (keep it secret!)
   - Add to `.env.local`:
     ```
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ```

2. **Run the migration script**:
   ```bash
   node scripts/migrate-image-urls.js
   ```

3. **What it does**:
   - Fetches all meals with public URLs
   - Extracts the storage path from each URL
   - Updates the database to store just the path
   - Skips meals that are already migrated

4. **Expected output**:
   ```
   🔄 Starting image URL migration...
   📦 Found 10 meals to check
   ✅ Updated meal-1: https://... → userId/filename.jpg
   ⏭️  Skipping meal-2: Already a storage path
   ...
   📊 Migration Summary:
      ✅ Updated: 8
      ⏭️  Skipped: 2
      ❌ Errors: 0
   ```

## Part 2: Optimize Image Loading

### Changes Made

1. **Lazy Loading**: Images now load only when they're about to enter the viewport
   - Uses native `loading="lazy"` attribute
   - Reduces initial page load time
   - Saves bandwidth for users on slow connections

2. **Error Handling**: Images that fail to load are hidden automatically
   - Prevents broken image icons
   - Graceful degradation

3. **Conditional Rendering**: Images are only rendered if `imageUrl` exists
   - Layout adjusts automatically (3 columns with image, 3 columns without)

### How It Works

**Before:**
```tsx
<img src={meal.imageUrl} alt={meal.foodName} />
```

**After:**
```tsx
{meal.imageUrl && (
  <img
    src={meal.imageUrl}
    alt={meal.foodName}
    loading="lazy"
    decoding="async"
    onError={(e) => {
      e.currentTarget.style.display = 'none'
    }}
  />
)}
```

### Benefits

✅ **Reduced Bandwidth**: Images load only when needed
✅ **Faster Initial Load**: Page renders without waiting for images
✅ **Better Mobile Experience**: Saves data on mobile networks
✅ **Graceful Degradation**: App works even if images fail to load

## Optional: Completely Hide Images

If you want to completely hide images from the UI (not just lazy load), you can:

1. **Add a user preference** (stored in `profiles` table):
   ```sql
   ALTER TABLE profiles ADD COLUMN show_images BOOLEAN DEFAULT true;
   ```

2. **Update DailyView component** to check the preference:
   ```tsx
   {profile.showImages && meal.imageUrl && (
     <div>...</div>
   )}
   ```

3. **Add a toggle in settings** to let users control this

## Testing

1. **Test Migration**:
   - Run migration script
   - Check database: `image_url` should be paths, not full URLs
   - Verify dashboard still shows images correctly

2. **Test Lazy Loading**:
   - Open browser DevTools → Network tab
   - Load dashboard
   - Scroll down - images should load as you scroll
   - Check that initial page load doesn't fetch all images

3. **Test Error Handling**:
   - Temporarily break an image URL in database
   - Reload dashboard
   - Image should be hidden, not show broken icon

## Troubleshooting

### Migration Script Errors

**"Missing Supabase credentials"**
- Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`
- Add `SUPABASE_SERVICE_ROLE_KEY` (or use `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

**"Permission denied"**
- Use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Or ensure your user has admin access

**"Could not extract path from URL"**
- Some URLs might have different formats
- Check the URL pattern in the script matches your Supabase project

### Images Not Loading

**Check signed URL generation**:
- Ensure bucket is set to **Private**
- Verify Storage policies allow authenticated reads
- Check browser console for errors

**Check image paths**:
- Verify `image_url` in database is a path (not full URL)
- Path should be: `{userId}/filename.jpg`

## Next Steps

1. ✅ Run migration script
2. ✅ Test image loading
3. ✅ Monitor bandwidth usage
4. ⚠️ Consider adding image compression on upload
5. ⚠️ Consider adding thumbnail generation
6. ⚠️ Consider CDN for image delivery

