# Project Roadmap & Goals: OTP Smart Fill

## High-Level Vision
To provide a seamless, magical "Apple-like" autofill experience for OTPs on the web, securely bridging the gap between a user's Gmail inbox and third-party authentication forms without requiring them to leave the active tab.

## Current Features (v2.2.0)
- **Gmail API Integration**: Securely polls for new messages using OAuth2.
- **Smart OTP Extraction**: Uses a refined heuristic scoring system to extract likely OTPs while penalizing false positives like years (2024/2025) or tracking numbers.
- **Intelligent Autofill**: Automatically detects single-input and modern multi-digit split inputs.
- **ATS Safety Filters**: Robust intelligence to avoid accidentally filling irrelevant fields (name, email, phone) on job portals like Greenhouse or Lever.
- **SPA & iFrame Support**: Polling retry logic for slow-loading React apps and `all_frames` support for secure payment portals (Stripe, 3DS).
- **Local History**: Securely stores the last 5 OTPs locally for quick access.

## Future Roadmap & Enhancements
1. **Multi-Account Support**:
   - Support monitoring multiple signed-in Google accounts simultaneously.
2. **Enhanced UI/UX**:
   - Customizable auto-dismiss timers and improved micro-animations.
3. **Cross-Browser Compatibility**:
   - Official ports for Firefox and Microsoft Edge.
4. **Cloud Sync (Optional/Secure)**:
   - End-to-end encrypted synchronization of OTP history across devices.

## Completion Status
- [x] **v2.2.0 Reliability Update**: Successfully launched with extreme efficiency and safety fixes.
- [x] **Chrome Web Store Publication**: Prepared, packaged, and uploaded for public listing.
