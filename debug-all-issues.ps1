# Comprehensive Debugging Script
Write-Host "=== COMPREHENSIVE DEBUGGING ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check environment file
Write-Host "1. Checking .env.local file..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local exists" -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    
    $requiredVars = @(
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        "STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    
    Write-Host "   Checking required variables:" -ForegroundColor White
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=") {
            Write-Host "      ✅ $var is set" -ForegroundColor Green
        } else {
            Write-Host "      ❌ $var is MISSING" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ .env.local NOT FOUND!" -ForegroundColor Red
}

Write-Host ""

# 2. Check critical files
Write-Host "2. Checking critical files..." -ForegroundColor Yellow
$criticalFiles = @(
    "app/page.tsx",
    "app/layout.tsx",
    "lib/utils.ts",
    "components/ui/button.tsx",
    "middleware.ts"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file MISSING!" -ForegroundColor Red
    }
}

Write-Host ""

# 3. Check package.json dependencies
Write-Host "3. Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "   ✅ package.json exists" -ForegroundColor Green
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    $requiredDeps = @(
        "@clerk/nextjs",
        "next",
        "react",
        "react-dom",
        "stripe",
        "@supabase/supabase-js"
    )
    
    Write-Host "   Checking dependencies:" -ForegroundColor White
    foreach ($dep in $requiredDeps) {
        if ($packageJson.dependencies.PSObject.Properties.Name -contains $dep) {
            Write-Host "      ✅ $dep installed" -ForegroundColor Green
        } else {
            Write-Host "      ❌ $dep MISSING" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ package.json NOT FOUND!" -ForegroundColor Red
}

Write-Host ""

# 4. Check node_modules
Write-Host "4. Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules exists" -ForegroundColor Green
    $nodeModulesSize = (Get-ChildItem "node_modules" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "      Size: $([math]::Round($nodeModulesSize, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "   ❌ node_modules NOT FOUND! Run: npm install" -ForegroundColor Red
}

Write-Host ""

# 5. Check .next directory
Write-Host "5. Checking build cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Write-Host "   ⚠️  .next directory exists (might need clearing)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ No build cache (will be created on first run)" -ForegroundColor Green
}

Write-Host ""

# 6. Check for common issues
Write-Host "6. Common issues checklist:" -ForegroundColor Yellow
Write-Host "   [ ] Server is running (npm run dev)" -ForegroundColor White
Write-Host "   [ ] Server was restarted after adding env vars" -ForegroundColor White
Write-Host "   [ ] All dependencies installed (npm install)" -ForegroundColor White
Write-Host "   [ ] No port conflicts (port 3000 available)" -ForegroundColor White

Write-Host ""
Write-Host "=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. Check server terminal for actual error messages" -ForegroundColor White
Write-Host "2. If missing dependencies, run: npm install" -ForegroundColor White
Write-Host "3. If .env.local missing vars, add them and restart server" -ForegroundColor White
Write-Host "4. Clear cache: Remove-Item -Recurse -Force .next" -ForegroundColor White
Write-Host "5. Restart server: npm run dev" -ForegroundColor White



