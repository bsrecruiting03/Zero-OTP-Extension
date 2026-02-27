# ⚡ Quick Start - 2 Minutes

## Step 1: Google Cloud Setup (1 minute)

1. Go to https://console.cloud.google.com/
2. Create project → Enable Gmail API
3. Create OAuth client (Chrome Extension type)
4. **Copy Client ID**

## Step 2: Configure (30 seconds)

1. Open `manifest.json`
2. Replace `YOUR_CLIENT_ID` with your Client ID
3. Save

## Step 3: Install (30 seconds)

1. `chrome://extensions/` → Enable Dev Mode
2. Load unpacked → Select folder
3. **Copy Extension ID**
4. Add Extension ID to OAuth client in Google Cloud

## Step 4: Authorize (30 seconds)

1. Click extension icon
2. Click "Sign in with Google"
3. Authorize
4. Done! ✅

---

## Test It

1. Send yourself an OTP (any service)
2. Wait 5-10 seconds
3. Dropdown appears!
4. Click code → Auto-fills

---

## Troubleshooting

**Not working?**

Check console: `chrome://extensions/` → Service Worker

Look for:
```
[OTP API] Checking Gmail...
[OTP API] Found X potential OTP emails
[OTP API] ✓ OTP FOUND: 123456
```

If you see these → It's working!

If not:
- Check OAuth credentials
- Verify extension ID added
- Make sure monitoring is active (green dot)

---

**That's it! 2 minutes and you have working OTP detection.**

Uses Gmail API = Actually reliable! 🎉
