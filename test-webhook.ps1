# Script to test Stripe webhook configuration
Write-Host "`n=== Testing Stripe Webhook Configuration ===" -ForegroundColor Cyan

# Check 1: Webhook route exists
Write-Host "`n1. Checking webhook route..." -ForegroundColor Yellow
if (Test-Path "app/api/webhooks/stripe/route.ts") {
    Write-Host "   ✅ Webhook route file exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Webhook route file NOT found" -ForegroundColor Red
    exit 1
}

# Check 2: Environment variables
Write-Host "`n2. Checking environment variables..." -ForegroundColor Yellow
$envPath = ".env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "   ❌ .env.local file not found!" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envPath -Raw
$hasWebhookSecret = $envContent -match 'STRIPE_WEBHOOK_SECRET'
$hasStripeSecret = $envContent -match 'STRIPE_SECRET_KEY'

if ($hasWebhookSecret) {
    Write-Host "   ✅ STRIPE_WEBHOOK_SECRET found" -ForegroundColor Green
    $webhookLine = ($envContent -split "`n" | Where-Object { $_ -match 'STRIPE_WEBHOOK_SECRET' })[0]
    if ($webhookLine -match 'whsec_') {
        Write-Host "      Format looks correct (starts with whsec_)" -ForegroundColor Gray
    } else {
        Write-Host "      ⚠️  Value might be incorrect (should start with whsec_)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ STRIPE_WEBHOOK_SECRET NOT found in .env.local" -ForegroundColor Red
    Write-Host "`n   To get webhook secret:" -ForegroundColor Yellow
    Write-Host "   1. Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe" -ForegroundColor White
    Write-Host "   2. Copy the 'webhook signing secret' (whsec_xxxxx)" -ForegroundColor White
    Write-Host "   3. Add to .env.local: STRIPE_WEBHOOK_SECRET=whsec_xxxxx" -ForegroundColor White
    Write-Host "   4. Restart dev server" -ForegroundColor White
}

if ($hasStripeSecret) {
    Write-Host "   ✅ STRIPE_SECRET_KEY found" -ForegroundColor Green
} else {
    Write-Host "   ❌ STRIPE_SECRET_KEY NOT found" -ForegroundColor Red
}

# Check 3: Dev server running
Write-Host "`n3. Checking if dev server is running..." -ForegroundColor Yellow
$port = 3000
$isRunning = (Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $port }).Count -gt 0
if ($isRunning) {
    Write-Host "   ✅ Dev server is running on port $port" -ForegroundColor Green
} else {
    Write-Host "   ❌ Dev server is NOT running on port $port" -ForegroundColor Red
    Write-Host "      Start it with: npm run dev" -ForegroundColor Yellow
}

# Check 4: Stripe CLI
Write-Host "`n4. Checking Stripe CLI..." -ForegroundColor Yellow
$stripeProcess = Get-Process -Name "stripe" -ErrorAction SilentlyContinue
if ($stripeProcess) {
    Write-Host "   ✅ Stripe CLI process is running" -ForegroundColor Green
    Write-Host "      Process ID: $($stripeProcess.Id)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Stripe CLI is NOT running" -ForegroundColor Red
    Write-Host "`n   To start Stripe CLI:" -ForegroundColor Yellow
    Write-Host "   Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe" -ForegroundColor White
    Write-Host "   (This forwards webhooks from Stripe to your local server)" -ForegroundColor Gray
}

# Check 5: Test webhook endpoint
Write-Host "`n5. Testing webhook endpoint..." -ForegroundColor Yellow
if ($isRunning) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/stripe" -Method POST -Body "{}" -ContentType "application/json" -ErrorAction Stop
        Write-Host "   ⚠️  Endpoint responded (expected to fail without signature)" -ForegroundColor Yellow
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) {
            Write-Host "   ✅ Endpoint is accessible (returned 400 as expected without signature)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Endpoint returned status: $statusCode" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ⚠️  Cannot test - dev server not running" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
$allGood = $hasWebhookSecret -and $hasStripeSecret -and $isRunning -and $stripeProcess

if ($allGood) {
    Write-Host "✅ Webhook configuration looks good!" -ForegroundColor Green
    Write-Host "`nTo test webhooks:" -ForegroundColor Yellow
    Write-Host "1. Make a test payment on your pricing page" -ForegroundColor White
    Write-Host "2. Check terminal where 'npm run dev' is running for webhook logs" -ForegroundColor White
    Write-Host "3. Look for: '📦 Received checkout.session.completed event'" -ForegroundColor White
    Write-Host "4. Check Supabase subscriptions table for new record" -ForegroundColor White
} else {
    Write-Host "❌ Webhook configuration needs fixing" -ForegroundColor Red
    Write-Host "`nMissing:" -ForegroundColor Yellow
    if (-not $hasWebhookSecret) { Write-Host "  - STRIPE_WEBHOOK_SECRET in .env.local" -ForegroundColor Red }
    if (-not $hasStripeSecret) { Write-Host "  - STRIPE_SECRET_KEY in .env.local" -ForegroundColor Red }
    if (-not $isRunning) { Write-Host "  - Dev server running" -ForegroundColor Red }
    if (-not $stripeProcess) { Write-Host "  - Stripe CLI running" -ForegroundColor Red }
}

Write-Host "`n=== Webhook Event Types Handled ===" -ForegroundColor Cyan
Write-Host "  ✅ checkout.session.completed" -ForegroundColor Green
Write-Host "  ✅ customer.subscription.updated" -ForegroundColor Green
Write-Host "  ✅ customer.subscription.deleted" -ForegroundColor Green


