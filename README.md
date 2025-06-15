# Link Peeker

Link Peeker is a Chromium extension for quick, interactive link previews without leaving your page.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation Guide](#installation-guide)
- [Usage](#usage)
- [Glossary](#glossary)
- [Contributing](#contributing)
- [License](#license)

## Overview

Link Peeker is a powerful Chromium extension designed to boost your browsing productivity. It allows you to preview the full, interactive content of any hyperlink in an elegant, centered, non-intrusive pop-up window without navigating away from your current page.

## Features

- **Full Webpage Preview:** Instead of just metadata, Link Peeker loads the complete, interactive webpage inside a sandboxed `<iframe>`.
- **Immersive UI:** The preview window appears centered on the screen with a semi-transparent overlay, and the original page is "tombstoned" (made non-interactive) to focus your attention.
- **Floating Controls:** The "Open in New Tab" and "Close" controls are rendered as a sleek, vertical toolbar attached to the left side of the preview window, featuring a modern frosted glass effect (`backdrop-filter`).
- **Fluid Animations:** Powered by GSAP for smooth, high-performance animations for the window, overlay, and loading indicators.
- **Style Encapsulation:** Uses Shadow DOM to prevent any style conflicts with the host page.
- **Customizable Settings:** A dedicated side panel allows you to configure:
  - Trigger Key (`Alt`, `Ctrl`, `Shift`)
  - Theme (Light, Dark, or Auto-sync with OS)
  - Language
- **Multi-language Support:** Ships with English, Traditional Chinese (`zh_TW`), and Simplified Chinese (`zh_CN`).
- **Modern & Secure:** Built with Manifest V3 and `declarativeNetRequest` to bypass `X-Frame-Options` and other anti-embedding headers securely.

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
- **Access Settings:** Open your browser's side panel and select "Link Peeker" to access the settings page.

## Glossary

- **Manifest V3:** The current standard for Chrome extensions, focusing on improved security, performance, and privacy.
- **Content Script (`content.js`):** A script injected directly into webpages. It can read and manipulate the DOM of the page and is responsible for creating the preview UI and detecting user interactions.
- **declarativeNetRequest:** A Manifest V3 API that allows extensions to modify network requests declaratively, used here to remove anti-framing headers.
- **Shadow DOM:** A web standard used for CSS encapsulation. It creates a "shadow root" for an element, isolating its styles and structure from the main document's DOM.
- **sandbox (iframe attribute):** A security feature that applies a set of restrictions to the content within an `<iframe>`. We use `allow-same-origin` as a necessary trade-off to let modern web apps function.
- **Tombstone Mechanism:** A term used here to describe making the background page non-interactive (by preventing scrolling) while the preview is active.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

## License

This repository is licensed under the [MIT License](https://opensource.org/licenses/mit-license.php).

---

© 2025 [OG-Open-Source](https://github.com/OG-Open-Source). All rights reserved.
