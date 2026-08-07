# Jira QuickSearch - Chrome Extension & Web Application

![Jira QuickSearch Banner](/src/assets/images/jira_extension_hero_1786100697598.jpg)

**Jira QuickSearch** is a fast, offline-capable Chrome Extension and Web Dashboard designed for engineering teams and managers to instantly search, inspect, cache, watch, and transition Jira issues without waiting for Jira's slow web interface to load.

![Feature Overview](/src/assets/images/jira_extension_preview_1786100709655.jpg)

---

## 🌟 Key Features

- ⚡ **Instant Search & JQL Autocomplete**: Search by issue key (`PROJ-101`), summary, assignee, or JQL query expressions with real-time autocompletion for recent fragments, operators, and issue key prefixes.
- 🏷️ **Quick Filter Chips**: Filter currently loaded tickets instantly by `My Issues`, `High Priority`, `In Progress`, `Done`, or `Unassigned` without triggering additional network requests.
- ⏱️ **Time Tracking Progress Bar**: Displays original estimate, logged time spent, and remaining hours formatted into a color-coded visual progress bar in the ticket detail modal.
- 💾 **Smart Offline Cache & Grouping**: Cache opened tickets in `localStorage` with customizable capacity limits, cache expiration policies, CSV export, and auto-grouping by **Status** or **Project**.
- 🔄 **15-Minute Auto-Refresh**: Background periodic auto-refresh keeps offline cached tickets synced with the latest updates on Jira Cloud.
- 📑 **Interactive Labels & Tags**: Click any issue label tag in the detail view to instantly filter the issue list by `labels = "label_name"`.
- 🖨️ **Print to PDF View**: Clean, print-formatted document modal tailored for physical printing or saving ticket details directly as PDF.
- 📋 **Copy JQL String to Clipboard**: Easily copy full JQL query strings from search history with one click to reuse complex queries in Jira Cloud.
- 📤 **Settings JSON Export / Import**: Backup, export, or restore your configuration settings and search history across multiple devices via lightweight JSON files.
- 👁️ **Ticket Watching & Pin Alerts**: Watch and pin critical tickets to receive status change and comment update notifications.
- 📝 **Markdown & Subtasks**: Full GitHub Flavored Markdown support for Jira descriptions and comments, plus inline subtask progress tracking.
- 🌙 **Dark & Light Theme**: Clean, high-contrast dark theme toggle designed for comfortable viewing during night shifts.
- 🤖 **CI/CD GitHub Actions**: Includes automated workflows for linting on every commit and automated release packaging on tag creation.

---

## 📐 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│               CHROME EXTENSION (MANIFEST V3) ARCHITECTURE                   │
│                           & CI/CD PIPELINE                                   │
└──────────────────────────────────────────────────────────────────────────────┘

[1] USER INTERFACE LAYER (Chrome Popup / Side Panel)
┌ React 18 + Vite + Tailwind CSS
├ Global Keyboard Navigation Engine (⌘K, ↑/↓, Enter)
├ Recharts Analytics & Priority Badging Components
└ Popup screens: SearchPanel, IssueList, IssueDetailModal, SettingsModal

│ ▼ IPC / direct service calls

[2] LOCAL STORAGE & CACHE ENGINE
┌ Chrome Extension Storage Sync API (chrome.storage.local)
├ Ticket Caching Engine (configurable limit, e.g. 50 issues)
├ Cache sources: history, watched issues, settings, saved searches
└ Offline Fallback Provider (serves cached results seamlessly)

│ ▼ REST API proxy

[3] EXTERNAL JIRA REST API INTEGRATION
┌ Jira Cloud REST API v3 / JQL endpoint
├ Authentication: Basic Auth Token / API Token
├ Background worker alarms (chrome.alarms, sync every 30m)
└ Issue operations: search, fetch details, watch, transition, comments

│ ▼ CI/CD automated deployment

[4] GITHUB ACTIONS RELEASE PIPELINE
┌ Push/Tag trigger (git tag v1.0.0)
├ Automated lint + Vite production bundle
├ ZIP extension artifact packaging
├ GitHub Release creation with release notes
└ Direct upload and publish to Google Chrome Web Store API
```

---

## 🤖 GitHub Actions CI/CD

The repository includes pre-configured GitHub Actions workflows located in `.github/workflows/`:

1. **Linting Workflow** (`.github/workflows/lint.yml`):
   - Triggers automatically on every `push` and `pull_request` to `main` or `master`.
   - Runs `npm run lint` to enforce code quality and TypeScript safety.

2. **Release Package Workflow** (`.github/workflows/release.yml`):
   - Triggers on tag pushes (`v*`) or manual workflow dispatch.
   - Builds the production bundle (`npm run build`), packages the Chrome extension into a `.zip` artifact, and creates a GitHub Release.

---

## 🛠️ Development & Building

### Prerequisites

- Node.js 18+
- npm or bun

### Local Commands

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

### 0. Automatic Versioning & Release Creation

When you push a git tag formatted like `v1.0.0`, GitHub Actions automatically triggers a production release build.

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 1. Chrome Web Store API Secret Keys Setup

In your GitHub repository settings under **Secrets and variables → Actions**, add the following secrets:

- `CHROME_EXTENSION_ID`: Your extension ID from Chrome Developer Dashboard
- `CHROME_CLIENT_ID`: Google Cloud OAuth2 Client ID
- `CHROME_CLIENT_SECRET`: Google Cloud OAuth2 Client Secret
- `CHROME_REFRESH_TOKEN`: OAuth2 Refresh Token for Chrome Web Store API

### 2. Build the Extension Bundle

Run the build script to compile static HTML, CSS, and JS assets into the `dist` directory:

```bash
npm run build
```

### 3. Verify `manifest.json` Setup

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

### 4. Manual Local Build & Testing

To test the extension locally in Chrome:

1. Run `npm run build` locally.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer Mode** in the top right toggle.
4. Click **Load unpacked** and select the generated `dist/` directory.

### 5. Load & Test Unpacked Extension locally

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the build output directory (`dist`).
5. Open the Extension Popup from your Chrome toolbar and test Jira connection in Settings.

### 6. Publish to the Chrome Web Store

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
