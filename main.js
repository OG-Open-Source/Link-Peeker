/**
 * @file main.js
 * @description Script for the Link Peeker extension's settings panel.
 */
console.log("Link Peeker side panel script loaded.");

const REFERRER_POLICIES = [
  "no-referrer",
  "no-referrer-when-downgrade",
  "origin",
  "origin-when-cross-origin",
  "same-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url",
];

const defaultSettings = {
  triggerKey: "Alt",
  theme: "dark",
  blurAmount: 5,
  referrerPolicy: "strict-origin-when-cross-origin",
  customThemes: {},
  customRules: [
    {
      domain: "*.youtube.com",
      headersToRemove: ["X-Frame-Options", "Content-Security-Policy"],
    },
    {
      domain: "youtu.be",
      headersToRemove: ["X-Frame-Options", "Content-Security-Policy"],
    },
    {
      domain: "github.com",
      headersToRemove: ["Content-Security-Policy"],
    },
  ],
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

// --- UTILITY FUNCTIONS ---
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
    const key = el.dataset.i18n;
    const message = chrome.i18n.getMessage(key);
    if (message) {
      // Use textContent for buttons/spans, value for inputs
      if (el.tagName === "INPUT" && el.type === "submit") {
        el.value = message;
      } else {
        el.textContent = message;
      }
    }
  });
  document.title = chrome.i18n.getMessage("settingsTitle");
}

function createPolicyOption(type, key, i18nKey, container) {
  const label = document.createElement("label");
  label.className = type;

  const input = document.createElement("input");
  input.type = type;
  input.dataset.key = key;
  if (type === "radio") {
    input.name = "referrer";
    input.value = key;
  }

  const span = document.createElement("span");
  span.className = "option-text";

  const plainText = chrome.i18n.getMessage(i18nKey) || i18nKey;
  span.textContent = `${plainText} (${key})`;

  label.appendChild(input);
  label.appendChild(span);
  container.appendChild(label);
}

function applyPanelTheme(theme) {
  const panelTheme = theme === "light" || theme === "dark" ? theme : "light";
  document.documentElement.setAttribute("data-theme", panelTheme);
}

// --- THEME MANAGEMENT ---
async function loadAllThemes() {
  let fileThemes = {};
  try {
    const response = await fetch(chrome.runtime.getURL("themes.json"));
    fileThemes = await response.json();
  } catch (e) {
    console.log("No custom themes.json found or it's invalid. Skipping.");
  }

  const { customThemes } = await chrome.storage.local.get({ customThemes: {} });
  return { ...BUILT_IN_THEMES, ...fileThemes, ...customThemes };
}

function populateThemeDropdown(themes, selectedTheme) {
  const themeSelect = document.getElementById("theme");
  themeSelect.innerHTML = ""; // Clear existing options

  // Add built-in themes first
  const lightOption = document.createElement("option");
  lightOption.value = "light";
  lightOption.textContent = themes.light.name || "Light";
  themeSelect.appendChild(lightOption);

  const darkOption = document.createElement("option");
  darkOption.value = "dark";
  darkOption.textContent = themes.dark.name || "Dark";
  themeSelect.appendChild(darkOption);

  const customThemeKeys = Object.keys(themes).filter(
    (key) => key !== "light" && key !== "dark"
  );

  if (customThemeKeys.length > 0) {
    const separator = document.createElement("option");
    separator.disabled = true;
    separator.textContent = "──────────";
    themeSelect.appendChild(separator);

    customThemeKeys.forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = themes[key].name || key;
      themeSelect.appendChild(option);
    });
  }
  themeSelect.value = selectedTheme;
}

async function saveCustomTheme(themeId, themeData) {
  const { customThemes } = await chrome.storage.local.get({ customThemes: {} });
  customThemes[themeId] = themeData;
  await chrome.storage.local.set({ customThemes });
}

async function deleteCustomTheme(themeId) {
  const { customThemes } = await chrome.storage.local.get({ customThemes: {} });
  delete customThemes[themeId];
  await chrome.storage.local.set({ customThemes });
}

