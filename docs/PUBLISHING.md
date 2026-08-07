# Publishing Guide - Jira QuickSearch Chrome Extension

This guide details the end-to-end instructions for packaging and publishing **Jira QuickSearch** to the Chrome Web Store or deploying internal enterprise extension distributions.

---

## 📋 Checklist Before Publishing

- [ ] Run `npm run lint` and `npm run build` to verify there are no compilation or type errors.
- [ ] Confirm `manifest.json` version is updated (e.g. `1.0.0`).
- [ ] Verify host permissions for Atlassian cloud domains (`https://*.atlassian.net/*`).
- [ ] Ensure all icons (`16x16`, `48x48`, `128x128`) are placed in the assets folder.
- [ ] Test extension unpacked in Chrome with Developer Mode enabled.

---

## 📦 Packaging Instructions

1. **Build Distribution**:
   ```bash
   npm run build
   ```

2. **Zip Dist Assets**:
   Navigating into the `dist` directory and create the archive:
   ```bash
   cd dist
   zip -r ../jira-quicksearch-extension.zip .
   cd ..
   ```

---

## 🌐 Chrome Web Store Submission

1. Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/).
2. Pay one-time developer registration fee if first time registering.
3. Click **Items** -> **New Item**.
4. Drag and drop `jira-quicksearch-extension.zip`.
5. Complete **Store Listing**:
   - Category: Productivity / Developer Tools
   - Detailed Description: Explain JQL support, offline ticket caching, bulk status transitions, and watch alerts.
   - Upload Promotional Screenshots (1280x800 px).
6. Complete **Privacy Practices**:
   - Single Purpose Description: Quick search and offline access to Atlassian Jira tickets.
   - Justify permissions: `storage` (for settings and cache), `clipboardWrite` (for direct link copying).
7. Submit for Review.

---

## 🏢 Enterprise Self-Hosting (GPO / InTune)

For internal company deployment without public web store publishing:
1. Host the zipped distribution on an internal artifact server or S3 bucket.
2. Generate an `update.xml` manifest pointing to the hosted CRX file.
3. Configure Chrome Enterprise Group Policy (`ExtensionInstallForceList`) using the extension ID and update URL.
