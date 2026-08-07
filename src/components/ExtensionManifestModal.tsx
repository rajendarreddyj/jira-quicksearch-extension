import React, { useState } from 'react';
import { X, Copy, Check, Download, Layers, Code, CheckCircle2 } from 'lucide-react';

interface ExtensionManifestModalProps {
  onClose: () => void;
  jiraUrl: string;
}

export const ExtensionManifestModal: React.FC<ExtensionManifestModalProps> = ({
  onClose,
  jiraUrl,
}) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manifest' | 'popup' | 'background'>('manifest');

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
chrome.alarms.create("jiraCacheSync", { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "jiraCacheSync") {
    console.log("[Jira Extension] Syncing offline ticket cache in background...");
  }
});
`;

  const POPUP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Jira Quick Search</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body style="width: 420px; height: 600px; margin: 0; font-family: system-ui, sans-serif;">
  <div id="app"></div>
  <script src="popup.js"></script>
</body>
</html>
`;

  const copyToClipboard = (content: string, filename: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadFiles = () => {
    // Generate manifest.json download blob
    const blob = new Blob([MANIFEST_JSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Chrome Extension Package Export</h3>
              <p className="text-[11px] text-slate-400">Load directly into Chrome via chrome://extensions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Banner */}
        <div className="p-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            How to install this extension in Google Chrome:
          </p>
          <ol className="list-decimal list-inside text-[11px] text-blue-800 space-y-0.5 font-medium">
            <li>Open <code className="bg-blue-100 px-1 py-0.2 rounded font-mono">chrome://extensions</code> in Chrome URL bar</li>
            <li>Enable <strong>Developer mode</strong> (toggle switch top right)</li>
            <li>Click <strong>Load unpacked</strong> and select your extension build directory</li>
          </ol>
        </div>

        {/* Code View Tab Header */}
        <div className="flex items-center justify-between px-4 pt-3 border-b border-slate-200 bg-slate-50 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-3 py-1.5 font-semibold rounded-t-lg border-b-2 transition-all ${
                activeTab === 'manifest'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              manifest.json
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`px-3 py-1.5 font-semibold rounded-t-lg border-b-2 transition-all ${
                activeTab === 'background'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              background.js
            </button>
            <button
              onClick={() => setActiveTab('popup')}
              className={`px-3 py-1.5 font-semibold rounded-t-lg border-b-2 transition-all ${
                activeTab === 'popup'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              popup.html
            </button>
          </div>

          <button
            onClick={handleDownloadFiles}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors mb-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download manifest.json</span>
          </button>
        </div>

        {/* Code Content Editor Area */}
        <div className="flex-1 bg-slate-900 text-slate-100 p-4 overflow-y-auto font-mono text-xs relative">
          <div className="absolute right-6 top-6">
            <button
              onClick={() => copyToClipboard(
                activeTab === 'manifest' ? MANIFEST_JSON : activeTab === 'background' ? BACKGROUND_JS : POPUP_HTML,
                activeTab
              )}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-sans transition-colors border border-slate-700"
            >
              {copiedFile === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFile === activeTab ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="whitespace-pre-wrap leading-relaxed">
            {activeTab === 'manifest' && MANIFEST_JSON}
            {activeTab === 'background' && BACKGROUND_JS}
            {activeTab === 'popup' && POPUP_HTML}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
