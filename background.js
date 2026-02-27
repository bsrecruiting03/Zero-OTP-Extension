/**
 * Background Service Worker - Gmail API Version
 * Polls Gmail API for OTP emails
 */

console.log('[OTP API] Background worker started');

// Configuration
const CONFIG = {
  CHECK_INTERVAL: 1000, // Check every 1 second
  MAX_HISTORY: 5,
  DEBUG: true
};

// State
let state = {
  isMonitoring: false,
  monitorInterval: null,
  authToken: null,
  lastCheckTime: null
};

/**
 * Initialize
 */
chrome.runtime.onInstalled.addListener(() => {
  log('Extension installed');
  chrome.storage.local.set({
    otpHistory: [],
    isMonitoring: false
  });
});

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('Message received:', request.action);

  if (request.action === 'startMonitoring') {
    startMonitoring().then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;

  } else if (request.action === 'stopMonitoring') {
    stopMonitoring();
    sendResponse({ success: true });

  } else if (request.action === 'getStatus') {
    sendResponse({
      isMonitoring: state.isMonitoring,
      hasToken: !!state.authToken
    });

  } else if (request.action === 'authorize') {
    authorize().then(token => {
      sendResponse({ success: true, hasToken: !!token });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;

  } else if (request.action === 'getHistory') {
    getHistory().then(history => {
      sendResponse({ history });
    });
    return true;

  } else if (request.action === 'clearHistory') {
    clearHistory().then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'checkNow') {
    checkGmailForOTP().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  return false;
});

/**
 * Authorize with Google
 */
async function authorize() {
  try {
    log('Starting authorization...');

    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });

    if (token) {
      state.authToken = token;
      log('✓ Authorization successful');

      // Auto-start monitoring
      await startMonitoring();

      return token;
    } else {
      throw new Error('No token received');
    }

  } catch (err) {
    error('Authorization failed:', err);
    throw err;
  }
}

// Alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check_otp') {
    checkGmailForOTP();
  }
});

/**
 * Start monitoring Gmail
 */
async function startMonitoring() {
  try {
    if (state.isMonitoring) {
      log('Already monitoring');
      return;
    }

    // Ensure we have a token
    if (!state.authToken) {
      log('No auth token, requesting...');
      await authorize();
    }

    state.isMonitoring = true;
    state.lastCheckTime = Date.now();

    await chrome.storage.local.set({ isMonitoring: true });

    // Initial check
    await checkGmailForOTP();

    // Start polling loop
    runPollingLoop();

    // Start polling with Alarms (backup for when worker wakes up)
    chrome.alarms.create('check_otp', {
      periodInMinutes: 1 // Max frequency allowed for alarms
    });

    log('✓ Monitoring started');

    // Update badge
    if (chrome.action) {
      chrome.action.setBadgeText({ text: '●' });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    } else {
      log('chrome.action API not available');
    }

  } catch (err) {
    error('Failed to start monitoring:', err);
    state.isMonitoring = false;
    throw err;
  }
}

/**
 * Stop monitoring
 */
function stopMonitoring() {
  chrome.alarms.clear('check_otp');
  if (state.monitorInterval) {
    clearTimeout(state.monitorInterval);
    state.monitorInterval = null;
  }

  state.isMonitoring = false;
  chrome.storage.local.set({ isMonitoring: false });
  if (chrome.action) {
    chrome.action.setBadgeText({ text: '' });
  }

  log('Monitoring stopped');
}

/**
 * Self-rescheduling polling loop
 */
function runPollingLoop() {
  if (!state.isMonitoring) return;

  checkGmailForOTP().finally(() => {
    state.monitorInterval = setTimeout(runPollingLoop, CONFIG.CHECK_INTERVAL);
  });
}

/**
 * Check Gmail for OTP emails
 */
