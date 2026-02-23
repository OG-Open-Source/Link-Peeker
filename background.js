/**
 * @file background.js v5.0.0-1
 * @description Background service worker for the Link Peeker extension.
 */

const defaultSettings = {
	utmCleaner: true,
	maliciousBlocker: false,
	blocklist: [],
};

chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.sync.set(defaultSettings);
});

// UTM Cleaning logic can also be done here via declarativeNetRequest for better performance
// but for now it's in content.js as requested for "automatic cleaning".

// Malicious URL Blocker - Basic implementation
// In a real scenario, this would fetch and parse EasyList.
// Here we provide the infrastructure.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type === 'checkMalicious') {
		chrome.storage.sync.get({ maliciousBlocker: false, blocklist: [] }, (data) => {
			if (!data.maliciousBlocker) {
				sendResponse({ safe: true });
				return;
			}
			const isBlocked = data.blocklist.some((pattern) => request.url.includes(pattern));
			sendResponse({ safe: !isBlocked });
		});
		return true;
	}
});
