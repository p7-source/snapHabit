# Script to verify .env.local Stripe configuration
Write-Host "`n=== Verifying .env.local Stripe Configuration ===" -ForegroundColor Cyan

$envPath = ".env.local"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "`nCreating template..." -ForegroundColor Yellow
    
    $template = @"
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (REQUIRED - Replace with real Price IDs from Stripe Dashboard)
# Get these from: https://dashboard.stripe.com/test/products
# Click on a product → Find 'Pricing' section → Copy Price ID (starts with 'price_')
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_xxxxx

# Fallback (optional - used if monthly/yearly not set)
NEXT_PUBLIC_STRIPE_PRICE_ID=price_xxxxx
"@
    
    $template | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "✅ Created .env.local template" -ForegroundColor Green
    Write-Host "`n⚠️  IMPORTANT: Replace 'price_xxxxx' with real Price IDs from Stripe!" -ForegroundColor Yellow
    exit
}

Write-Host "`n✅ .env.local file found" -ForegroundColor Green

# Read and check Stripe variables
$content = Get-Content $envPath
$hasMonthly = $false
$hasYearly = $false
$monthlyValue = ""
$yearlyValue = ""

foreach ($line in $content) {
    $trimmed = $line.Trim()
    if ($trimmed -match '^NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=(.+)$') {
        $hasMonthly = $true
        $monthlyValue = $matches[1]
    }
    if ($trimmed -match '^NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=(.+)$') {
        $hasYearly = $true
        $yearlyValue = $matches[1]
    }
}

Write-Host "`n=== Stripe Price ID Configuration ===" -ForegroundColor Cyan

if ($hasMonthly) {
    if ($monthlyValue -match 'price_xxxxx|price_xxx|xxxxx') {
        Write-Host "  NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY = $monthlyValue" -ForegroundColor Red -NoNewline
        Write-Host " ⚠️  PLACEHOLDER - Replace with real Price ID!" -ForegroundColor Yellow
    } elseif ($monthlyValue -match '^price_') {
        Write-Host "  NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY = $monthlyValue" -ForegroundColor Green -NoNewline
        Write-Host " ✅ Valid format" -ForegroundColor Green
    } else {
        Write-Host "  NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY = $monthlyValue" -ForegroundColor Yellow -NoNewline
        Write-Host " ⚠️  Doesn't start with 'price_'" -ForegroundColor Yellow
    }
} else {
    Write-Host "  NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY" -ForegroundColor Red -NoNewline
    Write-Host " ❌ NOT FOUND" -ForegroundColor Red
}

if ($hasYearly) {
    if ($yearlyValue -match 'price_xxxxx|price_xxx|xxxxx') {
        Write-Host "  NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY = $yearlyValue" -ForegroundColor Red -NoNewline
        Write-Host " ⚠️  PLACEHOLDER - Replace with real Price ID!" -ForegroundColor Yellow
    } elseif ($yearlyValue -match '^price_') {
        Write-Host "  NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY = $yearlyValue" -ForegroundColor Green -NoNewline
        Write-Host " ✅ Valid format" -ForegroundColor Green
    } else {
        Write-Host "  NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY = $yearlyValue" -ForegroundColor Yellow -NoNewline
        Write-Host " ⚠️  Doesn't start with 'price_'" -ForegroundColor Yellow
    }
} else {
    Write-Host "  NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY" -ForegroundColor Red -NoNewline
    Write-Host " ❌ NOT FOUND" -ForegroundColor Red
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
if ($hasMonthly -and $hasYearly -and $monthlyValue -notmatch 'price_xxxxx|price_xxx|xxxxx' -and $yearlyValue -notmatch 'price_xxxxx|price_xxx|xxxxx') {
    Write-Host "✅ Configuration looks good!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Restart your dev server (Ctrl+C, then npm run dev)" -ForegroundColor White
    Write-Host "2. Visit http://localhost:3000/pricing" -ForegroundColor White
    Write-Host "3. Buttons should be enabled" -ForegroundColor White
} else {
    Write-Host "❌ Configuration needs fixing!" -ForegroundColor Red
    Write-Host "`nTo fix:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://dashboard.stripe.com/test/products" -ForegroundColor White
    Write-Host "2. Click on a product → Find 'Pricing' section" -ForegroundColor White
    Write-Host "3. Copy the Price ID (starts with 'price_')" -ForegroundColor White
    Write-Host "4. Update .env.local with real Price IDs" -ForegroundColor White
    Write-Host "5. Restart dev server" -ForegroundColor White
}


