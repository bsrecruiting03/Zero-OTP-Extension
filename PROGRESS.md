# Project Progress

## Completed Enhancements (v2.1.0)
- [x] **Transition from DOM Scraping to API**: Replaced brittle Gmail tab DOM scraping with the official Gmail API for 100% reliability.
- [x] **Authentication Flow**: Implemented `chrome.identity.getAuthToken` for smooth OAuth2 user consent.
- [x] **Background Polling**: Built a robust, self-rescheduling polling loop in `background.js` (supported by `chrome.alarms` to keep the service worker alive).
- [x] **Smart Parsing**: Introduced a scoring system in `extractOTP()` to penalize false positives (like years) and reward contextual keywords ("code", "verify").
- [x] **Autofill Heuristics**: Upgraded `content.js` to intelligently find OTP inputs, including single text inputs, numeric inputs, and complex 4-to-8 character split input fields.
- [x] **UI Polish**: Completed the `popup.html` dashboard allowing users to see live status, history, and manually toggle the monitoring state.

## Currently In Progress / Next Steps
- [ ] **Public Release Preparation**: Awaiting final Google Cloud Project verification for the OAuth Consent Screen.
- [ ] **Edge Case Testing**: Need to test against non-standard 2FA forms (e.g., iframes, Shadow DOM).
- [ ] **Code Cleanup**: Minor refactoring of `background.js` to modularize the Gmail API fetching logic from the parsing logic.
