// DOM elements
let timeoutInput;
let volumeInput;
let volumeValue;
let allowlistInput;
let resetButton;
let statusMessage;

// Load saved settings
async function loadSettings() {
  try {
    // This should always be initialized by the background script
    const { settings } = await chrome.storage.local.get('settings');
    
    // Update UI
    timeoutInput.value = settings.timeoutMinutes;
    const volumePercent = Math.round(settings.volume * 100);
    volumeInput.value = volumePercent;
    volumeValue.textContent = volumePercent + '%';
    allowlistInput.value = settings.allowlist.join('\n');
  } catch (error) {
    showStatus('Error loading settings: ' + error.message, 'error');
  }
}

// Save settings
async function saveSettings() {
  try {
    // Get current settings to preserve enabled state
    const { settings: currentSettings } = await chrome.storage.local.get('settings');
    if (!currentSettings) return;
    
    // Parse allowlist
    const allowlistText = allowlistInput.value.trim();
    const allowlist = allowlistText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Don't save if allowlist is empty (invalid state)
    if (allowlist.length === 0) {
      return;
    }
    
    // Validate timeout
    const timeout = parseInt(timeoutInput.value);
    if (isNaN(timeout) || timeout < 1 || timeout > 1440) {
      return;
    }
    
    // Get volume (convert from percentage to 0-1 range)
    const volumePercent = parseInt(volumeInput.value, 10);
    if (isNaN(volumePercent) || volumePercent < 0 || volumePercent > 100) {
      return;
    }
    const volume = volumePercent / 100;
    
    // Save to storage, preserving enabled state
    const settings = {
      allowlist,
      timeoutMinutes: timeout,
      volume,
      enabled: currentSettings.enabled // Preserve enabled state from current settings
    };
    
    await chrome.storage.local.set({ settings });
    showStatus('✓ Saved', 'success');
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

// Reset to default settings
async function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    try {
      await chrome.runtime.sendMessage({ type: 'RESET_SETTINGS' });
      await loadSettings();
      showStatus('✓ Settings reset to defaults', 'success');
    } catch (error) {
      showStatus('Error resetting settings: ' + error.message, 'error');
    }
  }
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = 'status ' + type;
  statusMessage.style.display = 'block';
  
  // Auto-hide after 1.5 seconds for success, 3 seconds for errors
  const hideDelay = type === 'success' ? 1500 : 3000;
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, hideDelay);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  timeoutInput = document.getElementById('timeoutInput');
  volumeInput = document.getElementById('volumeInput');
  volumeValue = document.getElementById('volumeValue');
  allowlistInput = document.getElementById('allowlistInput');
  resetButton = document.getElementById('resetButton');
  statusMessage = document.getElementById('statusMessage');
  
  // Add event listeners
  resetButton.addEventListener('click', resetSettings);
  volumeInput.addEventListener('input', () => {
    volumeValue.textContent = volumeInput.value + '%';
  });
  
  // Auto-save on input changes
  allowlistInput.addEventListener('input', saveSettings);
  timeoutInput.addEventListener('change', saveSettings);
  volumeInput.addEventListener('change', saveSettings);
  
  // Load initial settings
  loadSettings();
});
