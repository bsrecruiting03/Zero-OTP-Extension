/**
 * Popup Script - Gmail API Version
 */

console.log('[OTP Popup] Loading...');

// Elements
let authSection, statusSection, statusDot, statusLabel, statusBadge, statusDesc;
let btnAuthorize, btnToggle, btnClear, btnRefresh;
let historyList, historyCount;

// State
let currentStatus = {
  isMonitoring: false,
  hasToken: false
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('[OTP Popup] Initializing...');

  // Get elements
  authSection = document.getElementById('auth-section');
  statusSection = document.getElementById('status-section');
  statusDot = document.getElementById('status-dot');
  statusLabel = document.getElementById('status-label');
  statusBadge = document.getElementById('status-badge');
  statusDesc = document.getElementById('status-desc');

  btnAuthorize = document.getElementById('btn-authorize');
  btnToggle = document.getElementById('btn-toggle');
  btnClear = document.getElementById('btn-clear');
  btnRefresh = document.getElementById('btn-refresh');

  historyList = document.getElementById('history-list');
  historyCount = document.getElementById('history-count');

  // Event listeners
  btnAuthorize.addEventListener('click', handleAuthorize);
  btnToggle.addEventListener('click', handleToggle);
  btnClear.addEventListener('click', handleClear);
  btnRefresh.addEventListener('click', handleRefresh);

  // Load status
  loadStatus();
  loadHistory();
}

/**
 * Load current status
 */
async function loadStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
    console.log('[OTP Popup] Status:', response);

    currentStatus = response;
    updateUI();

  } catch (err) {
    console.error('[OTP Popup] Error loading status:', err);
  }
}

/**
 * Update UI based on status
 */
function updateUI() {
  if (currentStatus.hasToken) {
    // Authorized - show status
    authSection.classList.add('hidden');
    statusSection.classList.remove('hidden');

    if (currentStatus.isMonitoring) {
      // Monitoring
      statusDot.classList.remove('inactive');
      statusLabel.textContent = 'Monitoring Active';
      statusBadge.textContent = 'Live';
      statusBadge.classList.remove('inactive');
      statusDesc.textContent = 'Checking Gmail every 1 second for OTP codes.';
      btnRefresh.style.display = 'flex';

      btnToggle.querySelector('#btn-toggle-icon').textContent = '⏸';
      btnToggle.querySelector('#btn-toggle-text').textContent = 'Pause';
    } else {
      // Not monitoring
      statusDot.classList.add('inactive');
      statusLabel.textContent = 'Monitoring Paused';
      statusBadge.textContent = 'Paused';
      statusBadge.classList.add('inactive');
      statusDesc.textContent = 'Click Start to begin monitoring Gmail.';

      btnToggle.querySelector('#btn-toggle-icon').textContent = '▶';
      btnToggle.querySelector('#btn-toggle-text').textContent = 'Start';
      btnRefresh.style.display = 'none';
    }

    btnToggle.disabled = false;
  } else {
    // Not authorized - show auth
    authSection.classList.remove('hidden');
    statusSection.classList.add('hidden');
    btnToggle.disabled = true;
  }
}

/**
 * Handle authorization
 */
async function handleAuthorize() {
  try {
    console.log('[OTP Popup] Starting authorization...');
    btnAuthorize.disabled = true;
    btnAuthorize.textContent = 'Signing in...';

    const response = await chrome.runtime.sendMessage({ action: 'authorize' });

    if (response.success) {
      console.log('[OTP Popup] ✓ Authorization successful');
      currentStatus.hasToken = true;
      currentStatus.isMonitoring = true; // Auto-starts
      updateUI();
    } else {
      throw new Error(response.error || 'Authorization failed');
    }

  } catch (err) {
    console.error('[OTP Popup] Authorization error:', err);
    alert('Failed to authorize: ' + err.message);
    btnAuthorize.disabled = false;
    btnAuthorize.innerHTML = '<span>🔍</span><span>Sign in with Google</span>';
  }
}

/**
 * Handle toggle monitoring
 */
async function handleToggle() {
  try {
    const action = currentStatus.isMonitoring ? 'stopMonitoring' : 'startMonitoring';
    console.log('[OTP Popup] Toggling monitoring:', action);

    const response = await chrome.runtime.sendMessage({ action });

    if (response.success) {
      currentStatus.isMonitoring = !currentStatus.isMonitoring;
      updateUI();
    }

  } catch (err) {
    console.error('[OTP Popup] Toggle error:', err);
  }
}

/**
 * Handle clear history
 */
async function handleClear() {
  if (confirm('Clear all OTP history?')) {
    try {
      await chrome.runtime.sendMessage({ action: 'clearHistory' });
      loadHistory();
    } catch (err) {
      console.error('[OTP Popup] Clear error:', err);
    }
  }
}

/**
 * Handle manual refresh
 */
async function handleRefresh() {
  try {
    console.log('[OTP Popup] Manual refresh requested');
    btnRefresh.classList.add('spinning');
    btnRefresh.disabled = true;

    await chrome.runtime.sendMessage({ action: 'checkNow' });

    // Minimal delay for visual feedback
    setTimeout(() => {
      btnRefresh.classList.remove('spinning');
      btnRefresh.disabled = false;
      loadHistory();
    }, 800);

  } catch (err) {
    console.error('[OTP Popup] Refresh error:', err);
    btnRefresh.classList.remove('spinning');
    btnRefresh.disabled = false;
  }
}

/**
 * Load history
 */
async function loadHistory() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
    const history = response.history || [];

    console.log('[OTP Popup] History:', history.length, 'entries');

    historyCount.textContent = history.length;

    if (history.length === 0) {
      historyList.innerHTML = '<div class="no-history">No OTP codes yet</div>';
      return;
    }

    // Render HTML
    const htmlParts = [];
    for (const entry of history) {
      if (!entry || !entry.otp) continue;

      const icon = getWebsiteIcon(entry.website || 'Unknown');
      const formattedOTP = formatOTP(entry.otp);
      const timeAgo = getTimeAgo(entry.timestamp);

      htmlParts.push(`
        <div class="history-item" data-otp="${entry.otp}">
          <div class="history-item-left">
            <div class="history-icon">${icon}</div>
            <div>
              <div class="history-website">${entry.website || 'Unknown'}</div>
              <div class="history-time">${timeAgo}</div>
            </div>
          </div>
          <div class="history-code">${formattedOTP}</div>
        </div>
      `);
    }

    historyList.innerHTML = htmlParts.join('');

    // Add click handlers
    const items = historyList.querySelectorAll('.history-item');
    items.forEach((item) => {
      item.addEventListener('click', async () => {
        const otpValue = item.getAttribute('data-otp');
        if (!otpValue) return;

        try {
          // Write to clipboard
          await navigator.clipboard.writeText(otpValue);

          // Visual feedback
          const originalBackground = item.style.background;
          item.style.background = 'rgba(76, 175, 80, 0.3)';

          setTimeout(() => {
            item.style.background = originalBackground;
          }, 300);
        } catch (err) {
          console.error('[OTP Popup] Copy failed:', err);
        }
      });
    });

  } catch (err) {
    console.error('[OTP Popup] Error loading history:', err);
  }
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
