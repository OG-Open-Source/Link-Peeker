/**
 * @file content.js
 * @description Content script for the Link Peeker extension.
 * Injects UI, listens for user interaction, and handles all fetching and parsing.
 */
console.log("Link Peeker content script loaded.");

// --- Configuration Store ---
let settings = {
  triggerKey: "Alt", // Default value
};
const keyMap = {
  Alt: "altKey",
  Ctrl: "ctrlKey",
  Shift: "shiftKey",
};

// Load initial settings and listen for changes
chrome.storage.sync.get(settings, (loadedSettings) => {
  settings = loadedSettings;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.triggerKey) {
    settings.triggerKey = changes.triggerKey.newValue;
  }
});

// Inject GSAP into the main page context
const gsapScript = document.createElement("script");
gsapScript.src =
  "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js";
document.head.appendChild(gsapScript);

/**
 * Creates and injects the preview window into the DOM using Shadow DOM.
 * @returns {HTMLElement} The created host element for the shadow root.
 */
function createPreviewWindow() {
  const existingWindow = document.getElementById("link-peeker-host");
  if (existingWindow) {
    existingWindow.remove();
  }

  const hostEl = document.createElement("div");
  hostEl.id = "link-peeker-host";
  hostEl.style.position = "fixed";
  hostEl.style.top = "50%";
  hostEl.style.left = "50%";
  hostEl.style.transform = "translate(-50%, -50%) scale(0.9)"; // Start smaller for animation
  hostEl.style.zIndex = "2147483647";
  hostEl.style.opacity = "0";
  hostEl.style.visibility = "hidden";

  const shadowRoot = hostEl.attachShadow({ mode: "open" });

  const windowContent = document.createElement("div");
  windowContent.innerHTML = `
    <style>
      .box {
        background-color: transparent;
        border-radius: 12px;
        box-shadow: 0 12px 24px rgba(0,0,0,0.25);
        display: flex;
        flex-direction: column;
        width: 80vw;
        max-width: 1280px;
        height: 85vh;
        max-height: 900px;
        padding: 0;
        overflow: hidden;
        position: relative;
      }
      .controls-container {
        position: absolute;
        top: 1rem;
        left: 0;
        transform: translateX(-100%);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .control-button {
        -webkit-backdrop-filter: blur(5px);
        backdrop-filter: blur(5px);
        border-right: none !important;
        border-radius: 8px 0 0 8px !important;
        transition: background-color 0.2s;
        height: 44px;
        width: 44px;
        padding: 0 !important;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .control-button.light {
        background-color: rgba(255, 255, 255, 0.5) !important;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #363636;
      }
      .control-button.light:hover {
        background-color: rgba(255, 255, 255, 0.8) !important;
        border-color: rgba(255, 255, 255, 0.4) !important;
      }
      .control-button.dark {
        background-color: rgba(0, 0, 0, 0.3) !important;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #f5f5f5;
      }
      .control-button.dark:hover {
        background-color: rgba(0, 0, 0, 0.5) !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
      }
      .icon svg {
        width: 1.5em;
        height: 1.5em;
      }
      .iframe-container {
        width: 100%;
        height: 100%;
        position: relative;
      }
      .loader {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 5;
      }
      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
    </style>
    <div id="link-peeker-controls" class="controls-container">
       <button id="link-peeker-open" class="button control-button" title="Open in New Tab">
          <span class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 19H6C5.45 19 5 18.55 5 18V6C5 5.45 5.45 5 6 5H11V7H7V17H17V13H19V18C19 18.55 18.55 19 18 19ZM14 4V6H16.59L7.76 14.83L9.17 16.24L18 7.41V10H20V4H14Z"></path></svg></span>
       </button>
       <button id="link-peeker-close" class="button control-button" title="Close">
          <span class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"></path></svg></span>
       </button>
    </div>
    <div class="box">
      <div class="iframe-container">
        <div class="loader"></div>
        <iframe src="" style="width: 100%; height: 100%; border: none; opacity: 0; transition: opacity 0.3s;"></iframe>
      </div>
    </div>
  `;
  shadowRoot.appendChild(windowContent);

  document.body.appendChild(hostEl);
  return hostEl;
}

/**
 * Main click event listener for the entire document.
 */
document.addEventListener(
  "click",
  async (event) => {
    const requiredKey = keyMap[settings.triggerKey];
    if (!event[requiredKey]) return;

    const link = event.target.closest("a");
    if (!link || !link.href || link.href.startsWith("javascript:")) return;

    event.preventDefault();
    event.stopPropagation();

    // --- UI Setup ---
    const overlay = document.createElement("div");
    overlay.id = "link-peeker-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.zIndex = "2147483646";
    overlay.style.opacity = "0";
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const previewHost = createPreviewWindow();
    const previewWindow = previewHost.shadowRoot;

    // Apply theme to controls
    chrome.storage.sync.get({ theme: "auto" }, (items) => {
      let currentTheme = items.theme;
      if (currentTheme === "auto") {
        currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      previewWindow.querySelectorAll(".control-button").forEach((btn) => {
        btn.classList.add(currentTheme);
      });
    });

    // --- Animation and Event Handlers ---
    const showAnimation = () => {
      if (typeof gsap !== "undefined") {
        gsap.to([previewHost, overlay], {
          duration: 0.4,
          opacity: 1,
          scale: 1,
          visibility: "visible",
          ease: "power3.out",
        });
      } else {
        previewHost.style.opacity = "1";
        previewHost.style.visibility = "visible";
        previewHost.style.transform = "translate(-50%, -50%) scale(1)";
        overlay.style.opacity = "1";
      }
    };

    setTimeout(showAnimation, 50);

    const closeWindow = () => {
      if (typeof gsap !== "undefined") {
        gsap.to([previewHost, overlay], {
          duration: 0.3,
          opacity: 0,
          scale: 0.9,
          ease: "power3.in",
          onComplete: () => {
            previewHost?.remove();
            overlay?.remove();
            document.body.style.overflow = "";
          },
        });
      } else {
        previewHost?.remove();
        overlay?.remove();
        document.body.style.overflow = "";
      }
    };

    previewWindow
      .querySelector("#link-peeker-open")
      .addEventListener("click", () => {
        window.open(link.href, "_blank");
        closeWindow();
      });
    previewWindow
      .querySelector("#link-peeker-close")
      .addEventListener("click", closeWindow);
    overlay.addEventListener("click", closeWindow);

    // --- Iframe Logic ---
    const iframe = previewWindow.querySelector("iframe");
    const loader = previewWindow.querySelector(".loader");
    if (iframe) {
      iframe.addEventListener("load", () => {
        loader.style.display = "none";
        iframe.style.opacity = "1";
      });
      iframe.src = link.href;
    } else {
      console.error("Link Peeker: Iframe element not found.");
      closeWindow();
    }
  },
  true
);
