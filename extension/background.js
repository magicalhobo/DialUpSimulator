// Default settings
const DEFAULT_SETTINGS = {
  allowlist: [
    'facebook.com',
    'instagram.com',
    'reddit.com',
    'twitter.com',
    'x.com',
  ],
  timeoutMinutes: 10,
  volume: 0.3, // 0.0 to 1.0
  enabled: true
};

// Find the allowlist domain that matches a given hostname
function getAllowlistDomain(hostname, allowlist) {
  return allowlist.find(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  ) || null;
}

// Check if a URL requires the dial-up splash
async function shouldShowSplash(url) {
  try {
    const urlObj = new URL(url);
    
    const { settings, connectionTimes } = await chrome.storage.local.get(['settings', 'connectionTimes']);
    const config = settings;
    const times = connectionTimes || {};
    
    if (!config.enabled) {
      return false;
    }
    
    // Check if hostname is in allowlist
    const allowlistDomain = getAllowlistDomain(urlObj.hostname, config.allowlist);
    
    if (!allowlistDomain) {
      return false;
    }
    
    // Check for bypass flag (used during programmatic navigation after splash)
    const bypassKey = `bypass_${allowlistDomain}`;
    const { [bypassKey]: bypass } = await chrome.storage.local.get(bypassKey);
    if (bypass && Date.now() - bypass < 5000) {
      // Clear the bypass flag
      await chrome.storage.local.remove(bypassKey);
      return false;
    }
    
    // Check if timeout has expired (keyed by allowlist domain so that
    // pre-redirect and post-redirect origins share the same entry)
    const lastConnection = times[allowlistDomain];
    if (!lastConnection) {
      return true;
    }
    
    const timeoutMs = config.timeoutMinutes * 60 * 1000;
    const elapsed = Date.now() - lastConnection;
    
    return elapsed >= timeoutMs;
  } catch (e) {
    console.error('Error checking splash requirement:', e);
    return false;
  }
}

// Mark a domain as connected
async function markConnected(url) {
  try {
    const urlObj = new URL(url);
    
    const { settings, connectionTimes } = await chrome.storage.local.get(['settings', 'connectionTimes']);
    const allowlistDomain = getAllowlistDomain(urlObj.hostname, settings.allowlist);
    if (!allowlistDomain) return;
    
    const times = connectionTimes || {};
    times[allowlistDomain] = Date.now();
    
    await chrome.storage.local.set({ connectionTimes: times });
  } catch (e) {
    console.error('Error marking connection:', e);
  }
}

// Initialize settings
chrome.runtime.onInstalled.addListener(async () => {
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
});

// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main frame navigations
  if (details.frameId !== 0) {
    return;
  }
  
  const shouldShow = await shouldShowSplash(details.url);
  
  if (shouldShow) {
    // Store the original URL and tab ID
    await chrome.storage.local.set({
      [`pending_${details.tabId}`]: {
        url: details.url,
        timestamp: Date.now()
      }
    });
    
    // Redirect to splash page
    const splashUrl = chrome.runtime.getURL('splash.html') + '?tabId=' + details.tabId;
    chrome.tabs.update(details.tabId, { url: splashUrl });
  }
});

// Listen for messages from splash page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONNECTION_COMPLETE') {
    // Mark connection first, then set bypass flag and navigate
    markConnected(message.url).then(async () => {
      const urlObj = new URL(message.url);
      const { settings } = await chrome.storage.local.get('settings');
      const allowlistDomain = getAllowlistDomain(urlObj.hostname, settings.allowlist);
      const bypassKey = `bypass_${allowlistDomain}`;
      
      // Set bypass flag to prevent re-interception
      await chrome.storage.local.set({ [bypassKey]: Date.now() });
      
      // Clean up pending data
      await chrome.storage.local.remove(`pending_${message.tabId}`);
      
      // Navigate to the original URL
      chrome.tabs.update(message.tabId, { url: message.url });
    }).catch(err => {
      console.error('Error completing connection:', err);
    });
    
    return true;
  }

  if (message.type === 'GET_PENDING_URL') {
    chrome.storage.local.get(`pending_${message.tabId}`).then(result => {
      const data = result[`pending_${message.tabId}`];
      sendResponse(data || null);
    });
    return true;
  }
  
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get('settings').then(({ settings }) => {
      sendResponse(settings);
    });
    return true;
  }
  
  if (message.type === 'RESET_SETTINGS') {
    chrome.storage.local.set({ settings: DEFAULT_SETTINGS }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Clean up old pending navigations (in case user closes tab during splash)
setInterval(async () => {
  const items = await chrome.storage.local.get(null);
  const now = Date.now();
  const toRemove = [];
  
  for (const [key, value] of Object.entries(items)) {
    if (key.startsWith('pending_') && value.timestamp) {
      // Remove if older than 5 minutes
      if (now - value.timestamp > 5 * 60 * 1000) {
        toRemove.push(key);
      }
    }
  }
  
  if (toRemove.length > 0) {
    await chrome.storage.local.remove(toRemove);
  }
}, 60000);
