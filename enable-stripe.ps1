# Enable Stripe CLI in current PowerShell session
# Run this script: . .\enable-stripe.ps1

# Add current directory to PATH for this session
$env:Path += ";$PWD"

Write-Host "✅ Stripe CLI enabled for this session!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now use:" -ForegroundColor Cyan
Write-Host "  stripe --version" -ForegroundColor White
Write-Host "  stripe login" -ForegroundColor White
Write-Host "  stripe listen --forward-to localhost:3000/api/webhooks/stripe" -ForegroundColor White
Write-Host ""
Write-Host "Or use: .\stripe.exe (always works)" -ForegroundColor Yellow


