# Jira QuickSearch - Chrome Extension & Web Application

**Jira QuickSearch** is a fast, offline-capable Chrome Extension and Web Dashboard designed for engineering teams and managers to instantly search, inspect, cache, watch, and transition Jira issues without waiting for Jira's slow web interface to load.

---

## 🌟 Key Features

- ⚡ **Instant Search & JQL Support**: Search by issue key (`PROJ-101`), summary, assignee, or full JQL query expressions with syntax auto-completion.
- 💾 **Smart Offline Caching**: Automatically cache opened tickets in `localStorage` with customizable capacity limits, cache expiration policy, and CSV export/import capabilities.
- 🕒 **Recently Viewed Tickets**: Quick horizontal bar tracking the last 5 tickets opened in the detail modal for instant re-access.
- 👁️ **Ticket Watching & Pin Alerts**: Watch and pin critical tickets to receive real-time status change and comment update notifications.
- 🏷️ **Bulk Ticket Management**: Multi-select issues to transition status (e.g. `To Do` -> `In Progress` -> `Done`), pin, or manage cache in bulk with one click.
- 📝 **Markdown Rendering**: Full GitHub Flavored Markdown support for Jira issue descriptions, comments, and acceptance criteria.
- 🔗 **Direct Jira Link Copying**: Copy direct ticket URLs to clipboard instantly for sharing in Slack or Microsoft Teams.
- 🌙 **Dark & Light Mode**: Clean, high-contrast dark theme toggle designed for comfortable viewing during night shifts.
- ⌨️ **Keyboard Shortcuts**: Complete shortcut support (`Ctrl+K` search focus, `Esc` close modal, `J/K` navigation).

---

## 📐 System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 USER INTERFACE                                    |
| +-------------------------------------------------------------------------------+ |
| |                            React 18 + Tailwind CSS                            | |
| |                                                                               | |
| |   +-------------------+  +--------------------+  +-------------------------+  | |
| |   |   Header & Nav    |  | Search & JQL Panel |  |  Issue List & Bulk Bar  |  | |
| |   +-------------------+  +--------------------+  +-------------------------+  | |
| |   | - Dark Mode Toggle|  | - JQL Helper       |  | - Recently Viewed (5)   |  | |
| |   | - Notifications   |  | - Search History   |  | - Bulk Status Change    |  | |
| |   +-------------------+  +--------------------+  +-------------------------+  | |
| |                                                                               | |
| |   +-----------------------------------------------------------------------+   | |
| |   |                         Issue Detail Drawer                           |   | |
| |   | - Markdown Description & Comments  | - Copy Jira Link | - Watch/Pin   |   | |
| |   +-----------------------------------------------------------------------+   | |
| +-------------------------------------------------------------------------------+ |
+------------------------------------------|----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                            STATE & SERVICE ENGINE                                 |
| +-------------------------------------------------------------------------------+ |
| |                             jiraService.ts Engine                             | |
| |                                                                               | |
| |  - Local Cache Storage Manager          - Watcher & Pin Notification Engine    | |
| |  - Offline Fallback Engine              - History & Settings Persistence      | |
| +-------------------------------------------------------------------------------+ |
+------------------------------------------|----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
+---------------------------------------+     +---------------------------------------+
|          LOCAL PERSISTENCE            |     |             JIRA REST API             |
|                                       |     |                                       |
| - localStorage (`jira_ext_cache`)     |     | - GET `/rest/api/3/search`            |
| - localStorage (`jira_ext_history`)   |     | - GET `/rest/api/3/issue/{key}`       |
| - localStorage (`jira_ext_watched`)   |     | - POST `/rest/api/3/issue/{key}/...`  |
| - localStorage (`jira_ext_settings`)  |     | (Configured via API Token / Domain)   |
+---------------------------------------+     +---------------------------------------+
```

---

## 🛠️ Development & Building

### Prerequisites
- Node.js 18+
- npm or bun

### Local Setup
```bash
# Install dependencies
npm install

# Start local dev server (port 3000)
npm run dev

# Run TypeScript linter
npm run lint

# Build production distribution
npm run build
```

---

## 🚀 How to Publish as a Chrome Extension

### 1. Build the Extension Bundle
Run the build script to compile static HTML, CSS, and JS assets into the `dist` directory:
```bash
npm run build
```

### 2. Verify `manifest.json` Setup
Ensure the root `dist/manifest.json` file is present (or copy from `assets/manifest.json`). The extension uses Manifest V3:
```json
{
  "manifest_version": 3,
  "name": "Jira QuickSearch & Offline Cache",
  "version": "1.0.0",
  "description": "Fast offline Jira search, ticket watching, caching, and bulk issue status management.",
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "permissions": ["storage", "clipboardWrite"],
  "host_permissions": ["https://*.atlassian.net/*"]
}
```

### 3. Load & Test Unpacked Extension locally
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the build output directory (`dist`).
5. Open the Extension Popup from your Chrome toolbar and test Jira connection in Settings.

### 4. Publish to the Chrome Web Store
1. **Create Developer Account**: Sign in to the [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/).
2. **Zip Distribution Output**: Compress the contents of the `dist` folder into a ZIP file:
   ```bash
   cd dist && zip -r ../jira-quicksearch-v1.0.0.zip .
   ```
3. **Upload Package**: Click **New Item** in the Chrome Web Store Console and upload `jira-quicksearch-v1.0.0.zip`.
4. **Store Listing Details**:
   - Title: Jira QuickSearch & Offline Cache
   - Short Description: Search, cache, watch, and transition Jira issues instantly.
   - Upload 128x128 icon and at least one 1280x800 screenshot.
   - Set Privacy Policy URL and Host Permissions Justification (`https://*.atlassian.net/*` for API access).
5. **Submit for Review**: Click **Submit for Review**. Review typically completes within 24 to 48 hours.

---

## 📄 License
MIT License. Built with React 18, Vite, Tailwind CSS, and Lucide Icons.
