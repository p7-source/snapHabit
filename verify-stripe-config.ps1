# Quick script to verify Stripe configuration
Write-Host "=== Stripe Configuration Check ===" -ForegroundColor Cyan
Write-Host ""

# Check environment variables
Write-Host "1. Checking Environment Variables..." -ForegroundColor Yellow

$publishableKey = $env:NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
$secretKey = $env:STRIPE_SECRET_KEY
$webhookSecret = $env:STRIPE_WEBHOOK_SECRET

if ($publishableKey) {
    Write-Host "   ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set" -ForegroundColor Green
    Write-Host "      Key: $($publishableKey.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Write-Host "   ❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is NOT set" -ForegroundColor Red
}

if ($secretKey) {
    Write-Host "   ✅ STRIPE_SECRET_KEY is set" -ForegroundColor Green
    Write-Host "      Key: $($secretKey.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Write-Host "   ❌ STRIPE_SECRET_KEY is NOT set" -ForegroundColor Red
}

if ($webhookSecret) {
    Write-Host "   ✅ STRIPE_WEBHOOK_SECRET is set" -ForegroundColor Green
    Write-Host "      Secret: $($webhookSecret.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  STRIPE_WEBHOOK_SECRET is NOT set (optional for local dev with Stripe CLI)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Checking Code Configuration..." -ForegroundColor Yellow

# Check pricing page
if (Test-Path "app\pricing\page.tsx") {
    $pricingContent = Get-Content "app\pricing\page.tsx" -Raw
    if ($pricingContent -like "*PRICING_TABLE_ID*") {
        Write-Host "   ✅ Pricing table ID is configured" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Pricing table ID might be missing" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Pricing page not found" -ForegroundColor Red
}

# Check checkout-success route
if (Test-Path "app\api\checkout-success\route.ts") {
    Write-Host "   ✅ Checkout success route exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Checkout success route not found" -ForegroundColor Red
}

# Check webhook route
if (Test-Path "app\api\webhooks\stripe\route.ts") {
    Write-Host "   ✅ Webhook route exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Webhook route not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Stripe Dashboard Checklist:" -ForegroundColor Yellow
Write-Host "   [ ] Pricing Table Success URL includes ?session_id={CHECKOUT_SESSION_ID}" -ForegroundColor White
Write-Host "   [ ] Webhook endpoint configured (for production)" -ForegroundColor White
Write-Host "   [ ] Webhook events selected (checkout.session.completed, etc.)" -ForegroundColor White
Write-Host "   [ ] Test mode enabled (for development)" -ForegroundColor White

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Check Stripe Dashboard: https://dashboard.stripe.com/test" -ForegroundColor White
Write-Host "2. Verify Pricing Table Success URL" -ForegroundColor White
Write-Host "3. Make a test payment to verify flow" -ForegroundColor White
Write-Host ""
Write-Host "See STRIPE_CONFIGURATION_CHECKLIST.md for detailed instructions" -ForegroundColor Gray


