# Install Stripe CLI on Windows

The npm package didn't work. Here's how to install Stripe CLI properly:

## Method 1: Download Executable (Recommended)

1. **Go to Stripe CLI Releases:**
   - Visit: https://github.com/stripe/stripe-cli/releases/latest
   - Or search: "stripe cli windows download"

2. **Download:**
   - Look for: `stripe_X.X.X_windows_x86_64.zip`
   - Download the ZIP file

3. **Extract:**
   - Extract the ZIP file to a folder (e.g., `C:\stripe-cli\`)
   - You'll find `stripe.exe` inside

4. **Add to PATH (Optional but Recommended):**
   - Right-click "This PC" → Properties → Advanced System Settings
   - Click "Environment Variables"
   - Under "User variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\stripe-cli` (or wherever you extracted it)
   - Click OK on all dialogs

5. **Restart PowerShell/Terminal:**
   - Close and reopen your terminal
   - Run: `stripe --version` to verify

## Method 2: Use Scoop (If you have it)

```powershell
scoop install stripe
```

## Method 3: Use Chocolatey (If you have it)

```powershell
choco install stripe
```

## After Installation

1. **Login:**
   ```bash
   stripe login
   ```
   This opens your browser to authenticate with Stripe.

2. **Forward webhooks:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Copy the webhook secret:**
   The CLI will show:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```
   Add this to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Quick Test Without Webhooks

You can test the pricing table **without** webhooks for now:
- The checkout will work
- You can see subscriptions in Stripe Dashboard
- Webhooks just automate database updates (can be set up later)

