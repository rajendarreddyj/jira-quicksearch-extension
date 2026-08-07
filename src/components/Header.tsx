import React from 'react';
import { ExtensionSettings, ActiveTab } from '../types';
import { 
  Search, 
  History, 
  Database, 
  Settings, 
  Wifi, 
  WifiOff, 
  Maximize2, 
  Minimize2, 
  Download,
  Layers,
  Github,
  Workflow,
  Activity,
  HelpCircle,
  Keyboard,
  Bell,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react';

interface HeaderProps {
  settings: ExtensionSettings;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onUpdateSettings: (newSettings: ExtensionSettings) => void;
  onOpenManifestModal: () => void;
  onOpenCiCdModal?: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenNotifications?: () => void;
  notificationsCount?: number;
  cachedCount: number;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  setActiveTab,
  onUpdateSettings,
  onOpenManifestModal,
  onOpenCiCdModal,
  onOpenShortcutsModal,
  onOpenNotifications,
  notificationsCount,
  cachedCount,
  historyCount,
}) => {
  const toggleViewMode = () => {
    onUpdateSettings({
      ...settings,
      viewMode: settings.viewMode === 'popup' ? 'full' : 'popup',
    });
  };

  const toggleOfflineMode = () => {
    onUpdateSettings({
      ...settings,
      isSimulatedOffline: !settings.isSimulatedOffline,
    });
  };

  const toggleTheme = () => {
    onUpdateSettings({
      ...settings,
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <header className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs dark:shadow-md transition-colors">
      {/* Top Banner Bar */}
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 text-xs">
        {/* Logo & App Title */}
        <div className="flex items-center gap-2 font-medium tracking-tight">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
            J
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Jira Quick Search</span>
          <span className="bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-mono border border-blue-200 dark:border-blue-500/30">
            v2.4
          </span>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-1.5">
          {/* Offline / Online Simulated Toggle */}
          <button
            onClick={toggleOfflineMode}
            title={settings.isSimulatedOffline ? "Click to simulate Online connection" : "Click to test Offline Mode behavior"}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              settings.isSimulatedOffline
                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-500/30'
                : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/30'
            }`}
          >
            {settings.isSimulatedOffline ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Offline Mode</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Online</span>
              </>
            )}
          </button>

          {/* Open in Tab / Popout Extension Button */}
          <button
            onClick={() => {
              if ((window as any).chrome?.tabs?.create) {
                (window as any).chrome.tabs.create({ url: window.location.href });
              } else {
                window.open(window.location.href, '_blank');
              }
            }}
            title="Open Extension in a New Tab / Expand View"
            className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md text-[11px] font-semibold transition-colors border border-blue-200 dark:border-blue-700/60 shadow-2xs"
          >
            <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Open Tab</span>
          </button>

          {/* View Mode Toggle (Popup vs Full Width) */}
          <button
            onClick={toggleViewMode}
            title={settings.viewMode === 'popup' ? 'Expand to Full Screen View' : 'Switch to Extension Popup View'}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            {settings.viewMode === 'popup' ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={settings.theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" />
            )}
          </button>

          {/* GitHub CI/CD Architecture & Release Button & Export Extension (Hidden when showDevToolsInHeader is false) */}
          {settings.showDevToolsInHeader !== false && (
            <>
              {onOpenCiCdModal && (
                <button
                  onClick={onOpenCiCdModal}
                  title="View GitHub Repository, Architecture & Chrome Web Store CI/CD"
                  className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-md text-[11px] font-medium transition-colors border border-blue-200 dark:border-blue-700/80 cursor-pointer"
                >
                  <Github className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">CI/CD & Arch</span>
                </button>
              )}

              <button
                onClick={onOpenManifestModal}
                title="Download / View Chrome Extension Manifest V3 files"
                className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-[11px] font-medium transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Download className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Export Ext</span>
              </button>
            </>
          )}

          {/* Pinned Ticket Updates Notification Bell */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              title="Pinned Tickets Live Update Notifications"
              className="relative p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold"
            >
              <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {!!notificationsCount && notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-slate-900 animate-pulse">
                  {notificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Keyboard Shortcuts Cheat Sheet Button */}
          {onOpenShortcutsModal && (
            <button
              onClick={onOpenShortcutsModal}
              title="View Keyboard Shortcuts Cheat Sheet (?)"
              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-bold"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="flex items-center justify-between px-1.5 sm:px-2 py-1 bg-slate-100/90 dark:bg-slate-900/90 text-xs overflow-x-auto whitespace-nowrap gap-1 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
            activeTab === 'search'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all relative ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
          {historyCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {historyCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cached')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all relative ${
            activeTab === 'cached'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Offline Cache</span>
          {cachedCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'cached' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400'
            }`}>
              {cachedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
            activeTab === 'activity'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Activity</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </nav>
    </header>
  );
};
