/**
 * @file background.js
 * @description Background service worker for the Link Peeker extension.
 * Handles URL resolving to follow redirects.
 */

console.log("Link Peeker background script loaded.");

const DYNAMIC_RULE_ID_START = 1000;

async function updateDynamicRules(customRules) {
  const rulesToAdd = [];
  const rulesToRemove = [];

  // Get existing dynamic rules to find which ones to remove
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  existingRules.forEach((rule) => rulesToRemove.push(rule.id));

  if (customRules && customRules.length > 0) {
    customRules.forEach((rule, index) => {
      const headersToRemove = rule.headersToRemove.map((header) => ({
        header: header,
        operation: "remove",
      }));

      rulesToAdd.push({
        id: DYNAMIC_RULE_ID_START + index,
        priority: 2, // Higher priority than static rules
        action: {
          type: "modifyHeaders",
          responseHeaders: headersToRemove,
        },
        condition: {
          requestDomains: [rule.domain],
          resourceTypes: ["sub_frame"],
        },
      });
    });
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rulesToRemove,
      addRules: rulesToAdd,
    });
    console.log("Dynamic rules updated successfully.", {
      added: rulesToAdd.length,
      removed: rulesToRemove.length,
    });
  } catch (error) {
    console.error("Error updating dynamic rules:", error);
  }
}

const UPGRADE_RULE_ID = 999;

// Load rules on startup/install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Link Peeker: onInstalled event triggered.");

  try {
    // First, try to remove the rule in case it's lingering from a previous session
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [UPGRADE_RULE_ID],
    });
    console.log(
      `Link Peeker: Attempted to remove lingering session rule with ID ${UPGRADE_RULE_ID}.`
    );
  } catch (e) {
    console.warn(
      `Link Peeker: Could not remove session rule ${UPGRADE_RULE_ID}. It might not have existed.`,
      e
    );
  }

  try {
    // Now, add the rule. This should be a clean addition.
    await chrome.declarativeNetRequest.updateSessionRules({
      addRules: [
        {
          id: UPGRADE_RULE_ID,
          priority: 1,
          action: { type: "upgradeScheme" },
          condition: {
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "stylesheet",
              "script",
              "image",
              "font",
              "object",
              "xmlhttprequest",
              "ping",
              "csp_report",
              "media",
              "websocket",
              "other",
            ],
          },
        },
      ],
    });
    console.log(
      `Link Peeker: Successfully added session rule ${UPGRADE_RULE_ID} to upgrade HTTP requests.`
    );
  } catch (e) {
    console.error(
      `Link Peeker: CRITICAL - Failed to add session rule ${UPGRADE_RULE_ID}.`,
      e
    );
  }

  // Load dynamic rules from storage
  chrome.storage.sync.get({ customRules: [] }, (data) => {
    console.log("Link Peeker: Loading custom dynamic rules from storage.");
    updateDynamicRules(data.customRules);
  });
});

// Listener for messages from the settings page or content scripts.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateRules") {
    updateDynamicRules(request.rules);
    sendResponse({ status: "success" });
    return true;
  }

  if (request.type === "resolveUrl") {
    const originalUrl = request.url;
    const initiatorUrl = sender.tab ? sender.tab.url : "";

    fetch(originalUrl, { method: "GET", redirect: "follow" })
      .then((response) => {
        let finalUrl = response.url;

        try {
          const finalUrlHost = new URL(finalUrl).hostname;
          const initiatorHost = initiatorUrl
            ? new URL(initiatorUrl).hostname
            : "";

          // If the final URL is a YouTube watch page AND the initiator was NOT YouTube,
          // convert to an embed URL to ensure it can be iframed.
          if (
            finalUrlHost.includes("youtube.com") &&
            finalUrl.includes("/watch") &&
            !initiatorHost.includes("youtube.com")
          ) {
            const videoId = new URL(finalUrl).searchParams.get("v");
            if (videoId) {
              finalUrl = `https://www.youtube.com/embed/${videoId}`;
            }
          }
        } catch (e) {
          console.error("Error processing final URL:", e);
        }

        sendResponse({ finalUrl: finalUrl });
      })
      .catch((error) => {
        console.error(`Error fetching URL: ${originalUrl}`, error);
        sendResponse({
          finalUrl: originalUrl,
          error: "fetch_failed",
          message: error.message,
        });
      });

    return true; // Indicates that the response is sent asynchronously.
  }
});
