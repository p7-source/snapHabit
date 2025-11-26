# PowerShell script to start Stripe CLI with proper path
# Run this script to start Stripe webhook forwarding

Write-Host "`n=== Starting Stripe CLI ===" -ForegroundColor Cyan

# Check if Next.js dev server is running
$port3000 = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
if (-not $port3000) {
    Write-Host "`n⚠️ Warning: Next.js dev server doesn't appear to be running on port 3000" -ForegroundColor Yellow
    Write-Host "   Please start it first with: npm run dev" -ForegroundColor White
    Write-Host "`nPress any key to continue anyway, or Ctrl+C to cancel..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Find Stripe CLI
$stripeExe = Join-Path $PSScriptRoot "stripe.exe"
if (-not (Test-Path $stripeExe)) {
    # Try to find it in PATH
    $stripeExe = (Get-Command stripe -ErrorAction SilentlyContinue).Source
    if (-not $stripeExe) {
        Write-Host "`n❌ Stripe CLI not found!" -ForegroundColor Red
        Write-Host "   Please install Stripe CLI or ensure stripe.exe is in the project root" -ForegroundColor Yellow
        Write-Host "   Download from: https://stripe.com/docs/stripe-cli" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host "`n✅ Found Stripe CLI at: $stripeExe" -ForegroundColor Green
Write-Host "`nStarting webhook forwarding..." -ForegroundColor Cyan
Write-Host "   Forwarding to: http://localhost:3000/api/webhooks/stripe" -ForegroundColor White
Write-Host "`n⚠️ Keep this window open!" -ForegroundColor Yellow
Write-Host "   You'll see webhook events here when payments are made." -ForegroundColor White
Write-Host "`n" -ForegroundColor White

# Start Stripe CLI
& $stripeExe listen --forward-to localhost:3000/api/webhooks/stripe


