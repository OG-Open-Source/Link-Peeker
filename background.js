/**
 * @file background.js
 * @description Background service worker for the Link Peeker extension.
 * Handles URL resolving to follow redirects.
 */

console.log("Link Peeker background script loaded.");

// Listener for resolving URLs with redirects.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
