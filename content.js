/**
 * @file content.js
 * @description Content script for the Link Peeker extension.
 */
console.log("Link Peeker content script loaded.");

const defaultSettings = {
  triggerKey: "Alt",
  theme: "inverse",
  language: "en",
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

const THEMES = {
  dark: {
    "--box-bg": "rgba(0, 0, 0, 0.3)",
    "--box-border": "rgba(0, 0, 0, 0.5)",
    "--button-bg": "rgba(0, 0, 0, 0.3)",
    "--button-hover-bg": "rgba(0, 0, 0, 0.5)",
    "--button-color": "#f5f5f5",
  },
  light: {
    "--box-bg": "rgba(255, 255, 255, 0.5)",
    "--box-border": "rgba(255, 255, 255, 0.8)",
    "--button-bg": "rgba(255, 255, 255, 0.5)",
    "--button-hover-bg": "rgba(255, 255, 255, 0.8)",
    "--button-color": "#363636",
  },
};

chrome.storage.sync.get(defaultSettings, (loadedSettings) => {
  settings = loadedSettings;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { newValue }] of Object.entries(changes)) {
    settings[key] = newValue;
  }
});

const gsapScript = document.createElement("script");
gsapScript.src = chrome.runtime.getURL("assets/lib/gsap.min.js");
document.head.appendChild(gsapScript);

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
  });

  const shadowRoot = hostEl.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = `
    <style>
      :host{--box-bg:rgba(0,0,0,0.3);--box-border:rgba(0,0,0,0.5);--button-bg:rgba(0,0,0,0.3);--button-hover-bg:rgba(0,0,0,0.5);--button-color:#f5f5f5;}.box{box-sizing:border-box;-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);border-radius:12px;box-shadow:0 12px 24px rgba(0,0,0,0.25);display:flex;flex-direction:column;width:80vw;max-width:1280px;height:85vh;max-height:900px;padding:0;overflow:hidden;position:relative;background-color:var(--box-bg);border:3px solid var(--box-border);}.controls-container{position:absolute;top:1rem;left:0;transform:translateX(-100%);display:flex;flex-direction:column;gap:0.5rem;}.control-button{-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);border-right:none!important;border-radius:8px 0 0 8px!important;transition:background-color .2s;height:44px;width:44px;padding:0!important;display:flex;align-items:center;justify-content:center;background-color:var(--button-bg)!important;border:1px solid var(--box-border);color:var(--button-color);}.control-button:hover{background-color:var(--button-hover-bg)!important;}.icon svg{width:1.5em;height:1.5em;}.iframe-container{width:100%;height:100%;position:relative;}iframe{width:100%;height:100%;border:none;opacity:0;transition:opacity .3s;}.loader{border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:5}@keyframes spin{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
    </style>
    <div id="link-peeker-controls" class="controls-container">
       <button id="link-peeker-open" class="button control-button" title="Open in New Tab"><span class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 19H6C5.45 19 5 18.55 5 18V6C5 5.45 5.45 5 6 5H11V7H7V17H17V13H19V18C19 18.55 18.55 19 18 19ZM14 4V6H16.59L7.76 14.83L9.17 16.24L18 7.41V10H20V4H14Z"></path></svg></span></button>
       <button id="link-peeker-close" class="button control-button" title="Close"><span class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"></path></svg></span></button>
    </div>
    <div class="box">
      <div class="iframe-container">
        <div class="loader"></div>
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
  let themeToApply =
    settings.theme === "inverse"
      ? detectPageTheme() === "dark"
        ? "light"
        : "dark"
      : settings.theme;
  const themeConfig = THEMES[themeToApply];
  if (themeConfig) {
    for (const [key, value] of Object.entries(themeConfig)) {
      shadowRoot.host.style.setProperty(key, value);
    }
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
    });
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const previewHost = createPreviewWindow();
    const previewWindow = previewHost.shadowRoot;
    applyAppearance(previewWindow);

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
        Object.assign(previewHost.style, {
          opacity: "1",
          visibility: "visible",
          transform: "translate(-50%, -50%) scale(1)",
        });
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

    const iframe = previewWindow.querySelector("iframe");
    const loader = previewWindow.querySelector(".loader");
    if (iframe) {
      iframe.addEventListener("load", () => {
        loader.style.display = "none";
        iframe.style.opacity = "1";
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
      iframe.setAttribute("src", link.href);
    } else {
      console.error("Link Peeker: Iframe element not found.");
      closeWindow();
    }
  },
  true
);
