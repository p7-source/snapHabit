import { getSupabaseClient } from "./supabase"

/**
 * Generates a signed URL for an image from a storage path or returns the URL if it's already a full URL.
 * 
 * @param imageUrl - Either a storage path (e.g., "userId/filename.jpg") or a full URL
 * @returns A signed URL that can be used to display the image, or the original URL if it's already a full URL
 */
export async function getImageUrl(imageUrl: string | null | undefined): Promise<string> {
  // If no image URL is provided, return empty string
  if (!imageUrl) {
    console.warn('⚠️ getImageUrl: No imageUrl provided')
    return ''
  }

  console.log('🖼️ getImageUrl called with:', {
    imageUrl,
    type: typeof imageUrl,
    length: imageUrl.length
  })

  // If it's already a full URL (starts with http:// or https://), return it as-is
  // This provides backward compatibility with existing meals that have full URLs
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('✅ getImageUrl: Already a full URL, returning as-is')
    return imageUrl
  }

  // Otherwise, it's a storage path - generate a signed URL
  try {
    console.log('🖼️ getImageUrl: Generating signed URL for storage path:', imageUrl)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage
      .from('meal-images')
      .createSignedUrl(imageUrl, 3600) // Valid for 1 hour

    if (error) {
      console.error('❌ Error generating signed URL:', error)
      console.error('   Error details:', JSON.stringify(error, null, 2))
      return '' // Return empty string on error
    }

    const signedUrl = data?.signedUrl || ''
    console.log('✅ getImageUrl: Generated signed URL:', {
      hasUrl: !!signedUrl,
      urlLength: signedUrl.length,
      urlPreview: signedUrl.substring(0, 50) + '...'
    })
    return signedUrl
  } catch (error) {
    console.error('❌ Exception generating signed URL:', error)
    return '' // Return empty string on exception
  }
}

/**
 * Generates signed URLs for multiple images in parallel.
 * 
 * @param imageUrls - Array of storage paths or full URLs
 * @returns Array of signed URLs (or original URLs if they were already full URLs)
 */
export async function getImageUrls(imageUrls: (string | null | undefined)[]): Promise<string[]> {
  return Promise.all(imageUrls.map(url => getImageUrl(url)))
}

