# Verify Stripe keys are set correctly
Write-Host "=== Verifying Stripe Configuration ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file exists" -ForegroundColor Green
    
    # Read the file
    $envContent = Get-Content ".env.local" -Raw
    
    # Check for publishable key
    if ($envContent -match "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") {
        Write-Host "✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set" -ForegroundColor Green
        $pubKey = ($envContent | Select-String -Pattern "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(.+)").Matches.Groups[1].Value.Trim()
        if ($pubKey -like "pk_test_*" -or $pubKey -like "pk_live_*") {
            Write-Host "   ✅ Key format looks correct" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Key format might be incorrect" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is NOT set" -ForegroundColor Red
    }
    
    # Check for secret key
    if ($envContent -match "STRIPE_SECRET_KEY") {
        Write-Host "✅ STRIPE_SECRET_KEY is set" -ForegroundColor Green
        $secretKey = ($envContent | Select-String -Pattern "STRIPE_SECRET_KEY=(.+)").Matches.Groups[1].Value.Trim()
        if ($secretKey -like "sk_test_*" -or $secretKey -like "sk_live_*") {
            Write-Host "   ✅ Key format looks correct" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Key format might be incorrect (should start with sk_test_ or sk_live_)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ STRIPE_SECRET_KEY is NOT set" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "⚠️  REMEMBER: Restart your Next.js server for changes to take effect!" -ForegroundColor Yellow
    Write-Host "   Stop server (Ctrl+C) then run: npm run dev" -ForegroundColor White
    
} else {
    Write-Host "❌ .env.local file NOT found!" -ForegroundColor Red
    Write-Host "   Create it in the project root with your Stripe keys" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Restart your server (if not already done)" -ForegroundColor White
Write-Host "2. Visit: http://localhost:3000/pricing" -ForegroundColor White
Write-Host "3. Open browser console (F12)" -ForegroundColor White
Write-Host "4. Look for: Stripe Configuration log" -ForegroundColor White
Write-Host "5. Try clicking a payment button" -ForegroundColor White

