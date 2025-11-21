/**
 * Migration Script: Convert Public URLs to Storage Paths
 * 
 * This script updates existing meal records that have public URLs
 * to use storage paths instead. It extracts the path from the URL.
 * 
 * Run this once to migrate old data.
 * 
 * Usage:
 * 1. Set up your .env.local with Supabase credentials
 * 2. Run: node scripts/migrate-image-urls.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  })
  
  return env
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

// Use service role key for admin access (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateImageUrls() {
  console.log('🔄 Starting image URL migration...\n')

  try {
    // Fetch all meals with public URLs
    const { data: meals, error: fetchError } = await supabase
      .from('meals')
      .select('id, image_url, user_id')
      .not('image_url', 'is', null)

    if (fetchError) {
      console.error('❌ Error fetching meals:', fetchError)
      return
    }

    if (!meals || meals.length === 0) {
      console.log('✅ No meals found to migrate')
      return
    }

    console.log(`📦 Found ${meals.length} meals to check\n`)

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const meal of meals) {
      const imageUrl = meal.image_url

      // Skip if already a storage path (doesn't start with http)
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        console.log(`⏭️  Skipping ${meal.id}: Already a storage path`)
        skipped++
        continue
      }

      // Extract storage path from public URL
      // Format: https://{project}.supabase.co/storage/v1/object/public/meal-images/{userId}/filename
      const urlPattern = /\/meal-images\/(.+)$/
      const match = imageUrl.match(urlPattern)

      if (!match) {
        console.log(`⚠️  Skipping ${meal.id}: Could not extract path from URL: ${imageUrl}`)
        skipped++
        continue
      }

      const storagePath = match[1] // This is the userId/filename part

      // Verify the path matches the user_id
      if (!storagePath.startsWith(meal.user_id)) {
        console.log(`⚠️  Skipping ${meal.id}: Path doesn't match user_id`)
        skipped++
        continue
      }

      // Update the record
      const { error: updateError } = await supabase
        .from('meals')
        .update({ image_url: storagePath })
        .eq('id', meal.id)

      if (updateError) {
        console.error(`❌ Error updating ${meal.id}:`, updateError.message)
        errors++
      } else {
        console.log(`✅ Updated ${meal.id}: ${imageUrl.substring(0, 50)}... → ${storagePath}`)
        updated++
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Updated: ${updated}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`\n✅ Migration complete!`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateImageUrls()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })

