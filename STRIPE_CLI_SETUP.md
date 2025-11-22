# Stripe CLI Setup for Windows

## Option 1: Install via Scoop (Recommended)

If you have Scoop package manager:

```powershell
scoop install stripe
```

## Option 2: Install via Chocolatey

If you have Chocolatey:

```powershell
choco install stripe
```

## Option 3: Download Executable

1. Go to: https://github.com/stripe/stripe-cli/releases/latest
2. Download: `stripe_X.X.X_windows_x86_64.zip` (latest version)
3. Extract the ZIP file
4. Copy `stripe.exe` to a folder in your PATH (e.g., `C:\Windows\System32` or create a `C:\stripe-cli` folder and add it to PATH)
5. Or run it directly from the extracted folder

## Option 4: Install via npm (Alternative)

```bash
npm install -g stripe-cli
```

## After Installation

1. **Login to Stripe:**
   ```bash
   stripe login
   ```
   This will open your browser to authenticate.

2. **Forward webhooks to localhost:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Copy the webhook secret:**
   The CLI will output:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```
   Copy that `whsec_...` value and add it to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Quick Test

After installation, verify it works:
```bash
stripe --version
```

You should see the version number.

## Troubleshooting

- **Command not found**: Make sure Stripe CLI is in your PATH, or use the full path to the executable
- **Permission denied**: Run PowerShell as Administrator
- **Login fails**: Make sure you're logged into Stripe Dashboard in your browser

