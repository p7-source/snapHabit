# Test Stripe CLI Installation
Write-Host "Testing Stripe CLI Installation..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if stripe.exe exists
Write-Host "1. Checking if stripe.exe exists..." -ForegroundColor Yellow
if (Test-Path ".\stripe.exe") {
    Write-Host "   ✅ stripe.exe found in current directory" -ForegroundColor Green
} else {
    Write-Host "   ❌ stripe.exe NOT found in current directory" -ForegroundColor Red
    exit 1
}

# Test 2: Try to run with .\
Write-Host ""
Write-Host "2. Testing .\stripe.exe --version..." -ForegroundColor Yellow
try {
    $version = .\stripe.exe --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Works with .\stripe.exe" -ForegroundColor Green
        Write-Host "   Version: $version" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

# Test 3: Check if stripe is in PATH
Write-Host ""
Write-Host "3. Checking if 'stripe' command is available..." -ForegroundColor Yellow
try {
    $stripeCmd = Get-Command stripe -ErrorAction Stop
    Write-Host "   ✅ 'stripe' command found at: $($stripeCmd.Source)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  'stripe' command not in PATH (use .\stripe.exe instead)" -ForegroundColor Yellow
    Write-Host "   To add to PATH, run: .\setup-stripe-path.ps1" -ForegroundColor Cyan
}

# Test 4: Try stripe command
Write-Host ""
Write-Host "4. Testing 'stripe --version' command..." -ForegroundColor Yellow
try {
    $version = stripe --version 2>&1
    if ($LASTEXITCODE -eq 0 -or $version -like "*stripe version*") {
        Write-Host "   ✅ 'stripe' command works!" -ForegroundColor Green
        Write-Host "   Version: $version" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  'stripe' command not working, but .\stripe.exe works" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  'stripe' command not available (use .\stripe.exe)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Use .\stripe.exe if 'stripe' command doesn't work" -ForegroundColor White
Write-Host "  - Run .\setup-stripe-path.ps1 to add to PATH permanently" -ForegroundColor White
Write-Host "  - Close and reopen terminal after adding to PATH" -ForegroundColor White
Write-Host "=" * 50 -ForegroundColor Cyan



