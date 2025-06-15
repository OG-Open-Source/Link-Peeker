/**
 * @file background.js
 * @description Background service worker for the Link Peeker extension.
 * This script is intentionally kept minimal. It currently only logs its own loading.
 * All major logic is handled by the content script to avoid permissions issues and 403 errors.
 */

console.log(
  "Link Peeker background script loaded. All logic is in the content script."
);

// Listener for potential future messages, if needed.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // This is a placeholder for any future background tasks.
  // Currently, all fetching is done in the content script.
  console.log(`Message received in background:`, request);
  return true; // Keep the message channel open for asynchronous response.
});
