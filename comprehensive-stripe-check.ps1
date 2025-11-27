# Comprehensive Stripe Error Check
Write-Host "=== COMPREHENSIVE STRIPE DIAGNOSTIC ===" -ForegroundColor Cyan
Write-Host ""

# Check .env.local
Write-Host "1. Environment File Check:" -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local exists" -ForegroundColor Green
    $envContent = Get-Content ".env.local"
    
    $hasPubKey = $false
    $hasSecretKey = $false
    
    foreach ($line in $envContent) {
        if ($line -match "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=") {
            $hasPubKey = $true
            $key = $line -replace "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=", ""
            if ($key -like "pk_test_*" -or $key -like "pk_live_*") {
                Write-Host "   ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set and valid" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format might be wrong" -ForegroundColor Yellow
            }
        }
        if ($line -match "^STRIPE_SECRET_KEY=") {
            $hasSecretKey = $true
            $key = $line -replace "STRIPE_SECRET_KEY=", ""
            if ($key -like "sk_test_*" -or $key -like "sk_live_*") {
                Write-Host "   ✅ STRIPE_SECRET_KEY is set and valid" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  STRIPE_SECRET_KEY format might be wrong" -ForegroundColor Yellow
            }
        }
    }
    
    if (-not $hasPubKey) {
        Write-Host "   ❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing" -ForegroundColor Red
    }
    if (-not $hasSecretKey) {
        Write-Host "   ❌ STRIPE_SECRET_KEY is missing" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .env.local file NOT found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Code Configuration:" -ForegroundColor Yellow
if (Test-Path "app\pricing\page.tsx") {
    $content = Get-Content "app\pricing\page.tsx" -Raw
    if ($content -like "*prctbl_1SW7Nt3toYhZwQmwUk6q7lVs*") {
        Write-Host "   ✅ Pricing table ID found" -ForegroundColor Green
    }
    if ($content -like "*stripe-pricing-table*") {
        Write-Host "   ✅ Stripe component found" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "3. CRITICAL CHECKS:" -ForegroundColor Yellow
Write-Host "   [ ] Did you RESTART the server after adding keys?" -ForegroundColor White
Write-Host "      → Stop (Ctrl+C) then: npm run dev" -ForegroundColor Cyan
Write-Host "   [ ] Is the server currently running?" -ForegroundColor White
Write-Host "   [ ] Check browser console (F12) for errors" -ForegroundColor White
Write-Host "   [ ] Check Stripe Dashboard pricing table is published" -ForegroundColor White

Write-Host ""
Write-Host "4. What to check in browser:" -ForegroundColor Yellow
Write-Host "   a) Open http://localhost:3000/pricing" -ForegroundColor White
Write-Host "   b) Press F12 to open DevTools" -ForegroundColor White
Write-Host "   c) Go to Console tab" -ForegroundColor White
Write-Host "   d) Look for:" -ForegroundColor White
Write-Host "      - 'Stripe Configuration:' log" -ForegroundColor Cyan
Write-Host "      - Any red error messages" -ForegroundColor Red
Write-Host "      - 'Stripe error detected:' messages" -ForegroundColor Red
Write-Host "   e) Go to Network tab" -ForegroundColor White
Write-Host "      - Look for failed requests to stripe.com" -ForegroundColor White

Write-Host ""
Write-Host "5. Stripe Dashboard Check:" -ForegroundColor Yellow
Write-Host "   Go to: https://dashboard.stripe.com/test/pricing-tables" -ForegroundColor Cyan
Write-Host "   - Find table: prctbl_1SW7Nt3toYhZwQmwUk6q7lVs" -ForegroundColor White
Write-Host "   - Click to edit" -ForegroundColor White
Write-Host "   - Verify Status is 'Published' (not Draft)" -ForegroundColor White
Write-Host "   - Check Success URL is set correctly" -ForegroundColor White

Write-Host ""
Write-Host "=== PLEASE SHARE ===" -ForegroundColor Cyan
Write-Host "1. What error message do you see? (exact text)" -ForegroundColor White
Write-Host "2. Browser console output (F12 → Console)" -ForegroundColor White
Write-Host "3. Does the pricing table show at all?" -ForegroundColor White
Write-Host "4. When does the error appear? (on page load? when clicking button?)" -ForegroundColor White



