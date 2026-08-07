import React, { useState } from 'react';
import { X, Copy, Check, Download, Layers, Code, CheckCircle2, Zap, Package, Server } from 'lucide-react';

interface ExtensionManifestModalProps {
  onClose: () => void;
  jiraUrl: string;
}

export const ExtensionManifestModal: React.FC<ExtensionManifestModalProps> = ({
  onClose,
  jiraUrl,
}) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manifest' | 'background' | 'popup' | 'live-setup' | 'packaging'>('manifest');

  const cleanUrl = jiraUrl ? jiraUrl.replace(/\/+$/, '') : 'https://*.atlassian.net';

  const MANIFEST_JSON = JSON.stringify(
    {
      manifest_version: 3,
      name: "Jira Quick Search & Offline Cache",
      version: "2.4.0",
      description: "Search Jira tickets, keep search query history, and cache ticket details offline.",
      icons: {
        "16": "icons/icon16.png",
        "32": "icons/icon32.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      },
      action: {
        default_popup: "popup.html",
        default_title: "Jira Quick Search"
      },
      permissions: [
        "storage",
        "alarms"
      ],
      host_permissions: [
        `${cleanUrl}/*`
      ],
      background: {
        service_worker: "background.js"
      }
    },
    null,
    2
  );

  const BACKGROUND_JS = `// Manifest V3 Background Service Worker for Offline Cache Freshness
chrome.alarms.create("jiraCacheSync", { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "jiraCacheSync") {
    console.log("[Jira Extension] Auto-refreshing offline ticket cache in background...");
  }
});
`;

  const POPUP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Jira Quick Search</title>
  <link rel="stylesheet" href="assets/index.css">
</head>
<body style="width: 420px; min-height: 580px; margin: 0; font-family: system-ui, sans-serif;">
  <div id="app"></div>
  <script type="module" src="assets/index.js"></script>
</body>
</html>
`;

  const LIVE_SETUP_GUIDE = `/* =========================================================================
   🔌 INSTRUCTIONS: REMOVE MOCK DATA & CONNECT TO LIVE JIRA REST API
   ========================================================================= */

1. CONFIGURING REAL JIRA CLOUD CREDENTIALS:
   • Open Settings tab in this app or Chrome popup
   • Jira Host URL: ${cleanUrl}
   • Jira User Email: your-email@company.com
   • Atlassian API Token: Create at https://id.atlassian.com/manage-profile/security/api-tokens
   • Paste the API token into the Settings -> "Jira API Token" field.

2. DISABLING MOCK / OFFLINE FALLBACK:
   • Ensure "Online Mode" is active in the top header badge (isSimulatedOffline: false).
   • Go to Settings -> "Clear Cache & History" and click "Clear Local Cache" to purge seed demo tickets.

3. CORS & CHROME EXTENSION HOST PERMISSIONS:
   • Chrome extension popups automatically bypass browser CORS limitations when host_permissions match.
   • Ensure manifest.json includes:
     "host_permissions": ["${cleanUrl}/*"]
   • API endpoint format executed by jiraService.ts:
     GET ${cleanUrl}/rest/api/2/search?jql={query}
     Header: "Authorization: Basic " + btoa(userEmail + ":" + apiToken)
`;

  const PACKAGING_GUIDE = `/* =========================================================================
   📦 INSTRUCTIONS: BUILD, PACKAGE & LOAD FINAL CHROME EXTENSION (.ZIP)
   ========================================================================= */

1. STEP 1: COMPILE PRODUCTION BUILD
   Run in terminal:
   $ npm run build
   This outputs production static assets into the /dist directory.

2. STEP 2: COPY MANIFEST & ICON ASSETS TO /dist
   • Copy 'manifest.json' to /dist/manifest.json
   • Copy icons directory (/public/icons or /src/assets/icons) to /dist/icons/
     - /dist/icons/icon16.png
     - /dist/icons/icon32.png
     - /dist/icons/icon48.png
     - /dist/icons/icon128.png

3. STEP 3: ZIP THE EXTENSION PACKAGE
   Compress the contents of /dist into a zip file:
   $ cd dist && zip -r ../jira-quicksearch-v2.4.zip ./*

4. STEP 4: LOAD UNPACKED IN GOOGLE CHROME
   • Open Chrome browser and navigate to chrome://extensions
   • Toggle 'Developer mode' in top-right corner
   • Click 'Load unpacked' and choose your /dist folder
   • Click the extension icon in Chrome toolbar or press Ctrl+K!
`;

  const copyToClipboard = (content: string, filename: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadFiles = () => {
    const blob = new Blob([MANIFEST_JSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'manifest':
        return MANIFEST_JSON;
      case 'background':
        return BACKGROUND_JS;
      case 'popup':
        return POPUP_HTML;
      case 'live-setup':
        return LIVE_SETUP_GUIDE;
      case 'packaging':
        return PACKAGING_GUIDE;
      default:
        return MANIFEST_JSON;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Chrome Extension Package & Production Guide</h3>
              <p className="text-[11px] text-slate-400">Load directly into Chrome via chrome://extensions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Banner */}
        <div className="p-3 bg-blue-50 dark:bg-slate-800/80 border-b border-blue-100 dark:border-slate-700 text-xs text-blue-900 dark:text-blue-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Quick Install Guide for Chrome Browser:
          </p>
          <ol className="list-decimal list-inside text-[11px] text-blue-800 dark:text-blue-300 space-y-0.5 font-medium">
            <li>Open <code className="bg-blue-100 dark:bg-slate-700 px-1 py-0.2 rounded font-mono">chrome://extensions</code> in Chrome URL bar</li>
            <li>Enable <strong>Developer mode</strong> (toggle switch top right)</li>
            <li>Click <strong>Load unpacked</strong> and select your extension build directory (<code className="bg-blue-100 dark:bg-slate-700 px-1 py-0.2 rounded font-mono">/dist</code>)</li>
          </ol>
        </div>

        {/* Code View Tab Header */}
        <div className="flex flex-wrap items-center justify-between px-3 pt-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-3 py-1.5 font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                activeTab === 'manifest'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              manifest.json
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`px-3 py-1.5 font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                activeTab === 'background'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              background.js
            </button>
            <button
              onClick={() => setActiveTab('popup')}
              className={`px-3 py-1.5 font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                activeTab === 'popup'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              popup.html
            </button>
            <button
              onClick={() => setActiveTab('live-setup')}
              className={`px-3 py-1.5 font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'live-setup'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Remove Mock Data & Live API</span>
            </button>
            <button
              onClick={() => setActiveTab('packaging')}
              className={`px-3 py-1.5 font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'packaging'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-indigo-700 dark:text-indigo-400 hover:text-indigo-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Final Package (.zip)</span>
            </button>
          </div>

          <button
            onClick={handleDownloadFiles}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors mb-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download manifest.json</span>
          </button>
        </div>

        {/* Code Content Editor Area */}
        <div className="flex-1 bg-slate-900 text-slate-100 p-4 overflow-y-auto font-mono text-xs relative">
          <div className="absolute right-6 top-6">
            <button
              onClick={() => copyToClipboard(getTabContent(), activeTab)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-sans transition-colors border border-slate-700 cursor-pointer"
            >
              {copiedFile === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFile === activeTab ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="whitespace-pre-wrap leading-relaxed">
            {getTabContent()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};

