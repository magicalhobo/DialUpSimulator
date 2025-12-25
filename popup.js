// Update status display
async function updateStatus() {
  try {
    const { settings } = await chrome.storage.local.get('settings');
    if (!settings) {
      document.getElementById('infoText').textContent = 'Error: Settings not initialized';
      return;
    }

    const enableToggle = document.getElementById('enableToggle');
    const infoText = document.getElementById('infoText');

    // Update toggle state
    enableToggle.classList.toggle('active', settings.enabled);

    if (settings.enabled) {
      infoText.textContent = `${settings.allowlist.length} site(s) in allowlist • ${settings.timeoutMinutes} min timeout`;
    } else {
      infoText.textContent = 'Extension is currently disabled.';
    }
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

// Toggle enabled state
async function toggleEnabled() {
  try {
    const { settings } = await chrome.storage.local.get('settings');
    if (!settings) return;

    settings.enabled = !settings.enabled;
    await chrome.storage.local.set({ settings });

    await updateStatus();
  } catch (error) {
    console.error('Error toggling status:', error);
  }
}

// Open settings page
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateStatus();

  document.getElementById('enableToggle').addEventListener('click', toggleEnabled);
  document.getElementById('settingsButton').addEventListener('click', openSettings);
});
