/**
 * @file content.js
 * @description Content script for the Link Peeker extension.
 */
console.log("Link Peeker content script loaded.");

const defaultSettings = {
  triggerKey: "Alt",
  theme: "inverse",
  referrerPolicy: "strict-origin-when-cross-origin",
  sandbox: {
    "allow-forms": true,
    "allow-modals": true,
    "allow-orientation-lock": false,
    "allow-pointer-lock": false,
    "allow-popups": true,
    "allow-popups-to-escape-sandbox": false,
    "allow-presentation": true,
    "allow-same-origin": true,
    "allow-scripts": true,
    "allow-top-navigation": false,
    "allow-top-navigation-by-user-activation": true,
    "allow-downloads": true,
    "allow-downloads-without-user-activation": false,
    "allow-storage-access-by-user-activation": true,
  },
  allow: {
    autoplay: true,
    camera: false,
    "clipboard-write": false,
    "display-capture": false,
    "encrypted-media": true,
    fullscreen: true,
    geolocation: false,
    microphone: false,
    payment: false,
    "screen-wake-lock": false,
    "web-share": true,
  },
};

let settings = { ...defaultSettings };

const keyMap = {
  Alt: "altKey",
  Ctrl: "ctrlKey",
  Shift: "shiftKey",
};

const BUILT_IN_THEMES = {
  light: {
    name: chrome.i18n.getMessage("themeLight") || "Light",
    blurEnabled: true,
    blurAmount: 10,
    boxBg: "rgba(255, 255, 255, 0.75)",
    border: "#d1d1d1",
    buttonBg: "rgba(245, 245, 245, 0.7)",
    buttonHoverBg: "rgba(235, 235, 235, 0.9)",
    primaryTextColor: "#222222",
    secondaryTextColor: "#555555",
    errorColor: "#d32f2f",
  },
  dark: {
    name: chrome.i18n.getMessage("themeDark") || "Dark",
    blurEnabled: true,
    blurAmount: 10,
    boxBg: "rgba(30, 30, 30, 0.75)",
    border: "#424242",
    buttonBg: "rgba(45, 45, 45, 0.7)",
    buttonHoverBg: "rgba(60, 60, 60, 0.9)",
    primaryTextColor: "#f5f5f5",
    secondaryTextColor: "#bbbbbb",
    errorColor: "#ff5252",
  },
};
let THEMES = { ...BUILT_IN_THEMES };

async function loadThemes() {
  let fileThemes = {};
  try {
    const response = await fetch(chrome.runtime.getURL("themes.json"));
    fileThemes = await response.json();
  } catch (error) {
    console.log("No custom themes.json found or it's invalid. Skipping.");
  }

  const { customThemes } = await chrome.storage.local.get({ customThemes: {} });
  THEMES = { ...BUILT_IN_THEMES, ...fileThemes, ...customThemes };
  console.log("All themes loaded:", THEMES);
}

// Load themes and settings initially
loadThemes();
chrome.storage.sync.get(defaultSettings, (loadedSettings) => {
  settings = loadedSettings;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { newValue }] of Object.entries(changes)) {
    settings[key] = newValue;
  }
});

