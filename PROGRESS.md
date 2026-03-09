# Project Progress

## Completed Enhancements (v2.2.0)
- [x] **Zero-Freeze DOM Search**: Rewrote input finding logic to be bottom-up, preventing layout thrashing and tab freezes on heavy SPAs.
- [x] **ATS Safety Layer**: Implemented strict heuristics to avoid accidentally filling irrelevant contact info fields on job portals (Greenhouse/Lever).
- [x] **SPA Polling Retry**: Added a 3-second polling loop to wait for React/Vue components to render before attempting autofill.
- [x] **iFrame Support**: Enabled `all_frames` permission to support OTPs inside Stripe/banking portals.
- [x] **Enhanced Scoring**: Penalized common false positives like copyright years (2024/2025) and sequential numbers in the parsing engine.
- [x] **UI Bugfixes**: Fixed a critical scoping bug in the popup that caused incorrect OTPs to be copied to the clipboard.

## Completed Enhancements (v2.1.0)
- [x] **Gmail API Integration**: Shifted from scraping to the official API for 100% reliability.
- [x] **OAuth2 Authentication**: Secure token retrieval via `chrome.identity`.
- [x] **Smart Parsing**: Introduced initial weighted scoring for OTP detection.

## Next Steps
- [ ] **Cross-Browser Packaging**: Prepare builds for Firefox and Edge.
- [ ] **Localized Parsing**: Expand keyword detection for non-English verification emails.
- [ ] **Auto-Submission Refinement**: Fine-tune the logic that attempts to click "Submit" after filling the code.
