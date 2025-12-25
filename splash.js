// Connection stages with status messages
const CONNECTION_STAGES = [
  { delay: 0, message: 'Initializing modem...', progress: 0 },
  { delay: 800, message: 'Dialing ISP...', progress: 15 },
  { delay: 1800, message: 'Waiting for carrier tone...', progress: 30 },
  { delay: 3000, message: 'Negotiating connection...', progress: 45 },
  { delay: 4200, message: 'Verifying username and password...', progress: 60 },
  { delay: 5400, message: 'Establishing PPP connection...', progress: 75 },
  { delay: 6600, message: 'Configuring network settings...', progress: 85 },
  { delay: 7500, message: 'Connection established!', progress: 100 }
];

let tabId = null;
let destinationUrl = null;

// Parse URL parameters
function getTabId() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('tabId'));
}

// Update status line
function updateStatus(index, message) {
  const statusElement = document.getElementById(`status${index}`);
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.animationDelay = '0s';
  }
}

// Update progress bar
function updateProgress(percent) {
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.style.width = percent + '%';
  }
}

// Play dial-up sound
async function playDialUpSound() {
  const audio = document.getElementById('dialUpSound');
  if (audio) {
    // Get volume from settings
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      audio.volume = response?.volume ?? 0.3;
    } catch (e) {
      audio.volume = 0.3; // Default if settings fail to load
    }
    
    audio.play().catch(err => {
      console.log('Audio playback failed:', err);
      // If audio fails, continue anyway - the visual is still useful
    });
  }
}

// Simulate connection process
async function simulateConnection() {
  // Play the dial-up sound
  playDialUpSound();
  
  let statusIndex = 1;
  
  for (const stage of CONNECTION_STAGES) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    
    updateStatus(statusIndex, stage.message);
    updateProgress(stage.progress);
    
    statusIndex++;
    if (statusIndex > 5) {
      statusIndex = 5; // Keep updating the last line
    }
  }
  
  // Wait a moment to show completion
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Notify background script that connection is complete
  chrome.runtime.sendMessage({
    type: 'CONNECTION_COMPLETE',
    url: destinationUrl,
    tabId: tabId
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  tabId = getTabId();
  
  if (!tabId) {
    console.error('No tab ID provided');
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Invalid connection request</div>';
    return;
  }
  
  // Get the pending URL from background script
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_PENDING_URL',
      tabId: tabId
    });
    
    if (response && response.url) {
      destinationUrl = response.url;
      
      // Extract domain for display
      try {
        const urlObj = new URL(destinationUrl);
        const speedElement = document.getElementById('connectionSpeed');
        if (speedElement) {
          speedElement.textContent = `Connecting to ${urlObj.hostname}...`;
        }
      } catch (e) {
        console.error('Error parsing URL:', e);
      }
      
      // Start the connection simulation
      simulateConnection();
    } else {
      console.error('No pending URL found');
      document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: No destination URL</div>';
    }
  } catch (error) {
    console.error('Error getting pending URL:', error);
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Communication failed</div>';
  }
});
