# Step-by-Step Fix Script
Write-Host "=== STEP-BY-STEP FIX ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Add missing Stripe publishable key
Write-Host "STEP 1: Adding missing Stripe publishable key..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -notmatch "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=") {
        Add-Content -Path ".env.local" -Value "`nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SW5wM3toYhZwQmwyYLVkXzSFu9UkZwZmXpkYzTCN07yBpluWdOiA4LT9euyzeTqEGK5F427geEvM0Hhb5u4wrZW00lB0rnmHR"
        Write-Host "   ✅ Added NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" -ForegroundColor Green
    } else {
        Write-Host "   ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY already exists" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  .env.local not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Clear cache
Write-Host "STEP 2: Clearing build cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "   ✅ Cache cleared" -ForegroundColor Green
} else {
    Write-Host "   ✅ No cache to clear" -ForegroundColor Green
}

Write-Host ""

# Step 3: Instructions
Write-Host "STEP 3: Next steps..." -ForegroundColor Yellow
Write-Host "   1. Stop your server (Ctrl+C)" -ForegroundColor White
Write-Host "   2. Run: npm run dev" -ForegroundColor Cyan
Write-Host "   3. Wait for server to start" -ForegroundColor White
Write-Host "   4. Visit: http://localhost:3000" -ForegroundColor White
Write-Host "   5. Check server terminal for any errors" -ForegroundColor White

Write-Host ""
Write-Host "=== IMPORTANT ===" -ForegroundColor Red
Write-Host "If you still see errors, check your server terminal!" -ForegroundColor Yellow
Write-Host "The actual error message will be there." -ForegroundColor Yellow


