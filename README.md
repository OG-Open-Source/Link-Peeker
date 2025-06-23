# Link Peeker

Link Peeker is a Chromium extension for quick, interactive link previews without leaving your page.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation Guide](#installation-guide)
- [Usage](#usage)
- [Theme Customization](#theme-customization)
- [Glossary](#glossary)
- [Contributing](#contributing)
- [License](#license)

## Overview

Link Peeker is a powerful Chromium extension designed to boost your browsing productivity. It allows you to preview the full, interactive content of any hyperlink in an elegant, centered, non-intrusive pop-up window without navigating away from your current page.

## Features

- **Full Webpage Preview:** Instead of just metadata, Link Peeker loads the complete, interactive webpage inside a sandboxed `<iframe>`.
- **Immersive UI:** The preview window appears centered on the screen with a semi-transparent, frosted-glass effect overlay.
- **Advanced Theming System:**
  - **Built-in Themes:** Comes with polished, hard-coded Light and Dark themes.
  - **Visual Theme Editor:** A powerful editor in the settings page allows you to create, edit, and delete your own custom themes.
  - **Detailed Customization:** Adjust everything from background/button colors to primary/secondary text colors, error message colors, and even enable/disable and control the intensity of the Gaussian blur effect.
  - **Import & Export:** Easily share your creations by exporting themes to a JSON file, or import themes created by others.
- **Intelligent YouTube Handling:**
  - Previews the full, interactive YouTube page (including comments) when navigating within YouTube.
  - Automatically switches to the embeddable player when previewing a YouTube link from any other website to ensure maximum compatibility.
- **Fluid Animations:** Powered by GSAP for smooth, high-performance animations for the window, overlay, and loading indicators.
- **Comprehensive Security Configuration:** A dedicated options page with a clean sidebar navigation allows you to configure:
  - **General:** Set your preferred trigger key (`Alt`, `Ctrl`, or `Shift`).
  - **Appearance:** Select a theme or use the visual editor to create your own.
  - **Rules:** Define custom rules to remove restrictive headers (`X-Frame-Options`, `Content-Security-Policy`) for specific domains.
  - **Advanced:** Fine-tune security settings like `Sandbox Permissions`, `Feature Policy`, and `Referrer Policy`.
- **Modern & Secure:** Built with Manifest V3 and uses `declarativeNetRequest` to surgically bypass anti-framing headers on specific domains like YouTube, without compromising overall security.

## Installation Guide

This project does not require any build steps or dependencies. You can load it directly into your browser.

**Steps:**

1.  **Clone or Download:** Get a local copy of this project's folder.
2.  **Load the Extension in Your Browser:**
    - Open your Chromium-based browser (e.g., Google Chrome, Microsoft Edge, Brave).
    - Navigate to the extensions management page (usually `chrome://extensions`).
    - Enable **"Developer mode"**.
    - Click the **"Load unpacked"** button.
    - Select the entire project folder (the one containing `manifest.json`).
3.  **Done!** The Link Peeker extension should now be installed and active.

## Usage

- **Trigger Preview:** Hold down your selected trigger key (default is `Alt`) and left-click on any hyperlink (`<a>` tag) on a webpage.
- **Interact with Preview:** You can scroll and interact with the webpage inside the preview window.
- **Use Controls:** Click the floating buttons on the left to open the link in a new tab or close the preview.
- **Close Preview:** You can also close the preview by clicking the dark overlay.
- **Access Settings:** Right-click the extension icon and select "Options", or manage the extension through your browser's extension page to access the settings. Use the sidebar to navigate between General, Appearance, Rules, and Advanced settings.

## Theme Customization

Link Peeker features a robust theme system.

- **Selecting a Theme:** Choose from built-in themes or your own custom themes from the "Theme" dropdown in the settings.
- **Creating a New Theme:**
  1. Click the "Add New Theme" button.
  2. A visual editor will appear, allowing you to configure all aspects of the theme.
  3. Give your theme a name and click "Save Theme". It will now be available in the dropdown.
- **Importing/Exporting:**
  - **Import:** Click "Import from JSON" to load a theme file from your computer.
  - **Export:** Select one of your custom themes from the dropdown and click "Export to JSON" to save it as a file.
- **`themes.json` file:** This file in the project root can be used to bundle additional, shareable themes with the extension.

## Glossary

- **Manifest V3:** The current standard for Chrome extensions, focusing on improved security, performance, and privacy.
- **declarativeNetRequest:** A Manifest V3 API that allows extensions to modify network requests declaratively. Used here to remove anti-framing headers for specific domains.
- **Shadow DOM:** A web standard used for CSS encapsulation. It creates a "shadow root" for an element, isolating its styles and structure from the main document's DOM.
- **sandbox (iframe attribute):** A security feature that applies a set of restrictions to the content within an `<iframe>`.
- **allow (iframe attribute):** A Feature Policy mechanism that allows you to selectively enable specific browser features within the `<iframe>`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

## License

This repository is licensed under the [MIT License](https://opensource.org/licenses/mit-license.php).

---

© 2025 [OG-Open-Source](https://github.com/OG-Open-Source). All rights reserved.