async function checkGmailForOTP() {
  try {
    log('Checking Gmail...');

    // Build query - emails from last 10 minutes (better for testing)
    const tenMinutesAgo = Math.floor((Date.now() - 600000) / 1000);
    // Explicitly include categories to catch Promotions/Updates AND Spam
    const query = `after:${tenMinutesAgo} (in:inbox OR category:promotions OR category:updates OR in:spam) -in:trash (OTP OR "verification code" OR "verify your" OR "authentication code" OR "security code" OR "login code" OR "sign in code" OR "confirm your identity")`;

    // Fetch list of messages (Increased to 20 to handle burst mode)
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
      {
        headers: {
          'Authorization': `Bearer ${state.authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Handle Token Expiry (401)
    if (response.status === 401) {
      log('Token expired or invalid. Refreshing...');
      await new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken({ token: state.authToken }, resolve);
      });
      state.authToken = null;
      return; // Skip this cycle, next cycle will re-auth
    }

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.messages || data.messages.length === 0) {
      // log('No OTP emails found'); // Verbose
      return;
    }

    log(`Found ${data.messages.length} potential OTP emails`);

    // Process ALL found messages
    for (const msg of data.messages) {
      await processMessage(msg.id);
    }

  } catch (err) {
    error('Error checking Gmail:', err);
    // Extra safety: if we see "Unauthorized" in error message
    if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
      state.authToken = null;
    }
  }
}

/**
 * Process a specific email message
 */
async function processMessage(messageId) {
  try {
    // Check if already processed (using a list now)
    const storage = await chrome.storage.local.get(['processedIds']);
    const processedIds = storage.processedIds || [];

    if (processedIds.includes(messageId)) {
      // log('Message already processed:', messageId); // frequent log, ignore
      return;
    }

    log('Processing message:', messageId);

    // Fetch full message
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${state.authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch message: ${response.status}`);
    }

    const message = await response.json();

    // Extract email details
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';

    // Extract body
    const body = extractBody(message.payload);

    // Extract OTP
    const otp = extractOTP(body);

    if (otp) {
      log('✓ OTP FOUND:', otp);

      // Extract website
      const website = extractWebsite(from, subject, body);

      // Create OTP entry
      const otpEntry = {
        otp: otp,
        website: website,
        sender: from,
        subject: subject,
        timestamp: Date.now(),
        id: messageId
      };

      // Save and broadcast
      await saveOTP(otpEntry);
      await broadcastOTP(otpEntry);

      // Mark as processed (Add to list and keep size manageable)
      processedIds.push(messageId);
      if (processedIds.length > 50) processedIds.shift(); // Keep last 50

      await chrome.storage.local.set({ processedIds: processedIds });

      // Show notification
      chrome.notifications.create(messageId, { // Use messageId as notification ID to avoid dupes
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'OTP Detected!',
        message: `Code ${otp} from ${website}`,
        priority: 2
      });

      // Badge
      if (chrome.action) {
        chrome.action.setBadgeText({ text: '1' });
        chrome.action.setBadgeBackgroundColor({ color: '#667eea' });

        setTimeout(() => {
          if (chrome.action) {
            chrome.action.setBadgeText({ text: '●' });
            chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
          }
        }, 10000);
      }

    } else {
      log('No OTP found in message');
    }

  } catch (err) {
    error('Error processing message:', err);
  }
}

/**
 * Extract email body text (Improved HTML handling)
 */
function extractBody(payload) {
  // Helper to collect parts recursively
  function getParts(payload, mimeType) {
    let parts = [];
    if (payload.mimeType === mimeType && payload.body && payload.body.data) {
      parts.push(payload);
    }
    if (payload.parts) {
      for (const part of payload.parts) {
        parts = parts.concat(getParts(part, mimeType));
      }
    }
    return parts;
  }

  // Try text/plain first
  const textParts = getParts(payload, 'text/plain');
  if (textParts.length > 0) {
    return textParts.map(p => base64Decode(p.body.data)).join('\n');
  }

  // Fallback to text/html
  const htmlParts = getParts(payload, 'text/html');
  if (htmlParts.length > 0) {
    const html = htmlParts.map(p => base64Decode(p.body.data)).join('\n');
    // Improved HTML stripping: replace block tags with newlines
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<\/div>|<\/p>|<br>/gi, '\n') // Replace block closers with newlines
      .replace(/<[^>]+>/g, ' ') // Replace other tags with space
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }

  return '';
}

/**
 * Base64 decode (URL-safe)
 */
function base64Decode(str) {
  try {
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  } catch (e) {
    return '';
  }
}

/**
 * Smart OTP Extraction (Scoring System)
 */
