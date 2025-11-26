# Add Stripe CLI to PATH
$stripePath = Join-Path $env:USERPROFILE "stripe-cli"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($currentPath -notlike "*$stripePath*") {
    $newPath = $currentPath + ";" + $stripePath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✅ Added Stripe CLI to PATH: $stripePath"
    Write-Host "⚠️  Please close and reopen your terminal for changes to take effect"
} else {
    Write-Host "✅ Stripe CLI is already in PATH"
}

Write-Host ""
Write-Host "To verify, close and reopen terminal, then run: stripe --version"


