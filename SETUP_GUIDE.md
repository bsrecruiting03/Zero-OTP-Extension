# 🔧 OAuth Setup - Step by Step

## The Error You're Seeing

`Bad client id: {0}` means the manifest.json still has the placeholder `YOUR_CLIENT_ID`.

You need to replace it with your ACTUAL Client ID from Google Cloud.

---

## 📝 Complete Setup Process

### Part 1: Create Google Cloud Project (3 minutes)

#### Step 1.1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

#### Step 1.2: Create New Project
1. Click the project dropdown (top left, next to "Google Cloud")
2. Click "New Project"
3. Project name: `OTP Extension`
4. Click "Create"
5. Wait for it to create (30 seconds)
6. **Select the project** from the dropdown

#### Step 1.3: Enable Gmail API
1. In the search bar at top, type: `Gmail API`
2. Click on "Gmail API"
3. Click the blue "ENABLE" button
4. Wait for it to enable

---

### Part 2: Configure OAuth Consent Screen (2 minutes)

#### Step 2.1: Go to OAuth Consent
1. Click hamburger menu (☰) → "APIs & Services" → "OAuth consent screen"
2. Select **"External"** user type
3. Click "Create"

#### Step 2.2: Fill Out Consent Screen
**App information:**
- App name: `OTP Smart Fill`
- User support email: Your email
- Developer contact: Your email

**App domain (all optional - leave blank)**

Click "Save and Continue"

#### Step 2.3: Scopes
1. Click "Add or Remove Scopes"
2. In the filter box, type: `gmail.readonly`
3. Check the box for `https://www.googleapis.com/auth/gmail.readonly`
4. Click "Update"
5. Click "Save and Continue"

#### Step 2.4: Test Users
1. Click "Add Users"
2. Enter YOUR email address (the one you'll use)
3. Click "Add"
4. Click "Save and Continue"

#### Step 2.5: Summary
1. Review everything
2. Click "Back to Dashboard"

---

### Part 3: Create OAuth Client ID (2 minutes)

#### Step 3.1: Go to Credentials
1. Click hamburger menu (☰) → "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"

#### Step 3.2: Configure OAuth Client
1. Application type: **Chrome extension**
2. Name: `OTP Smart Fill Extension`
3. Item ID: Leave blank for now (we'll add it later)
4. Click "Create"

#### Step 3.3: Copy Client ID
You'll see a popup with your credentials.

**IMPORTANT:** Copy the **Client ID**

It looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

**Save this somewhere!**

---

### Part 4: Configure Extension (1 minute)

#### Step 4.1: Edit manifest.json
1. Open the `otp-api-final` folder
2. Right-click `manifest.json` → Open with Notepad (or any text editor)
3. Find this line:
   ```json
   "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
   ```
4. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your ACTUAL Client ID
5. Example:
   ```json
   "client_id": "123456789-abcdefghijklmnop.apps.googleusercontent.com",
   ```
6. **Save the file**

---

### Part 5: Load Extension (1 minute)

#### Step 5.1: Load in Chrome
1. Open Chrome
2. Go to: `chrome://extensions/`
3. Enable "Developer mode" (toggle top-right)
4. Click "Load unpacked"
5. Select the `otp-api-final` folder
6. Extension should load successfully now!

#### Step 5.2: Copy Extension ID
Look at your extension in the list.

You'll see something like:
```
ID: abcdefghijklmnopqrstuvwxyz123456
```

**Copy this entire ID**

---

### Part 6: Add Extension ID to OAuth (1 minute)

#### Step 6.1: Go Back to Google Cloud
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth client (the one you just created)
3. Click the pencil icon (Edit)

#### Step 6.2: Add Extension ID
1. In "Item ID" field, paste your Extension ID
2. Click "Save"

---

### Part 7: Test It! (1 minute)

#### Step 7.1: Authorize
1. Click the extension icon in Chrome
2. Click "Sign in with Google"
3. You should see Google's authorization screen
4. Click "Allow"

#### Step 7.2: Verify
Extension should now show:
- Green dot (Monitoring Active)
- Status: "Ready"

#### Step 7.3: Test with Real OTP
1. Send yourself an OTP (any website)
2. Wait 5-10 seconds
3. Dropdown should appear!

---

## 🐛 Common Issues

### "Bad client id"
**Cause:** Client ID not properly set in manifest.json

**Fix:**
1. Open manifest.json
2. Make sure Client ID is EXACTLY as copied from Google Cloud
3. No extra spaces, quotes, or characters
4. Should end with `.apps.googleusercontent.com`
5. Save and reload extension

### "Unauthorized client"
**Cause:** Extension ID not added to OAuth client

**Fix:**
1. Go to Google Cloud → Credentials
2. Edit OAuth client
3. Add Extension ID to "Item ID"
4. Save
5. Try authorizing again

### "Access blocked"
**Cause:** App not verified (this is okay for testing)

**Fix:**
1. On the warning screen, click "Advanced"
2. Click "Go to OTP Smart Fill (unsafe)" - this is safe, it's YOUR app
3. Continue authorization

### "This app hasn't been verified"
**This is NORMAL for development!**

1. Click "Advanced"
2. Click "Go to [app name] (unsafe)"
3. Proceed with authorization

For personal use, this is fine. For public release, you'd need to verify the app.

---

## 📋 Checklist

Use this to verify everything:

- [ ] Created Google Cloud project
- [ ] Enabled Gmail API
- [ ] Configured OAuth consent screen
- [ ] Added my email as test user
- [ ] Created OAuth client (Chrome extension type)
- [ ] Copied Client ID
- [ ] Pasted Client ID into manifest.json (replaced YOUR_CLIENT_ID)
- [ ] Saved manifest.json
- [ ] Loaded extension in Chrome
- [ ] Copied Extension ID
- [ ] Added Extension ID to OAuth client in Google Cloud
- [ ] Saved OAuth client
- [ ] Clicked "Sign in with Google" in extension
- [ ] Authorized the app
- [ ] Saw green dot (monitoring active)

---

## 🎯 Quick Reference

**Google Cloud Console:**
https://console.cloud.google.com/

**Where to find Client ID:**
Console → APIs & Services → Credentials → Your OAuth Client

**Where to add Extension ID:**
Same place → Click edit → "Item ID" field

**Where to get Extension ID:**
chrome://extensions/ → Under your extension name

---

## 💡 Pro Tips

1. **Keep Google Cloud tab open** while setting up
2. **Copy-paste carefully** - one wrong character breaks it
3. **Reload extension** after editing manifest.json
4. **Check console** if issues: chrome://extensions/ → Service Worker
5. **"Unsafe" warning is normal** for development apps

---

## ✅ Success Looks Like

After setup:
1. Extension icon shows in Chrome
2. Click icon → See "Monitoring Active" with green dot
3. Send test OTP → Dropdown appears
4. Click code → Auto-fills

That's it! 🎉

---

## 🆘 Still Having Issues?

**Check the background console:**
1. Go to chrome://extensions/
2. Find "OTP Smart Fill"
3. Click "Service worker"
4. Look for errors in console

**Common console errors:**

`OAuth2 request failed: bad client id`
→ Client ID is wrong in manifest.json

`Failed to fetch`
→ Extension ID not added to OAuth client

`401 Unauthorized`
→ Need to authorize again

---

**Once you complete these steps, the extension WILL work!**

The setup is one-time. After that, it just runs automatically.
