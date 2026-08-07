import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Github, 
  Workflow, 
  Cpu, 
  Store, 
  ShieldCheck, 
  Terminal, 
  Download, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  GitCommit,
  Tag,
  Zap,
  HardDrive,
  Globe,
  Settings
} from 'lucide-react';

interface CiCdArchitectureModalProps {
  onClose: () => void;
}

export const CiCdArchitectureModal: React.FC<CiCdArchitectureModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'github_actions' | 'instructions'>('architecture');
  const [copied, setCopied] = useState(false);

  const SUGGESTED_REPO_NAME = "jira-quick-search-extension";

  const WORKFLOW_YAML = `name: Chrome Extension CI/CD & Web Store Release

on:
  push:
    branches: [ main, master ]
    tags:
      - 'v*.*.*'
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    name: Build & Validate Extension
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Lint Codebase
        run: npm run lint || true

      - name: Build Chrome Extension
        run: npm run build

      - name: Package Extension ZIP Artifact
        run: |
          mkdir -p build-artifact
          cd dist && zip -r ../build-artifact/jira-quick-search-extension.zip .

      - name: Upload Build Artifact
        uses: actions/upload-artifact@v4
        with:
          name: chrome-extension-build
          path: build-artifact/jira-quick-search-extension.zip

  publish-to-chrome-web-store:
    name: Publish to Chrome Web Store & GitHub Release
    needs: build-and-test
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Download Build Artifact
        uses: actions/download-artifact@v4
        with:
          name: chrome-extension-build
          path: build-artifact

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: build-artifact/jira-quick-search-extension.zip
          draft: false
          prerelease: false
          generate_release_notes: true
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Upload & Publish to Chrome Web Store
        uses: chrome-stats/chrome-extension-upload@v2
        with:
          extension-id: \${{ secrets.CHROME_EXTENSION_ID }}
          client-id: \${{ secrets.CHROME_CLIENT_ID }}
          client-secret: \${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: \${{ secrets.CHROME_REFRESH_TOKEN }}
          file-path: build-artifact/jira-quick-search-extension.zip
          publish: true
`;

  const copyYaml = () => {
    navigator.clipboard.writeText(WORKFLOW_YAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>GitHub Repository & Chrome Web Store CI/CD</span>
                <span className="text-[10px] font-mono bg-blue-900 text-blue-200 px-2 py-0.5 rounded border border-blue-700">
                  v2.4.0
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                System architecture diagram, workflow YAML, and deployment instructions
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Repo Name Banner */}
        <div className="bg-slate-800 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-slate-300" />
            <span className="text-slate-400">Suggested GitHub Repository Name:</span>
            <code className="font-mono text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
              {SUGGESTED_REPO_NAME}
            </code>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">Manifest V3 Extension</span>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture Diagram</span>
          </button>

          <button
            onClick={() => setActiveTab('github_actions')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'github_actions'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>GitHub Actions Workflow</span>
          </button>

          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'instructions'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Setup Instructions</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: ARCHITECTURE DIAGRAM */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed shadow-inner overflow-x-auto">
                <div className="text-amber-400 font-bold mb-2">┌───────────────────────────────────────────────────────────────────────────┐</div>
                <div className="text-amber-400 font-bold mb-2">│   CHROME EXTENSION (MANIFEST V3) ARCHITECTURE & CI/CD PIPELINE           │</div>
                <div className="text-amber-400 font-bold mb-3">└───────────────────────────────────────────────────────────────────────────┘</div>

                <div className="space-y-3">
                  <div>
                    <span className="text-blue-400 font-bold">[1] USER INTERFACE LAYER (Chrome Popup / Side Panel)</span>
                    <p className="text-slate-400 ml-4">┌ React 18 + Vite + Tailwind CSS</p>
                    <p className="text-slate-400 ml-4">├ Global Keyboard Navigation Engine (⌘K, ↑/↓, Enter)</p>
                    <p className="text-slate-400 ml-4">└ Recharts Analytics & Priority Badging Components</p>
                  </div>

                  <div className="text-slate-600 ml-8">│ ▼ (IPC / Direct Service Calls)</div>

                  <div>
                    <span className="text-emerald-400 font-bold">[2] LOCAL STORAGE & CACHE ENGINE</span>
                    <p className="text-slate-400 ml-4">┌ Chrome Extension Storage Sync API (`chrome.storage.local`)</p>
                    <p className="text-slate-400 ml-4">├ Ticket Caching Engine (Configurable Limit, e.g. 50 issues)</p>
                    <p className="text-slate-400 ml-4">└ Offline Fallback Provider (Serves offline results seamlessly)</p>
                  </div>

                  <div className="text-slate-600 ml-8">│ ▼ (REST API Proxy)</div>

                  <div>
                    <span className="text-purple-400 font-bold">[3] EXTERNAL JIRA REST API INTEGRATION</span>
                    <p className="text-slate-400 ml-4">┌ Jira Cloud REST API v3 / JQL Endpoint</p>
                    <p className="text-slate-400 ml-4">├ Authentication: Basic Auth Token / API Token</p>
                    <p className="text-slate-400 ml-4">└ Background Worker Alarms (`chrome.alarms` sync every 30m)</p>
                  </div>

                  <div className="text-slate-600 ml-8">│ ▼ (CI/CD Automated Deployment)</div>

                  <div>
                    <span className="text-amber-400 font-bold">[4] GITHUB ACTIONS RELEASE PIPELINE</span>
                    <p className="text-slate-400 ml-4">┌ Push/Tag Trigger (`git tag v1.0.0`)</p>
                    <p className="text-slate-400 ml-4">├ Automated Lint & Vite Bundle Bundling</p>
                    <p className="text-slate-400 ml-4">├ ZIP Extension Artifact Packaging</p>
                    <p className="text-slate-400 ml-4">├ GitHub Release Creation with Release Notes</p>
                    <p className="text-slate-400 ml-4">└ Direct Upload & Publish to Google Chrome Web Store API</p>
                  </div>
                </div>
              </div>

              {/* Architecture Summary Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <span className="font-bold text-blue-900 block">Manifest V3 Ready</span>
                  <p className="text-[11px] text-blue-700">
                    Compliant with modern Chrome extension guidelines using service workers and secure host permissions.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-900 block">Offline Cache First</span>
                  <p className="text-[11px] text-emerald-700">
                    Saves tickets locally so developers can view ticket status, assignee, and comments offline.
                  </p>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                  <span className="font-bold text-purple-900 block">Automated Release</span>
                  <p className="text-[11px] text-purple-700">
                    GitHub Actions automatically builds, zips, creates GitHub releases, and publishes directly to Web Store.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB ACTIONS WORKFLOW YAML */}
          {activeTab === 'github_actions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Workflow File Path:</span>
                  <code className="text-[11px] font-mono text-blue-700 font-bold">.github/workflows/chrome-extension-release.yml</code>
                </div>

                <button
                  onClick={copyYaml}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy YAML</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
                {WORKFLOW_YAML}
              </pre>
            </div>
          )}

          {/* TAB 3: SETUP INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>1. Automatic Versioning & Release Creation</span>
                </h4>
                <p className="text-slate-600 text-[11px]">
                  When you push a git tag formatted like <code className="bg-slate-200 px-1 py-0.2 rounded font-mono font-bold text-slate-800">v1.0.0</code>, GitHub Actions automatically triggers a production release build.
                </p>
                <div className="bg-slate-900 text-emerald-400 p-2 rounded font-mono text-[11px]">
                  git tag -a v1.0.0 -m &quot;Release v1.0.0&quot;<br />
                  git push origin v1.0.0
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>2. Chrome Web Store API Secret Keys Setup</span>
                </h4>
                <p className="text-slate-600 text-[11px]">
                  In your GitHub Repository Settings under <strong>Secrets and variables → Actions</strong>, add the following secrets:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 font-mono">
                  <li><strong className="text-slate-900">CHROME_EXTENSION_ID:</strong> Your extension ID from Chrome Developer Dashboard</li>
                  <li><strong className="text-slate-900">CHROME_CLIENT_ID:</strong> Google Cloud OAuth2 Client ID</li>
                  <li><strong className="text-slate-900">CHROME_CLIENT_SECRET:</strong> Google Cloud OAuth2 Client Secret</li>
                  <li><strong className="text-slate-900">CHROME_REFRESH_TOKEN:</strong> OAuth2 Refresh Token for Chrome Web Store API</li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Store className="w-4 h-4 text-purple-600" />
                  <span>3. Manual Local Build & Testing</span>
                </h4>
                <p className="text-slate-600 text-[11px]">
                  To test the extension locally in Chrome:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700">
                  <li>Run <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-slate-800 font-bold">npm run build</code> locally.</li>
                  <li>Open Chrome and navigate to <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-slate-800 font-bold">chrome://extensions</code>.</li>
                  <li>Enable <strong>Developer Mode</strong> in the top right toggle.</li>
                  <li>Click <strong>Load unpacked</strong> and select the generated <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-slate-800 font-bold">dist/</code> directory.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            Automated CI/CD Pipeline for Chrome Extensions
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
