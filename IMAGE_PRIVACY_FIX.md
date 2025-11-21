# Image Privacy Fix - Signed URLs Implementation

## Problem
Images were being stored with public URLs, making them accessible to anyone who had the link. This was a privacy/security concern.

## Solution
Changed the implementation to use **signed URLs** instead of public URLs:

1. **Storage Path Instead of Public URL**: When saving meals, we now store the storage path (e.g., `{userId}/timestamp_filename.jpg`) instead of a public URL.

2. **Signed URLs Generated On-Demand**: When displaying images in the dashboard, we generate time-limited signed URLs (valid for 1 hour) that require authentication.

3. **Backward Compatibility**: The code checks if `image_url` is already a full URL (for existing data) and uses it as-is, or generates a signed URL if it's a storage path.

## Changes Made

### 1. Upload Flow (`app/upload/page-client.tsx`)
- **Before**: Generated public URL and stored it in database
- **After**: Stores the storage path directly in the database

```typescript
// Now stores: "userId/timestamp_filename.jpg"
// Instead of: "https://supabase.co/storage/v1/object/public/meal-images/..."
```

### 2. Dashboard Display (`app/dashboard/page.tsx`)
- **Before**: Used stored URL directly
- **After**: Generates signed URLs when fetching meals

All meal fetching locations now generate signed URLs:
- Initial fetch
- Real-time subscription refetch (INSERT)
- Real-time subscription refetch (UPDATE/DELETE)
- Page focus/visibility refetch

## Supabase Storage Setup

**IMPORTANT**: Ensure your Supabase Storage bucket is set to **Private**:

1. Go to Supabase Dashboard → Storage
2. Click on the `meal-images` bucket
3. Ensure it's set to **Private** (not Public)
4. Verify your Storage policies are correctly set:

```sql
-- Upload Policy
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Read Policy
CREATE POLICY "Users can read images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);
```

## How It Works

1. **User uploads image** → Saved to `meal-images/{userId}/filename.jpg`
2. **Storage path saved to database** → `image_url` column contains `{userId}/filename.jpg`
3. **Dashboard fetches meals** → For each meal, generates a signed URL:
   ```typescript
   const { data } = await supabase.storage
     .from('meal-images')
     .createSignedUrl(storagePath, 3600) // Valid for 1 hour
   ```
4. **Image displayed** → Uses the signed URL which expires after 1 hour

## Benefits

✅ **Privacy**: Images are only accessible via signed URLs that expire
✅ **Security**: Only authenticated users can generate signed URLs for their own images
✅ **Backward Compatible**: Existing meals with full URLs still work
✅ **Automatic**: Signed URLs are generated automatically when needed

## Testing

1. Upload a new meal image
2. Check the database - `image_url` should be a path like `userId/timestamp_filename.jpg`
3. View the dashboard - images should still display correctly
4. Check browser network tab - image URLs should be signed URLs (contain query parameters)

## Notes

- Signed URLs expire after 1 hour, but are regenerated when the dashboard refetches meals
- If a signed URL expires while viewing, refreshing the page will generate a new one
- The bucket must be **Private** for this to work correctly


