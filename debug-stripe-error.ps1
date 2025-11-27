# Comprehensive Stripe Error Debugging Script
Write-Host "=== STRIPE ERROR DIAGNOSTIC ===" -ForegroundColor Cyan
Write-Host ""

# Check environment variables
Write-Host "1. Environment Variables Check:" -ForegroundColor Yellow
$pubKey = $env:NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
$secretKey = $env:STRIPE_SECRET_KEY

if ($pubKey) {
    Write-Host "   ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set" -ForegroundColor Green
    if ($pubKey -like "pk_test_*") {
        Write-Host "      ✅ Key format correct (test mode)" -ForegroundColor Green
    } elseif ($pubKey -like "pk_live_*") {
        Write-Host "      ✅ Key format correct (live mode)" -ForegroundColor Green
    } else {
        Write-Host "      ❌ Key format incorrect (should start with pk_test_ or pk_live_)" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is NOT set" -ForegroundColor Red
    Write-Host "      Add to .env.local and restart server" -ForegroundColor Yellow
}

if ($secretKey) {
    Write-Host "   ✅ STRIPE_SECRET_KEY is set" -ForegroundColor Green
    if ($secretKey -like "sk_test_*") {
        Write-Host "      ✅ Key format correct (test mode)" -ForegroundColor Green
    } elseif ($secretKey -like "sk_live_*") {
        Write-Host "      ✅ Key format correct (live mode)" -ForegroundColor Green
    } else {
        Write-Host "      ❌ Key format incorrect (should start with sk_test_ or sk_live_)" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ STRIPE_SECRET_KEY is NOT set" -ForegroundColor Red
    Write-Host "      Add to .env.local and restart server" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Code Configuration:" -ForegroundColor Yellow

# Check pricing page
if (Test-Path "app\pricing\page.tsx") {
    $content = Get-Content "app\pricing\page.tsx" -Raw
    if ($content -like "*prctbl_1SW7Nt3toYhZwQmwUk6q7lVs*") {
        Write-Host "   ✅ Pricing table ID found in code" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Pricing table ID might be missing" -ForegroundColor Yellow
    }
    if ($content -like "*stripe-pricing-table*") {
        Write-Host "   ✅ Stripe pricing table component found" -ForegroundColor Green
    }
    if ($content -like "*pricing-table.js*") {
        Write-Host "   ✅ Stripe script included" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Pricing page not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Common Issues Checklist:" -ForegroundColor Yellow
Write-Host "   [ ] API keys are correct and match test/live mode" -ForegroundColor White
Write-Host "   [ ] Server was restarted after adding keys" -ForegroundColor White
Write-Host "   [ ] Pricing table is published in Stripe Dashboard" -ForegroundColor White
Write-Host "   [ ] Success URL is set in Stripe Dashboard" -ForegroundColor White
Write-Host "   [ ] User is logged in (Clerk authentication)" -ForegroundColor White
Write-Host "   [ ] Browser console shows no errors" -ForegroundColor White
Write-Host "   [ ] Internet connection is working" -ForegroundColor White

Write-Host ""
Write-Host "4. Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open browser console (F12)" -ForegroundColor White
Write-Host "   2. Look for 'Stripe Configuration' log" -ForegroundColor White
Write-Host "   3. Look for any red error messages" -ForegroundColor White
Write-Host "   4. Check Network tab for failed requests" -ForegroundColor White
Write-Host "   5. Share the console output for detailed help" -ForegroundColor White

Write-Host ""
Write-Host "5. Stripe Dashboard Check:" -ForegroundColor Yellow
Write-Host "   Go to: https://dashboard.stripe.com/test/pricing-tables" -ForegroundColor Cyan
Write-Host "   - Find table: prctbl_1SW7Nt3toYhZwQmwUk6q7lVs" -ForegroundColor White
Write-Host "   - Verify it's Published (not Draft)" -ForegroundColor White
Write-Host "   - Check Success URL is set" -ForegroundColor White

Write-Host ""
Write-Host "=== Most Likely Issue ===" -ForegroundColor Cyan
Write-Host "Check browser console (F12) for the actual error message!" -ForegroundColor Yellow
Write-Host "The 'Something went wrong' message is generic." -ForegroundColor Yellow
Write-Host "The real error will be in the browser console." -ForegroundColor Yellow



