# Privacy Policy for OTP Smart Fill
Last Updated: February 17, 2026

## 1. Overview
OTP Smart Fill ("we", "our", or "the extension") is a Chrome Extension designed to streamline your workflow by automatically detecting and filling One-Time Password (OTP) codes from your Gmail.

## 2. Data Collection and Usage
We are committed to your privacy. This extension is designed with a "privacy-first" architecture.

### 2.1. Gmail API (Read-Only)
- **What we access**: The extension uses the Gmail API (https://www.googleapis.com/auth/gmail.readonly) to scan your Inbox, Promotions, Updates, and Spam folders.
- **What we look for**: It specifically scans for emails containing keywords like "OTP", "verification code", "login code", etc.
- **How it is used**: When a potential OTP is found, the extension extracts the code locally on your device.
- **Data Storage**:
    - OTP codes are stored locally in your browser's memory (chrome.storage.local) for a short period to allow for the "History" feature.
    - No data is ever sent to external servers. The extension operates entirely within your browser.

### 2.2. User Authentication
- We use Chrome Identity API (chrome.identity) to authenticate you with Google.
- The authentication token is used solely to make requests to the Gmail API on your behalf.

### 2.3. Website Interactions
- The extension runs a content script on websites you visit (`<all_urls>`).
- This script is inactive until an OTP is detected.
- When active, it searches the current page for input fields (e.g., "Enter Code") to auto-fill the OTP.
- It does not track your browsing history or collect data from websites.

## 3. Data Sharing
- We do not sell, trade, or otherwise transfer your personally identifiable information using this extension.
- All processing happens on your local device.

## 4. Your Consent
By using our extension, you consent to this privacy policy.

## 5. Contact
If you have questions regarding this privacy policy, you may contact the developer via the Chrome Web Store support page.
