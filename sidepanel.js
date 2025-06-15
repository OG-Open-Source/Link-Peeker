/**
 * @file sidepanel.js
 * @description Script for the Link Peeker extension's settings panel.
 */
console.log("Link Peeker side panel script loaded.");

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

let currentSettings = {};

function saveSettings(newSettings) {
  chrome.storage.sync.set(newSettings, () => {
    console.log("Settings saved:", newSettings);
  });
}

function loadSettings(callback) {
  chrome.storage.sync.get(defaultSettings, (items) => {
    currentSettings = items;
    console.log("Settings loaded:", items);
    if (callback) callback(items);
  });
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.innerText = chrome.i18n.getMessage(el.dataset.i18n) || el.dataset.i18n;
  });
  document.title = chrome.i18n.getMessage("settingsTitle");
}

function applyPanelTheme(theme) {
  let themeToApply =
    theme === "auto"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  document.documentElement.style.filter =
    themeToApply === "inverse" ? "invert(1)" : "none";
  if (themeToApply === "inverse") {
    themeToApply = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  document.documentElement.setAttribute("data-theme", themeToApply);
}

document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    triggerKey: document.getElementById("triggerKey"),
    theme: document.getElementById("theme"),
    language: document.getElementById("language"),
    sandboxOptions: document.getElementById("sandbox-options"),
    allowOptions: document.getElementById("allow-options"),
    referrerPolicyOptions: document.getElementById("referrer-policy-options"),
  };

  applyTranslations();

  loadSettings((settings) => {
    applyPanelTheme(settings.theme);

    elements.triggerKey.value = settings.triggerKey;
    elements.theme.value = settings.theme;
    elements.language.value = settings.language;

    Object.keys(settings.sandbox).forEach((key) => {
      const checkbox = elements.sandboxOptions.querySelector(
        `[data-key="${key}"]`
      );
      if (checkbox) checkbox.checked = settings.sandbox[key];
    });

    Object.keys(settings.allow).forEach((key) => {
      const checkbox = elements.allowOptions.querySelector(
        `[data-key="${key}"]`
      );
      if (checkbox) checkbox.checked = settings.allow[key];
    });

    const radio = elements.referrerPolicyOptions.querySelector(
      `[value="${settings.referrerPolicy}"]`
    );
    if (radio) radio.checked = true;
  });

  elements.triggerKey.addEventListener("change", (e) =>
    saveSettings({ triggerKey: e.target.value })
  );
  elements.theme.addEventListener("change", (e) => {
    saveSettings({ theme: e.target.value });
    applyPanelTheme(e.target.value);
  });
  elements.language.addEventListener("change", () => window.location.reload());

  elements.sandboxOptions.addEventListener("change", (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      const newSandboxSettings = {
        ...currentSettings.sandbox,
        [e.target.dataset.key]: e.target.checked,
      };
      currentSettings.sandbox = newSandboxSettings;
      saveSettings({ sandbox: newSandboxSettings });
    }
  });

  elements.allowOptions.addEventListener("change", (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      const newAllowSettings = {
        ...currentSettings.allow,
        [e.target.dataset.key]: e.target.checked,
      };
      currentSettings.allow = newAllowSettings;
      saveSettings({ allow: newAllowSettings });
    }
  });

  elements.referrerPolicyOptions.addEventListener("change", (e) => {
    if (e.target.matches('input[type="radio"]')) {
      saveSettings({ referrerPolicy: e.target.value });
    }
  });
});