function extractOTP(text) {
  // Potential candidates: 4-8 chars, alphanumeric
  // We look for "tokens" that roughly match our criteria
  const tokenPattern = /\b([A-Za-z0-9]{4,8})\b/g;

  const candidates = [];
  let match;

  // 1. Gather Candidates
  while ((match = tokenPattern.exec(text)) !== null) {
    candidates.push({
      text: match[1],
      index: match.index,
      score: 0,
      reasons: []
    });
  }

  // 2. Score Candidates
  for (const c of candidates) {
    const code = c.text;

    // -- FILTERS (Immediate Disqualification) --
    if (!isValidOTP(code)) {
      c.score = -999;
      continue;
    }

    // -- SCORING --

    // A. Context Bonus (Keywords before the code)
    // Look at previous 30 chars
    const startWindow = Math.max(0, c.index - 30);
    const prevText = text.substring(startWindow, c.index).toLowerCase();

    if (/(code|otp|verify|pin|password|security|token|identity|confirm|expires)/.test(prevText)) {
      c.score += 50;
      c.reasons.push('context_keyword');
    }

    // B. Format Bonus
    if (/[A-Z]/.test(code) && /\d/.test(code)) {
      c.score += 30; // Mixed Alpha-Numeric (Very Strong indicator)
      c.reasons.push('mixed_format');
    } else if (/^\d{6,8}$/.test(code)) {
      c.score += 15; // Long Numeric (Strong)
      c.reasons.push('long_numeric');
    } else if (/^\d{4}$/.test(code)) {
      c.score += 12; // Short Numeric (Corrected to pass threshold)
    }

    // C. Penalties

    // Penalty 1: Date/Year Detection (Extremely Common False Positives)
    // Matches: 2023, 2024, 2025, 1999, etc.
    if (/^(19|20)\d{2}$/.test(code)) {
      c.score -= 100;
      c.reasons.push('looks_like_year');
    }

    // Matches double years glued together e.g. "20242025" or "20232024"
    if (/^(20\d{2})(20\d{2})$/.test(code)) {
      c.score -= 100;
      c.reasons.push('looks_like_double_year');
    }

    // Penalty 2: Sequential or Repeated Numbers (123456, 111111)
    if (/^(123456|1234|654321|0000|1111|2222)$/.test(code)) {
      c.score -= 80;
      c.reasons.push('sequential_or_repeated');
    }

    // Penalty 3: Looks like part of a phone number/zip code without context
    // If it's pure numbers and we had ZERO context keywords nearby, heavily penalize it
    // Real OTPs in emails almost always have context keywords.
    if (/^\d+$/.test(code) && c.score < 20) {
      c.score -= 40;
      c.reasons.push('numbers_without_context');
    }

    // Penalty 4: Common Words Check (if it's all letters)
    if (/^[A-Za-z]+$/.test(code)) {
      // Just a random 6-letter word in an email is very rarely an OTP
      c.score -= 30;
      c.reasons.push('pure_alpha');
    }
  }

  // 3. Selection
  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  log('Candidates:', candidates.map(c => `${c.text} (${c.score})`).slice(0, 3));

  if (candidates.length > 0) {
    const best = candidates[0];
    // Threshold: Need at least context OR strong format (score > 10)
    if (best.score > 10) {
      return best.text;
    }
  }

  return null;
}

/**
 * Validate OTP code
 */
function isValidOTP(code) {
  if (code.length < 4 || code.length > 8) return false;

  // Must have at least one digit
  if (!/\d/.test(code)) return false;

  const blacklist = [
    'gmail', 'email', 'https', 'http', 'html', 'body', 'href', 'style',
    'font', 'width', 'size', 'color', 'sent', 'from', 'subject', 'date',
    'security' // "Security code" -> "Security" is not the code
  ];
  const lower = code.toLowerCase();

  if (blacklist.some(word => lower === word)) return false;

  return true;
}

/**
 * Extract website/service name
 */
function extractWebsite(from, subject, body) {
  // Try from email domain
  const emailMatch = from.match(/@([^.]+)\./);
  if (emailMatch) {
    const domain = emailMatch[1];
    if (!['gmail', 'google', 'noreply'].includes(domain.toLowerCase())) {
      return capitalize(domain);
    }
  }

  // Try from subject
  const subjectPatterns = [
    /([A-Z][a-z]+)\s+(?:verification|otp|code)/i,
    /^([A-Z][a-z]+):/i
  ];

  for (const pattern of subjectPatterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      return capitalize(match[1]);
    }
  }

  return 'Unknown Service';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Save OTP to history
 */
async function saveOTP(otpEntry) {
  const storage = await chrome.storage.local.get(['otpHistory']);
  let history = storage.otpHistory || [];

  history.unshift(otpEntry);
  history = history.slice(0, CONFIG.MAX_HISTORY);

  await chrome.storage.local.set({ otpHistory: history });
  log('Saved to history');
}

/**
 * Broadcast OTP to all tabs
 */
async function broadcastOTP(otpEntry) {
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (!tab.url ||
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('edge://')) {
      continue;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showOTPDropdown',
        otp: otpEntry
      });
    } catch (err) {
      // Tab doesn't have content script
    }
  }

  log('Broadcast complete');
}

/**
 * Get history
 */
async function getHistory() {
  const storage = await chrome.storage.local.get(['otpHistory']);
  return storage.otpHistory || [];
}

/**
 * Clear history
 */
async function clearHistory() {
  await chrome.storage.local.set({ otpHistory: [] });
}

/**
 * Logging
 */
function log(...args) {
  if (CONFIG.DEBUG) {
    console.log('[OTP API]', ...args);
  }
}

function error(...args) {
  console.error('[OTP API ERROR]', ...args);
}
