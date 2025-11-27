# Add Stripe CLI to PATH permanently
$stripePath = "C:\Users\prass\snaphabit"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($currentPath -notlike "*$stripePath*") {
    $newPath = $currentPath + ";" + $stripePath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✅ Added Stripe CLI to PATH: $stripePath" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Close and reopen your terminal for changes to take effect!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After reopening terminal, test with: stripe --version" -ForegroundColor Cyan
} else {
    Write-Host "✅ Stripe CLI is already in PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "Current PATH includes:" -ForegroundColor Cyan
$currentPath -split ';' | Where-Object { $_ -like "*stripe*" -or $_ -like "*snaphabit*" } | ForEach-Object { Write-Host "  $_" }



