/**
 * @file sidepanel.js
 * @description Script for the Link Peeker extension's settings panel.
 * Handles loading and saving of user settings, and applying themes and translations.
 */
console.log("Link Peeker side panel script loaded.");

// --- Manual Translation Dictionary ---
const translations = {
  en: {
    settingsTitle: "Link Peeker Settings",
    triggerKeyLabel: "Trigger Key",
    triggerKeyAlt: "Alt + Click",
    triggerKeyCtrl: "Ctrl + Click",
    triggerKeyShift: "Shift + Click",
    themeLabel: "Theme",
    themeAuto: "Auto (Sync with OS)",
    themeLight: "Light",
    themeDark: "Dark",
    languageLabel: "Language",
    langEn: "English",
    langZhCn: "简体中文",
    langZhTw: "繁體中文",
  },
  zh_CN: {
    settingsTitle: "Link Peeker 设置",
    triggerKeyLabel: "触发键",
    triggerKeyAlt: "Alt + 点击",
    triggerKeyCtrl: "Ctrl + 点击",
    triggerKeyShift: "Shift + 点击",
    themeLabel: "主题",
    themeAuto: "自动 (与操作系统同步)",
    themeLight: "亮色",
    themeDark: "暗色",
    languageLabel: "语言",
    langEn: "English",
    langZhCn: "简体中文",
    langZhTw: "繁體中文",
  },
  zh_TW: {
    settingsTitle: "Link Peeker 設定",
    triggerKeyLabel: "觸發鍵",
    triggerKeyAlt: "Alt + 點擊",
    triggerKeyCtrl: "Ctrl + 點擊",
    triggerKeyShift: "Shift + 點擊",
    themeLabel: "主題",
    themeAuto: "自動 (與作業系統同步)",
    themeLight: "亮色",
    themeDark: "暗色",
    languageLabel: "語言",
    langEn: "English",
    langZhCn: "简体中文",
    langZhTw: "繁體中文",
  },
};

// --- Settings Store ---
const settings = {
  triggerKey: "Alt",
  theme: "auto",
  language: "en",
};

/**
 * Saves settings to chrome.storage.sync.
 * @param {object} newSettings - An object containing the settings to save.
 */
function saveSettings(newSettings) {
  chrome.storage.sync.set(newSettings, () => {
    console.log("Settings saved:", newSettings);
  });
}

/**
 * Loads settings from chrome.storage.sync.
 * @param {function} callback - A function to be called with the loaded settings.
 */
function loadSettings(callback) {
  chrome.storage.sync.get(settings, (items) => {
    console.log("Settings loaded:", items);
    if (callback) {
      callback(items);
    }
  });
}

/**
 * Applies translations manually based on the selected language.
 * @param {string} lang - The language code ('en' or 'zh_TW').
 */
function applyTranslations(lang) {
  const dict = translations[lang] || translations.en;
  document.getElementById("settingsTitle").innerText = dict.settingsTitle;
  document.getElementById("triggerKeyLabel").innerText = dict.triggerKeyLabel;
  document.querySelector('option[value="Alt"]').innerText = dict.triggerKeyAlt;
  document.querySelector('option[value="Ctrl"]').innerText =
    dict.triggerKeyCtrl;
  document.querySelector('option[value="Shift"]').innerText =
    dict.triggerKeyShift;
  document.getElementById("themeLabel").innerText = dict.themeLabel;
  document.querySelector('option[value="auto"]').innerText = dict.themeAuto;
  document.querySelector('option[value="light"]').innerText = dict.themeLight;
  document.querySelector('option[value="dark"]').innerText = dict.themeDark;
  document.getElementById("languageLabel").innerText = dict.languageLabel;
  document.querySelector('option[value="en"]').innerText = dict.langEn;
  document.querySelector('option[value="zh_CN"]').innerText = dict.langZhCn;
  document.querySelector('option[value="zh_TW"]').innerText = dict.langZhTw;
}

document.addEventListener("DOMContentLoaded", () => {
  const triggerKeySelect = document.getElementById("triggerKey");
  const themeSelect = document.getElementById("theme");
  const languageSelect = document.getElementById("language");

  /**
   * Applies the selected theme (light, dark, or auto) to the document.
   * @param {string} theme - The theme to apply ('light', 'dark', or 'auto').
   */
  function applyTheme(theme) {
    if (theme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "dark" : "light"
      );
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }

  // Load settings and populate UI
  loadSettings((loadedSettings) => {
    applyTranslations(loadedSettings.language);
    triggerKeySelect.value = loadedSettings.triggerKey;
    themeSelect.value = loadedSettings.theme;
    languageSelect.value = loadedSettings.language;
    applyTheme(loadedSettings.theme);
  });

  // Add event listeners to save changes
  triggerKeySelect.addEventListener("change", () => {
    saveSettings({ triggerKey: triggerKeySelect.value });
  });

  themeSelect.addEventListener("change", () => {
    const newTheme = themeSelect.value;
    saveSettings({ theme: newTheme });
    applyTheme(newTheme);
  });

  languageSelect.addEventListener("change", () => {
    const newLang = languageSelect.value;
    saveSettings({ language: newLang });
    applyTranslations(newLang);
  });
});
