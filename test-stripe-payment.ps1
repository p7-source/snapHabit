# Test Stripe Payment Configuration
Write-Host "=== Testing Stripe Payment Configuration ===" -ForegroundColor Cyan
Write-Host ""

# Check environment variables
Write-Host "1. Environment Variables:" -ForegroundColor Yellow
$pubKey = $env:NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
$secretKey = $env:STRIPE_SECRET_KEY

if ($pubKey) {
    Write-Host "   ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set" -ForegroundColor Green
    Write-Host "      Key: $($pubKey.Substring(0, [Math]::Min(20, $pubKey.Length)))..." -ForegroundColor Gray
    if ($pubKey -notlike "pk_test_*" -and $pubKey -notlike "pk_live_*") {
        Write-Host "      ⚠️  Key format looks incorrect (should start with pk_test_ or pk_live_)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is NOT set" -ForegroundColor Red
    Write-Host "      Add to .env.local: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..." -ForegroundColor Yellow
}

if ($secretKey) {
    Write-Host "   ✅ STRIPE_SECRET_KEY is set" -ForegroundColor Green
    Write-Host "      Key: $($secretKey.Substring(0, [Math]::Min(20, $secretKey.Length)))..." -ForegroundColor Gray
} else {
    Write-Host "   ❌ STRIPE_SECRET_KEY is NOT set" -ForegroundColor Red
    Write-Host "      Add to .env.local: STRIPE_SECRET_KEY=sk_test_..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Code Configuration:" -ForegroundColor Yellow

# Check pricing page
if (Test-Path "app\pricing\page.tsx") {
    $content = Get-Content "app\pricing\page.tsx" -Raw
    if ($content -like "*PRICING_TABLE_ID*") {
        Write-Host "   ✅ Pricing table ID configured" -ForegroundColor Green
    }
    if ($content -like "*stripe-pricing-table*") {
        Write-Host "   ✅ Stripe pricing table component found" -ForegroundColor Green
    }
    if ($content -like "*pricing-table.js*") {
        Write-Host "   ✅ Stripe script included" -ForegroundColor Green
    }
}

# Check checkout-success route
if (Test-Path "app\api\checkout-success\route.ts") {
    Write-Host "   ✅ Checkout success route exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Checkout success route missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Stripe Dashboard Checklist:" -ForegroundColor Yellow
Write-Host "   [ ] Pricing Table Success URL set to:" -ForegroundColor White
Write-Host "       http://localhost:3000/pricing?session_id={CHECKOUT_SESSION_ID}" -ForegroundColor Cyan
Write-Host "   [ ] Pricing Table is published (not draft)" -ForegroundColor White
Write-Host "   [ ] Products and prices are configured" -ForegroundColor White

Write-Host ""
Write-Host "4. Quick Test:" -ForegroundColor Yellow
Write-Host "   1. Visit: http://localhost:3000/pricing" -ForegroundColor White
Write-Host "   2. Check browser console (F12) for errors" -ForegroundColor White
Write-Host "   3. Do you see the Stripe pricing table?" -ForegroundColor White
Write-Host "   4. Try clicking a plan button" -ForegroundColor White

Write-Host ""
Write-Host "=== Most Common Issue ===" -ForegroundColor Cyan
Write-Host "Pricing Table Success URL not set in Stripe Dashboard!" -ForegroundColor Red
Write-Host "Fix: https://dashboard.stripe.com/test/pricing-tables" -ForegroundColor Yellow
Write-Host "     → Edit your table → Set Success URL" -ForegroundColor Yellow