// --- DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    triggerKey: document.getElementById("triggerKey"),
    theme: document.getElementById("theme"),
    sandboxOptions: document.getElementById("sandbox-options"),
    allowOptions: document.getElementById("allow-options"),
    referrerPolicyOptions: document.getElementById("referrer-policy-options"),
    addThemeBtn: document.getElementById("add-theme-btn"),
    themeEditor: document.getElementById("theme-editor"),
    themeIdInput: document.getElementById("theme-id-input"),
    themeNameInput: document.getElementById("theme-name-input"),
    themeBlurEnabledInput: document.getElementById("theme-blurEnabled-input"),
    themeBlurAmountInput: document.getElementById("theme-blurAmount-input"),
    themeBoxBgInput: document.getElementById("theme-boxBg-input"),
    themeBorderInput: document.getElementById("theme-border-input"),
    themeButtonBgInput: document.getElementById("theme-buttonBg-input"),
    themeButtonHoverBgInput: document.getElementById(
      "theme-buttonHoverBg-input"
    ),
    themePrimaryTextColorInput: document.getElementById(
      "theme-primaryTextColor-input"
    ),
    themeSecondaryTextColorInput: document.getElementById(
      "theme-secondaryTextColor-input"
    ),
    themeErrorColorInput: document.getElementById("theme-errorColor-input"),
    saveThemeBtn: document.getElementById("save-theme-btn"),
    cancelEditBtn: document.getElementById("cancel-edit-btn"),
    importThemeBtn: document.getElementById("import-theme-btn"),
    importThemeInput: document.getElementById("import-theme-input"),
    exportThemeBtn: document.getElementById("export-theme-btn"),
    deleteThemeBtn: document.getElementById("delete-theme-btn"),
    addRuleForm: document.getElementById("add-rule-form"),
    ruleDomainInput: document.getElementById("rule-domain-input"),
    ruleRemoveCsp: document.getElementById("rule-remove-csp"),
    ruleRemoveXfo: document.getElementById("rule-remove-xfo"),
    customRulesTableBody: document.getElementById("custom-rules-table-body"),
  };

  let allThemes = {};

  applyTranslations();

  loadSettings(async (settings) => {
    applyPanelTheme(settings.theme);
    elements.triggerKey.value = settings.triggerKey;

    allThemes = await loadAllThemes();
    populateThemeDropdown(allThemes, settings.theme);

    // Dynamically create and populate policy options
    Object.keys(defaultSettings.sandbox).forEach((key) => {
      createPolicyOption(
        "checkbox",
        key,
        `sb_${key.replace(/-/g, "_")}`,
        elements.sandboxOptions
      );
    });
    Object.keys(defaultSettings.allow).forEach((key) => {
      createPolicyOption(
        "checkbox",
        key,
        `fp_${key.replace(/-/g, "_")}`,
        elements.allowOptions
      );
    });
    REFERRER_POLICIES.forEach((key) => {
      createPolicyOption(
        "radio",
        key,
        `rp_${key.replace(/-/g, "_")}`,
        elements.referrerPolicyOptions
      );
    });

    // Set saved values
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

    renderCustomRules(settings.customRules || []);
  });

  // --- EVENT LISTENERS ---
  elements.triggerKey.addEventListener("change", (e) =>
    saveSettings({ triggerKey: e.target.value })
  );

  elements.theme.addEventListener("change", (e) => {
    const selectedTheme = e.target.value;
    saveSettings({ theme: selectedTheme });
    applyPanelTheme(selectedTheme);
    if (selectedTheme !== "light" && selectedTheme !== "dark") {
      elements.deleteThemeBtn.classList.remove("is-hidden");
      elements.exportThemeBtn.classList.remove("is-hidden");
    } else {
      elements.deleteThemeBtn.classList.add("is-hidden");
      elements.exportThemeBtn.classList.add("is-hidden");
    }
  });

  const showThemeEditor = (themeData = null) => {
    if (themeData) {
      // Editing existing theme
      elements.themeIdInput.value = themeData.id;
      elements.themeNameInput.value = themeData.name;
      elements.themeBlurEnabledInput.checked = themeData.blurEnabled;
      elements.themeBlurAmountInput.value = themeData.blurAmount;
      elements.themeBoxBgInput.value = themeData.boxBg;
      elements.themeBorderInput.value = themeData.border;
      elements.themeButtonBgInput.value = themeData.buttonBg;
      elements.themeButtonHoverBgInput.value = themeData.buttonHoverBg;
      elements.themePrimaryTextColorInput.value = themeData.primaryTextColor;
      elements.themeSecondaryTextColorInput.value =
        themeData.secondaryTextColor;
      elements.themeErrorColorInput.value = themeData.errorColor;
    } else {
      // Adding new theme
      elements.themeEditor.reset();
      elements.themeIdInput.value = `custom_${Date.now()}`;
    }
    elements.themeEditor.classList.remove("is-hidden");
    elements.addThemeBtn.classList.add("is-hidden");
  };

  const hideThemeEditor = () => {
    elements.themeEditor.classList.add("is-hidden");
    elements.addThemeBtn.classList.remove("is-hidden");
  };

  elements.addThemeBtn.addEventListener("click", () => showThemeEditor());
  elements.cancelEditBtn.addEventListener("click", hideThemeEditor);

  elements.themeEditor.addEventListener("submit", async (e) => {
    e.preventDefault();
    const themeId = elements.themeIdInput.value;
    const themeData = {
      name: elements.themeNameInput.value,
      blurEnabled: elements.themeBlurEnabledInput.checked,
      blurAmount: parseInt(elements.themeBlurAmountInput.value, 10),
      boxBg: elements.themeBoxBgInput.value,
      border: elements.themeBorderInput.value,
      buttonBg: elements.themeButtonBgInput.value,
      buttonHoverBg: elements.themeButtonHoverBgInput.value,
      primaryTextColor: elements.themePrimaryTextColorInput.value,
      secondaryTextColor: elements.themeSecondaryTextColorInput.value,
      errorColor: elements.themeErrorColorInput.value,
    };

    await saveCustomTheme(themeId, themeData);
    allThemes = await loadAllThemes();
    populateThemeDropdown(allThemes, themeId);
    saveSettings({ theme: themeId });
    applyPanelTheme(themeId);
    hideThemeEditor();
  });

  elements.deleteThemeBtn.addEventListener("click", async () => {
    const selectedTheme = elements.theme.value;
    if (
      selectedTheme &&
      selectedTheme !== "light" &&
      selectedTheme !== "dark"
    ) {
      if (
        confirm(
          `Are you sure you want to delete the theme "${allThemes[selectedTheme].name}"?`
        )
      ) {
        await deleteCustomTheme(selectedTheme);
        allThemes = await loadAllThemes();
        populateThemeDropdown(allThemes, "dark");
        saveSettings({ theme: "dark" });
        applyPanelTheme("dark");
      }
    }
  });

  elements.importThemeBtn.addEventListener("click", () =>
    elements.importThemeInput.click()
  );

  elements.importThemeInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedTheme = JSON.parse(event.target.result);
        // Basic validation
        if (importedTheme.name && importedTheme.boxBg) {
          const themeId = `custom_${Date.now()}`;
          await saveCustomTheme(themeId, importedTheme);
          allThemes = await loadAllThemes();
          populateThemeDropdown(allThemes, themeId);
          saveSettings({ theme: themeId });
          applyPanelTheme(themeId);
          alert("Theme imported successfully!");
        } else {
          alert("Invalid theme file format.");
        }
      } catch (err) {
        alert("Could not parse theme file. Make sure it's valid JSON.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    elements.importThemeInput.value = ""; // Reset for next import
  });

  elements.exportThemeBtn.addEventListener("click", () => {
    const selectedThemeKey = elements.theme.value;
    if (selectedThemeKey && !["light", "dark"].includes(selectedThemeKey)) {
      const themeData = allThemes[selectedThemeKey];
      const blob = new Blob([JSON.stringify(themeData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedThemeKey}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });

  // --- PERMISSION-BASED LISTENERS ---
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

  // --- CUSTOM RULE MANAGEMENT ---
  function renderCustomRules(rules) {
    elements.customRulesTableBody.innerHTML = "";
    if (!rules || rules.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="3" class="has-text-centered" data-i18n="noCustomRules">No custom rules defined.</td>`;
      elements.customRulesTableBody.appendChild(row);
      return;
    }

    rules.forEach((rule, index) => {
      const row = document.createElement("tr");
      const headers = rule.headersToRemove.join(", ");
      row.innerHTML = `
        <td>${rule.domain}</td>
        <td>${headers}</td>
        <td class="has-text-right">
          <button class="button is-danger is-small delete-rule-btn" data-index="${index}" data-i18n="deleteRuleBtn">Delete</button>
        </td>
      `;
      elements.customRulesTableBody.appendChild(row);
    });
  }

  async function updateCustomRules(newRules) {
    currentSettings.customRules = newRules;
    await chrome.storage.sync.set({ customRules: newRules });
    chrome.runtime.sendMessage({ action: "updateRules", rules: newRules });
    renderCustomRules(newRules);
  }

  elements.addRuleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const domain = elements.ruleDomainInput.value.trim();
    if (!domain) return;

    const headersToRemove = [];
    if (elements.ruleRemoveCsp.checked)
      headersToRemove.push("Content-Security-Policy");
    if (elements.ruleRemoveXfo.checked) headersToRemove.push("X-Frame-Options");

    if (headersToRemove.length === 0) {
      alert(
        chrome.i18n.getMessage("error_select_header") ||
          "Please select at least one header to remove."
      );
      return;
    }

    const newRule = { domain, headersToRemove };
    const existingRules = currentSettings.customRules || [];

    // Check for duplicates
    if (existingRules.some((rule) => rule.domain === domain)) {
      alert(
        chrome.i18n.getMessage("error_duplicate_rule") ||
          "A rule for this domain already exists."
      );
      return;
    }

    const updatedRules = [...existingRules, newRule];
    await updateCustomRules(updatedRules);

    elements.addRuleForm.reset();
  });

  elements.customRulesTableBody.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-rule-btn")) {
      const indexToDelete = parseInt(e.target.dataset.index, 10);
      const existingRules = currentSettings.customRules || [];
      const ruleToDelete = existingRules[indexToDelete];

      if (
        confirm(
          chrome.i18n.getMessage("confirm_delete_rule", [
            ruleToDelete.domain,
          ]) ||
            `Are you sure you want to delete the rule for ${ruleToDelete.domain}?`
        )
      ) {
        const updatedRules = existingRules.filter(
          (_, index) => index !== indexToDelete
        );
        await updateCustomRules(updatedRules);
      }
    }
  });
});
