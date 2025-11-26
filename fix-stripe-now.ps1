# Quick fix for Stripe CLI in current terminal
# Run this: . .\fix-stripe-now.ps1

# Add current directory to PATH
$env:Path += ";$PWD"

Write-Host "✅ Stripe CLI is now enabled!" -ForegroundColor Green
Write-Host ""
Write-Host "Test it:" -ForegroundColor Cyan
Write-Host "  stripe --version" -ForegroundColor White
Write-Host ""
Write-Host "Or use (always works):" -ForegroundColor Yellow
Write-Host "  .\stripe.exe --version" -ForegroundColor White


