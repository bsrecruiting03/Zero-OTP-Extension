# Project Context: OTP Smart Fill (Gmail API Version)

## Overview
OTP Smart Fill is a Chrome Extension (Manifest V3) designed to automatically detect One-Time Passwords (OTPs) sent to a user's Gmail account and securely autofill them into web forms. Utilizing the official Gmail API, it provides a high-reliability, low-friction authentication experience.

## Architecture & Core Components
- **`manifest.json`**: Defines permissions, host permissions for Google APIs, and OAuth2 client specifications. Now includes `all_frames` support for iFrame penetration.
- **`background.js` (Service Worker)**: Manages OAuth2 life-cycle, polls Gmail API using precise time-bound queries, and parses emails using an advanced scoring system that filters out false positives like years or sequential numbers.
- **`content.js`**: Injected into web pages to listen for OTPs. Uses an efficient bottom-up search algorithm to identify inputs without blocking the main thread. Includes a poll-and-retry mechanism for SPAs and strict safety filters for ATS application portals.
- **`popup.html` & `popup.js`**: Provides the user dashboard for authentication, status monitoring, and OTP history management.

## Current State
The application is currently at **Version 2.2.0**. It is highly optimized for performance (no UI freezes) and safety (no accidental fills in contact forms). It reliably handles both single-field OTPs and modern split-input digit boxes, even inside payment iframes or slow-loading React components.

## Security & Privacy
- Relies on read-only Gmail API scope (`https://www.googleapis.com/auth/gmail.readonly`).
- All OTP parsing and processing happens locally on the user's device. No external servers or analytics are used.
- Implements time-bound queries to fetch only very recent emails (last 1-10 minutes) to guarantee relevance and limit data exposure.
