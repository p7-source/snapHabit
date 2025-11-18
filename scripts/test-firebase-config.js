// Quick script to test Firebase configuration
// Run with: node scripts/test-firebase-config.js

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Firebase Configuration...\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
const envExists = fs.existsSync(envPath)

if (!envExists) {
  console.log('❌ .env.local file not found!')
  console.log('\n📝 To fix:')
  console.log('  1. Create a .env.local file in the project root')
  console.log('  2. Copy from .env.local.example if it exists')
  console.log('  3. Add your Firebase configuration variables')
  process.exit(1)
}

console.log('✅ .env.local file found')

// Read and parse .env.local
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach((line) => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
    }
  }
})

// Check required variables
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
]

let allPresent = true
const missing = []

console.log('\n📋 Checking environment variables:')
requiredVars.forEach((varName) => {
  const value = envVars[varName]
  if (value && value.length > 0) {
    const displayValue = varName.includes('KEY') || varName.includes('ID')
      ? `${value.substring(0, 10)}...` 
      : value
    console.log(`  ✅ ${varName}: ${displayValue}`)
  } else {
    console.log(`  ❌ ${varName}: MISSING or EMPTY`)
    allPresent = false
    missing.push(varName)
  }
})

console.log('\n')

if (allPresent) {
  console.log('✅ All Firebase environment variables are set!')
  console.log('\n📝 Next steps to test Firebase:')
  console.log('  1. Make sure your dev server is running: npm run dev')
  console.log('  2. Open browser and go to: http://localhost:3000/test-firebase')
  console.log('  3. Log in (if not already logged in)')
  console.log('  4. Click "Test Firebase Storage Upload" button')
  console.log('  5. Check the browser console (F12) for detailed logs')
  console.log('\n⚠️  Important: Make sure Firebase Storage rules include the test path!')
  console.log('   Go to Firebase Console → Storage → Rules')
  console.log('   Add: match /test/{userId}/{allPaths=**} { ... }')
} else {
  console.log('❌ Missing or empty environment variables:')
  missing.forEach((varName) => {
    console.log(`  - ${varName}`)
  })
  console.log('\n📝 To fix:')
  console.log('  1. Open .env.local file')
  console.log('  2. Add the missing variables')
  console.log('  3. Restart your dev server: npm run dev')
}

console.log('\n')

