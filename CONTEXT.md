# Project Context: OTP Smart Fill (Gmail API Version)

## Overview
OTP Smart Fill is a Chrome Extension (Manifest V3) designed to automatically detect One-Time Passwords (OTPs) sent to a user's Gmail account and securely autofill them into web forms. Unlike previous versions that relied on DOM scraping, this version utilizes the official Gmail API for robust, reliable, and privacy-focused OTP retrieval.

## Architecture & Core Components
- **`manifest.json`**: Defines permissions (`storage`, `tabs`, `identity`, `notifications`, `alarms`), host permissions for Google APIs, and OAuth2 client specifications.
- **`background.js` (Service Worker)**: Handles OAuth2 authentication via `chrome.identity`, schedules API polling to check the Gmail Inbox/Promotions/Updates for recent OTP emails, extracts OTP codes using a weighted scoring system based on regex and context, and broadcasts the codes to active tabs.
- **`content.js`**: Injected into all web pages (excluding Gmail itself). Listens for broadcasted OTPs, displays a smart dropdown UI, and uses heuristic algorithms to identify OTP input fields (both single inputs and multi-digit split inputs) to auto-fill the code.
- **`popup.html` & `popup.js`**: Extension popup UI that provides the users with an interface to authenticate, toggle monitoring on/off, perform a manual refresh, and view a history of their recent OTPs.

## Current State
The application is fully functional (Version 2.1.0) and reliably fetches emails every 1-5 seconds using standard polling combined with `chrome.alarms` for background resilience. OTP parsing is sophisticated enough to distinguish codes from regular text or years, and the input injection handles modern split-input OTP fields effectively.

## Security & Privacy
- Relies on read-only Gmail API scope (`https://www.googleapis.com/auth/gmail.readonly`).
- All OTP parsing and processing happens locally on the user's device. No external servers or analytics are used.
- Implements time-bound queries to fetch only very recent emails (last 1-10 minutes) to guarantee relevance and limit data exposure.