function createPreviewWindow() {
  const existingWindow = document.getElementById("link-peeker-host");
  if (existingWindow) existingWindow.remove();

  const hostEl = document.createElement("div");
  hostEl.id = "link-peeker-host";
  Object.assign(hostEl.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) scale(0.9)",
    zIndex: "2147483647",
    opacity: "0",
    visibility: "hidden",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  });

  const shadowRoot = hostEl.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = `
  <style>
    :host {
      --box-bg: rgba(30, 30, 30, 0.75);
      --box-border: #424242;
      --button-bg: rgba(45, 45, 45, 0.7);
      --button-hover-bg: rgba(60, 60, 60, 0.9);
      --primary-text-color: #f5f5f5;
      --secondary-text-color: #bbbbbb;
      --error-color: #ff5252;
    }
      .box {
        box-sizing: border-box;
        -webkit-backdrop-filter: blur(5px);
        backdrop-filter: blur(5px);
        border-radius: 12px;
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        width: 80vw;
        max-width: 1280px;
        height: 85vh;
        max-height: 900px;
        padding: 0;
        overflow: hidden;
        position: relative;
        background-color: var(--box-bg);
        border: 3px solid var(--box-border);
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
        background-color: var(--button-bg) !important;
        border: 1px solid var(--box-border);
        color: var(--primary-text-color);
      }
      .control-button:hover {
        background-color: var(--button-hover-bg) !important;
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
      iframe {
        width: 100%;
        height: 100%;
        border: none;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .loader {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin-bottom: 15px;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .loading-status {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--secondary-text-color);
        text-align: center;
        font-family: sans-serif;
        font-size: 14px;
        width: 90%;
        max-width: 400px;
        word-break: break-all;
        z-index: 6;
        padding: 20px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .loading-status.error-state {
        background-color: var(--box-border);
        border: 1px solid #ff3860;
        border-radius: 12px;
      }
      .loading-status .error-icon {
        display: none;
        margin: 0 auto 15px;
        width: 64px;
        height: 64px;
        color: var(--error-color);
      }
      .loading-status .error-message {
        color: var(--error-color);
        font-weight: 700;
        font-size: 18px;
        line-height: 1.4;
      }
    </style>
    <div id="link-peeker-controls" class="controls-container">
       <button id="link-peeker-open" class="button control-button" title="${chrome.i18n.getMessage(
         "openInNewTab"
       )}"><span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg></span></button>
       <button id="link-peeker-close" class="button control-button" title="${chrome.i18n.getMessage(
         "closePreview"
       )}"><span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg></span></button>
    </div>
    <div class="box">
      <div class="iframe-container">
        <div class="loading-status">
          <div class="loader"></div>
          <div class="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
          </div>
          <span class="loading-url"></span>
          <div class="error-message"></div>
        </div>
        <iframe></iframe>
      </div>
    </div>
  `;
  document.body.appendChild(hostEl);
  return hostEl;
}

function getElementBackgroundColor(element) {
  if (!element) return null;
  const color = window.getComputedStyle(element).backgroundColor;
  if (color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent")
    return color;
  if (element === document.documentElement) return null;
  return getElementBackgroundColor(element.parentElement);
}

function detectPageTheme() {
  const effectiveColor = getElementBackgroundColor(document.body);
  if (!effectiveColor) return "light";
  const rgb = effectiveColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) return "light";
  const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return luminance > 128 ? "light" : "dark";
}

function applyAppearance(shadowRoot) {
  const themeKey = settings.theme;
  const themeConfig = THEMES[themeKey] || THEMES["dark"]; // Fallback to dark theme

  if (themeConfig) {
    const box = shadowRoot.querySelector(".box");
    if (box) {
      box.style.backdropFilter = themeConfig.blurEnabled
        ? `blur(${themeConfig.blurAmount}px)`
        : "none";
      box.style.webkitBackdropFilter = themeConfig.blurEnabled
        ? `blur(${themeConfig.blurAmount}px)`
        : "none";
    }

    shadowRoot.host.style.setProperty("--box-bg", themeConfig.boxBg);
    shadowRoot.host.style.setProperty("--box-border", themeConfig.border);
    shadowRoot.host.style.setProperty("--button-bg", themeConfig.buttonBg);
    shadowRoot.host.style.setProperty(
      "--button-hover-bg",
      themeConfig.buttonHoverBg
    );
    shadowRoot.host.style.setProperty(
      "--primary-text-color",
      themeConfig.primaryTextColor
    );
    shadowRoot.host.style.setProperty(
      "--secondary-text-color",
      themeConfig.secondaryTextColor
    );
    shadowRoot.host.style.setProperty("--error-color", themeConfig.errorColor);
  }
}

