/**
 * Content Script - Production Version
 * Shows dropdown and fills OTP codes
 */

(function () {
  'use strict';

  console.log('[OTP Content] Script loaded on:', window.location.href);

  // Configuration
  const CONFIG = {
    DEBUG: false,
    AUTO_DISMISS_TIME: 30000,
    FILL_RETRY_ATTEMPTS: 3
  };

  // State
  let currentDropdown = null;

  /**
   * Message listener
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    log('Message received:', request.action);

    try {
      if (request.action === 'showOTPDropdown') {
        showDropdown(request.otp);
        sendResponse({ success: true });
      } else if (request.action === 'fillOTPCode') {
        fillOTP(request.otp);
        sendResponse({ success: true });
      }
    } catch (err) {
      error('Error handling message:', err);
      sendResponse({ success: false, error: err.message });
    }

    return false;
  });

  /**
   * Show OTP dropdown
   */
  function showDropdown(otpData) {
    try {
      log('Showing dropdown for:', otpData);

      // Remove existing dropdown
      if (currentDropdown) {
        currentDropdown.remove();
      }

      // Create dropdown
      const dropdown = createDropdown(otpData);
      document.body.appendChild(dropdown);
      currentDropdown = dropdown;

      // Load history
      loadHistory(dropdown);

      // Auto-dismiss
      setTimeout(() => {
        if (dropdown.parentElement) {
          dropdown.classList.add('otp-dropdown-exit');
          setTimeout(() => dropdown.remove(), 300);
        }
      }, CONFIG.AUTO_DISMISS_TIME);

      log('✓ Dropdown shown');

      // AUTO-FILL: As requested by user, attempt to fill immediately
      fillOTP(otpData.otp);

    } catch (err) {
      error('Error showing dropdown:', err);
    }
  }

  /**
   * Create dropdown element
   */
  function createDropdown(otpData) {
    const dropdown = document.createElement('div');
    dropdown.className = 'otp-dropdown-container';
    dropdown.id = 'otp-smart-dropdown';

    const icon = getWebsiteIcon(otpData.website);
    const formattedOTP = formatOTP(otpData.otp);

    dropdown.innerHTML = `
      <div class="otp-dropdown-header">
        <div class="otp-header-content">
          <div class="otp-header-icon">🔐</div>
          <div class="otp-header-text">
            <div class="otp-header-title">New OTP Code</div>
            <div class="otp-header-subtitle">Click to fill</div>
          </div>
        </div>
        <button class="otp-close-btn" data-action="close">×</button>
      </div>
      
      <div class="otp-main-item" data-otp="${otpData.otp}">
        <div class="otp-item-left">
          <div class="otp-website-icon">${icon}</div>
          <div class="otp-item-info">
            <div class="otp-website-name">${otpData.website}</div>
            <div class="otp-timestamp">Just now</div>
          </div>
        </div>
        <div class="otp-code">${formattedOTP}</div>
      </div>
      
      <div class="otp-history-section">
        <div class="otp-history-header">Recent Codes</div>
        <div class="otp-history-list" id="otp-history-list">
          <div class="otp-loading">Loading...</div>
        </div>
      </div>
    `;

    // Event listeners
    dropdown.querySelector('[data-action="close"]').addEventListener('click', () => {
      dropdown.classList.add('otp-dropdown-exit');
      setTimeout(() => dropdown.remove(), 300);
    });

    dropdown.querySelector('.otp-main-item').addEventListener('click', () => {
      fillOTP(otpData.otp);
      dropdown.classList.add('otp-dropdown-exit');
      setTimeout(() => dropdown.remove(), 300);
    });

    return dropdown;
  }

  /**
   * Load and display history
   */
  async function loadHistory(dropdown) {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
      const history = response.history || [];

      log('Loaded history:', history.length, 'entries');

      const historyList = dropdown.querySelector('#otp-history-list');
      if (!historyList) return;

      if (history.length <= 1) {
        historyList.innerHTML = '<div class="otp-no-history">No recent codes</div>';
        return;
      }

      // Show last 4 (skip first which is the current one)
      const recentHistory = history.slice(1, 5);

      historyList.innerHTML = recentHistory.map(entry => {
        const icon = getWebsiteIcon(entry.website);
        const formattedOTP = formatOTP(entry.otp);
        const timeAgo = getTimeAgo(entry.timestamp);

        return `
          <div class="otp-history-item" data-otp="${entry.otp}">
            <div class="otp-item-left">
              <div class="otp-history-icon">${icon}</div>
              <div class="otp-item-info">
                <div class="otp-history-website">${entry.website}</div>
                <div class="otp-timestamp">${timeAgo}</div>
              </div>
            </div>
            <div class="otp-history-code">${formattedOTP}</div>
          </div>
        `;
      }).join('');

      // Add click handlers
      historyList.querySelectorAll('.otp-history-item').forEach(item => {
        item.addEventListener('click', () => {
          const otp = item.getAttribute('data-otp');
          fillOTP(otp);
          dropdown.classList.add('otp-dropdown-exit');
          setTimeout(() => dropdown.remove(), 300);
        });
      });

    } catch (err) {
      error('Error loading history:', err);
    }
  }

  /**
   * Fill OTP code with robust retry logic (for SPAs)
   */
  function fillOTP(otp) {
    log('Attempting to fill OTP:', otp);
    let attempts = 0;
    const maxAttempts = 10; // Try for up to 3 seconds total

    const attemptFill = () => {
      attempts++;
      try {
        const input = findOTPInput();

        if (input) {
          log('Found OTP input on attempt:', attempts);

          if (Array.isArray(input)) {
            fillMultipleInputs(input, otp);
          } else {
            fillSingleInput(input, otp);
          }

          showSuccess(otp);
          return true; // Success
        } else if (attempts < maxAttempts) {
          log('No OTP input found yet, retrying... attempt:', attempts);
          setTimeout(attemptFill, 300); // Wait 300ms before retrying
          return false;
        } else {
          log('Max retries reached. No OTP input found, copying to clipboard');
          copyToClipboard(otp);
          return false;
        }
      } catch (err) {
        error('Error during fill attempt:', err);
        if (attempts >= maxAttempts) {
          copyToClipboard(otp);
        } else {
          setTimeout(attemptFill, 300);
        }
        return false;
      }
    };

    attemptFill(); // Start first attempt
  }

  /**
   * Check if input is likely irrelevant (like name, email, search)
   */
  function isIrrelevantInput(input) {
    const attrs = [
      input.name || '',
      input.id || '',
      input.autocomplete || '',
      input.placeholder || '',
      input.className || ''
    ].join(' ').toLowerCase();

    // Find associated label text if possible
    let labelText = '';
    if (input.id) {
      try {
        const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
        if (label) labelText = label.innerText.toLowerCase();
      } catch (e) { }
    }
    if (!labelText && input.closest('label')) {
      labelText = input.closest('label').innerText.toLowerCase();
    }
    // Check previous element in case it's acting as a label wrapper
    if (!labelText && input.previousElementSibling && ['DIV', 'SPAN', 'LABEL'].includes(input.previousElementSibling.tagName)) {
      labelText = input.previousElementSibling.innerText.substr(0, 80).toLowerCase();
    }

    const allContext = attrs + ' ' + labelText;

    // 1. If it explicitly asks for OTP/code, it's definitely relevant (whitelist)
    if (/\b(otp|code|verification|token|pin|mfa|2fa|passcode)\b/.test(allContext) || allContext.includes('one-time')) {
      return false;
    }

    // 2. Ignore fields that are clearly for other purposes (ATS Job Application safety)
    const badRegex = /\b(name|first_name|last_name|fname|lname|email|username|search|url|address|location|phone|telephone|mobile|zip|postal|city|state|country|dob|birth|card|cvv|password|company|school|degree|experience|resume|linkedin|portfolio|github|gender|race|ethnicity|veteran|disability|salary|pay|job_application|answers)\b/i;

    // Also ignore specific html input types
    if (input.type === 'email' || input.type === 'url' || input.type === 'search' || input.type === 'date') {
      return true;
    }

    if (badRegex.test(allContext)) {
      return true;
    }

    // Default: not explicitly irrelevant
    return false;
  }

  /**
   * Find OTP input field
   */
  function findOTPInput() {
    log('Searching for OTP input...');

    // 1. PRIORITY: Check focused input first (FASTEST)
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      const input = document.activeElement;
      if ((input.type === 'text' || input.type === 'tel' || input.type === 'number' || input.type === 'password') &&
        !input.disabled && !input.readOnly && !isIrrelevantInput(input)) {
        log('Using focused input');

        // Check if focused input is part of a group
        const siblings = Array.from(input.parentNode.children).filter(el => el.tagName === 'INPUT');
        if (siblings.length >= 4 && siblings.length <= 8) {
          return siblings;
        }

        return input;
      }
    }

    // 2. Specific selectors mapping (FAST)
    const singleSelectors = [
      'input[autocomplete="one-time-code"]',
      'input[name*="otp" i]',
      'input[id*="otp" i]',
      'input[name*="code" i]',
      'input[id*="code" i]',
      'input[name*="verification" i]',
      'input[id*="verification" i]',
      'input[placeholder*="code" i]',
      'input[placeholder*="otp" i]',
      'input[inputmode="numeric"]'
    ];

    for (const selector of singleSelectors) {
      const inputs = document.querySelectorAll(selector);
      for (const input of inputs) {
        if (isVisible(input) && !input.disabled && !input.readOnly) {
          // Double check: if this input is actually part of a group we missed?
          const siblings = Array.from(input.parentNode.children).filter(el => el.tagName === 'INPUT');
          if (siblings.length >= 4 && siblings.length <= 8) {
            log('Input selector matched, but found it is part of a group');
            return siblings;
          }

          log('Found input with selector:', selector);
          return input;
        }
      }
    }

    // 3. FALLBACK: Search for split inputs (OPTIMIZED BOTTOM-UP)
    // Find all potential inputs on the page first, instead of all containers
    const allInputs = Array.from(document.querySelectorAll('input'));
    const validInputs = allInputs.filter(inp =>
      !inp.disabled &&
      !inp.readOnly &&
      (inp.type === 'text' || inp.type === 'number' || inp.type === 'tel' || inp.type === 'password') &&
      !isIrrelevantInput(inp)
    );

    // Group valid inputs by their parent element
    const groupsByParent = new Map();
    for (const inp of validInputs) {
      if (!groupsByParent.has(inp.parentElement)) {
        groupsByParent.set(inp.parentElement, []);
      }
      groupsByParent.get(inp.parentElement).push(inp);
    }

    // Identify if any parent contains 4-8 valid inputs
    for (const [parent, inputs] of groupsByParent.entries()) {
      if (inputs.length >= 4 && inputs.length <= 8) {
        // Only check visibility for these specific sets of inputs
        // This avoids thousands of getBoundingClientRect calls
        const visible = inputs.filter(inp => isVisible(inp));

        if (visible.length >= 4 && visible.length <= 8) {
          // Check if widths are similar
          const w0 = visible[0].getBoundingClientRect().width;
          const allSimilar = visible.every(inp => Math.abs(inp.getBoundingClientRect().width - w0) < 5);

          // CRITICAL SAFETY FOR SPLIT INPUTS:
          // In job applications, there might be 4 standard text fields (e.g. name, email, phone) 
          // that share a parent and have the same width.
          // True OTP split boxes are small (e.g., typically < 80px) or have maxLength = 1.
          const isSmallWidth = w0 < 80;
          const isSingleDigitMode = visible.every(inp => inp.maxLength === 1);

          if (allSimilar && (isSmallWidth || isSingleDigitMode)) {
            log('Found multi-digit input group:', visible.length);
            return visible;
          }
        }
      }
    }

    log('No OTP input found');
    return null;
  }

  /**
   * Check if element is visible
   */
  function isVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return !!(
      rect.width &&
      rect.height &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      style.opacity !== '0'
    );
  }

  /**
   * Fill single input
   */
  function fillSingleInput(input, otp) {
    log('Filling single input');

    input.focus();
    input.value = '';
    input.value = otp;

    // Trigger events
    const events = ['input', 'change', 'keyup', 'blur'];
    events.forEach(eventType => {
      input.dispatchEvent(new Event(eventType, { bubbles: true }));
    });

    // Try to submit
    setTimeout(() => {
      const form = input.closest('form');
      if (form) {
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
          log('Clicking submit button');
          submitBtn.click();
        }
      }
    }, 500);
  }

  /**
   * Fill multiple inputs
   */
  function fillMultipleInputs(inputs, otp) {
    log('Filling multiple inputs:', inputs.length);

    const chars = otp.split('');

    inputs.forEach((input, index) => {
      if (chars[index]) {
        // Some sites clear the input on focus, so focusing first is good
        input.focus();
        input.value = chars[index];

        // Dispatch sequence of events to mimic typing
        input.dispatchEvent(new Event('keydown', { bubbles: true }));
        input.dispatchEvent(new Event('keypress', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('keyup', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // Explicitly focus the next input to support sites that auto-advance
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      }
    });

    // Blur the last input to trigger validation
    if (inputs[inputs.length - 1]) {
      inputs[inputs.length - 1].blur();
    }

    // Try to click submit button
    setTimeout(() => {
      const form = inputs[0].closest('form');
      if (form) {
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
          log('Clicking submit button');
          submitBtn.click();
        }
      }
    }, 300);
  }

  /**
   * Show success feedback
   */
  function showSuccess(otp) {
    const existing = document.getElementById('otp-success-feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.id = 'otp-success-feedback';
    feedback.className = 'otp-success-toast';
    feedback.innerHTML = `
      <div class="otp-success-content">
        <div class="otp-success-icon">✓</div>
        <div>
          <div class="otp-success-title">Code Filled!</div>
          <div class="otp-success-code">${formatOTP(otp)}</div>
        </div>
      </div>
    `;

    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.classList.add('otp-success-exit');
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  }

  /**
   * Copy to clipboard
   */
  function copyToClipboard(otp) {
    navigator.clipboard.writeText(otp).then(() => {
      log('✓ Copied to clipboard');

      const toast = document.createElement('div');
      toast.className = 'otp-success-toast';
      toast.innerHTML = `
        <div class="otp-success-content">
          <div class="otp-success-icon">📋</div>
          <div>
            <div class="otp-success-title">Copied to Clipboard!</div>
            <div class="otp-success-code">${formatOTP(otp)}</div>
          </div>
        </div>
      `;

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('otp-success-exit');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }).catch(err => {
      error('Failed to copy:', err);
    });
  }

  /**
   * Utilities
   */
  function getWebsiteIcon(website) {
    const icons = {
      'twitter': '🐦', 'facebook': '👤', 'instagram': '📷',
      'google': '🔍', 'amazon': '📦', 'bank': '🏦',
      'paypal': '💳', 'github': '💻', 'linkedin': '💼',
      'whatsapp': '💬', 'telegram': '✈️', 'discord': '🎮'
    };

    const lower = website.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lower.includes(key)) return icon;
    }
    return '🔒';
  }

  function formatOTP(otp) {
    if (otp.length === 6) {
      return `${otp.slice(0, 3)} ${otp.slice(3)}`;
    } else if (otp.length === 4) {
      return `${otp.slice(0, 2)} ${otp.slice(2)}`;
    }
    return otp;
  }

  function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log('[OTP Content]', ...args);
    }
  }

  function error(...args) {
    console.error('[OTP Content ERROR]', ...args);
  }

  log('Content script initialized');

})();
