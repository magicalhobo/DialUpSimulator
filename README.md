# Dial-up Simulator

A Chrome extension that simulates a dial-up connection experience to encourage mindful browsing by adding an intentional delay to specified websites.

## Usage

1. Click the extension icon to see current status
2. Click "Settings" to configure the allowlist and timeout
3. The default allowlist includes common social media sites

## How It Works

1. When you navigate to an allowlisted site, the extension intercepts the request
2. Shows a splash screen simulating a dial-up connection (8 seconds)
3. Plays the dial-up sound during the connection process
4. After completing, navigates to your destination
5. Subsequent visits to that site load normally for the configured timeout period
6. After the timeout expires, the next visit triggers the dial-up simulation again

## Privacy

This extension:
- Only tracks connection times locally (stored in browser storage)
- Does not send any data to external servers
- Does not monitor your browsing history
- Only activates for allowlisted domains you specify