document.addEventListener(
  "click",
  async (event) => {
    if (!event[keyMap[settings.triggerKey]]) return;

    const link = event.target.closest("a");
    if (!link || !link.href || link.href.startsWith("javascript:")) return;

    event.preventDefault();
    event.stopPropagation();

    const overlay = document.createElement("div");
    overlay.id = "link-peeker-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: "2147483646",
      opacity: "0",
      transition: "opacity 0.2s ease",
    });
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const previewHost = createPreviewWindow();
    const previewWindow = previewHost.shadowRoot;
    applyAppearance(previewWindow);

    const showAnimation = () => {
      requestAnimationFrame(() => {
        previewHost.style.opacity = "1";
        previewHost.style.visibility = "visible";
        previewHost.style.transform = "translate(-50%, -50%) scale(1)";
        overlay.style.opacity = "1";
      });
    };

    setTimeout(showAnimation, 20); // Small delay to ensure styles are applied

    const closeWindow = () => {
      previewHost.style.opacity = "0";
      previewHost.style.transform = "translate(-50%, -50%) scale(0.9)";
      overlay.style.opacity = "0";

      setTimeout(() => {
        previewHost?.remove();
        overlay?.remove();
        document.body.style.overflow = "";
      }, 300); // Match CSS transition duration
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

    const iframe = previewWindow.querySelector("iframe");
    const loadingStatus = previewWindow.querySelector(".loading-status");
    const loader = loadingStatus.querySelector(".loader");
    const loadingUrl = loadingStatus.querySelector(".loading-url");
    const errorMessage = loadingStatus.querySelector(".error-message");
    const errorIcon = loadingStatus.querySelector(".error-icon");

    if (iframe) {
      let loadTimeout;

      const stopLoading = () => {
        clearTimeout(loadTimeout);
        loader.style.display = "none";
        loadingUrl.style.display = "none";
      };

      const showError = (messageKey, substitutions) => {
        stopLoading();
        loadingStatus.classList.add("error-state");
        loadingUrl.textContent = "";
        errorIcon.style.display = "block";
        errorMessage.textContent =
          chrome.i18n.getMessage(messageKey, substitutions || []) || messageKey;
      };

      loader.style.display = "block";
      errorIcon.style.display = "none";
      errorMessage.textContent = "";
      loadingUrl.textContent = chrome.i18n.getMessage("statusResolving");

      // Send URL to background script for resolution
      chrome.runtime.sendMessage(
        { type: "resolveUrl", url: link.href },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Link Peeker: Error resolving URL.",
              chrome.runtime.lastError
            );
            showError("errorResolving", [chrome.runtime.lastError.message]);
            return;
          }

          if (response.error) {
            if (response.error === "blocked") {
              showError("errorBlocked", [response.finalUrl]);
            } else {
              showError("errorUnableToLoad");
            }
            return;
          }

          const finalUrl = response.finalUrl;
          loadingUrl.textContent = chrome.i18n.getMessage("statusLoading", [
            finalUrl,
          ]);

          loadTimeout = setTimeout(() => {
            showError("errorTimeout");
          }, 10000); // 10-second timeout

          iframe.addEventListener("load", () => {
            stopLoading();
            loadingStatus.style.display = "none";
            iframe.style.opacity = "1";
          });

          iframe.addEventListener("error", () => {
            showError("errorUnableToLoad");
          });

          const sandboxPermissions = Object.entries(settings.sandbox)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(" ");
          const allowPermissions = Object.entries(settings.allow)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join("; ");

          iframe.setAttribute("sandbox", sandboxPermissions);
          if (allowPermissions) iframe.setAttribute("allow", allowPermissions);
          iframe.setAttribute("referrerpolicy", settings.referrerPolicy);
          iframe.setAttribute("src", finalUrl);
        }
      );
    } else {
      console.error("Link Peeker: Iframe element not found.");
      closeWindow();
    }
  },
  true
);
