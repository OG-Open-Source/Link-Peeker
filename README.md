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
- **Immersive UI:** The preview window appears centered on the screen with a semi-transparent, frosted-glass effect overlay.
- **Dynamic Theming:**
  - **Light & Dark Modes:** Clean, modern light and dark themes for the preview window.
  - **Inverse Mode (Negative Effect):** A unique theme that inverts the colors of the previewed `<iframe>`, creating a "negative" effect that's useful for quick content scanning or accessibility.
- **Fluid Animations:** Powered by GSAP for smooth, high-performance animations for the window, overlay, and loading indicators.
- **Comprehensive Security Configuration:** A dedicated side panel allows you to configure:
  - **Trigger Key:** `Alt`, `Ctrl`, or `Shift`.
  - **Language:** English, Traditional Chinese (`zh_TW`), and Simplified Chinese (`zh_CN`).
  - **Sandbox Permissions:** Fine-tune the `<iframe>`'s core security restrictions with over 10 standard flags.
  - **Feature Policy (Allow List):** Grant specific high-level API access (like `fullscreen`, `payment`, or `camera`) to the previewed page.
  - **Referrer Policy:** Choose from 8 different policies to control how much referrer information is sent.
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
- **Access Settings:** Open your browser's side panel and select "Link Peeker" to configure trigger keys, themes, language, and detailed security settings.

## Glossary

- **Manifest V3:** The current standard for Chrome extensions, focusing on improved security, performance, and privacy.
- **declarativeNetRequest:** A Manifest V3 API that allows extensions to modify network requests declaratively, used here to remove anti-framing headers.
- **Shadow DOM:** A web standard used for CSS encapsulation. It creates a "shadow root" for an element, isolating its styles and structure from the main document's DOM.
- **sandbox (iframe attribute):** A security feature that applies a set of restrictions to the content within an `<iframe>`. Link Peeker provides a comprehensive settings panel to let you configure these permissions.
- **allow (iframe attribute):** A Feature Policy mechanism that allows you to selectively enable specific browser features (like fullscreen, payment processing, etc.) within the `<iframe>`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

## License

This repository is licensed under the [MIT License](https://opensource.org/licenses/mit-license.php).

---

© 2025 [OG-Open-Source](https://github.com/OG-Open-Source). All rights reserved.
