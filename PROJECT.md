# Project Roadmap & Goals: OTP Smart Fill

## High-Level Vision
To provide a seamless, magical "Apple-like" autofill experience for OTPs on the web, securely bridging the gap between a user's Gmail inbox and third-party authentication forms without requiring them to leave the active tab.

## Current Features
- **Gmail API Integration**: Securely polls for new messages using OAuth2.
- **Smart OTP Extraction**: Uses heuristics and text context to score and extract the most likely OTP candidate from an email body.
- **Intelligent Autofill**: Automatically detects single-input and modern multi-input (split) OTP fields and simulates natural typing to fill them.
- **Local History**: securely stores the last 5 OTPs locally for easy access and clipboard copying.

## Future Roadmap & Enhancements
1. **Performance & Rate Limiting Optimization**:
   - Refine the polling mechanism to handle Gmail API rate limits even more gracefully (e.g., exponential backoff) if quotas become an issue for public release.
2. **Enhanced Parsing Engine**:
   - Expand the heuristic model to support more obscure OTP formats, such as alphabetical-only backup codes or multi-language contexts.
3. **Multi-Account Support**:
   - Support monitoring multiple signed-in Google accounts simultaneously.
4. **Firefox/Edge Support**:
   - Adapt the manifest and identity APIs for cross-browser compatibility.
5. **Chrome Web Store Publication**:
   - Prepare store assets, finalize a privacy policy, and submit for Google's OAuth App Verification to transition from "Developer Mode" to a public listing.
