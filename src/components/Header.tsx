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
  Keyboard
} from 'lucide-react';

interface HeaderProps {
  settings: ExtensionSettings;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onUpdateSettings: (newSettings: ExtensionSettings) => void;
  onOpenManifestModal: () => void;
  onOpenCiCdModal?: () => void;
  onOpenShortcutsModal?: () => void;
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

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner Bar */}
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-slate-800/80 text-xs">
        {/* Logo & App Title */}
        <div className="flex items-center gap-2 font-medium tracking-tight">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
            J
          </div>
          <span className="font-semibold text-slate-100 text-sm">Jira Quick Search</span>
          <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-mono border border-blue-500/30">
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
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {settings.isSimulatedOffline ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Offline Mode</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Online</span>
              </>
            )}
          </button>

          {/* View Mode Toggle (Popup vs Full Width) */}
          <button
            onClick={toggleViewMode}
            title={settings.viewMode === 'popup' ? 'Expand to Full Screen View' : 'Switch to Extension Popup View'}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
          >
            {settings.viewMode === 'popup' ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* GitHub CI/CD Architecture & Release Button */}
          {onOpenCiCdModal && (
            <button
              onClick={onOpenCiCdModal}
              title="View GitHub Repository, Architecture & Chrome Web Store CI/CD"
              className="flex items-center gap-1 px-2 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded-md text-[11px] font-medium transition-colors border border-blue-700/80"
            >
              <Github className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">CI/CD & Arch</span>
            </button>
          )}

          {/* Export Extension Zip/Manifest */}
          <button
            onClick={onOpenManifestModal}
            title="Download / View Chrome Extension Manifest V3 files"
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium transition-colors border border-slate-700"
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Export Ext</span>
          </button>

          {/* Keyboard Shortcuts Cheat Sheet Button */}
          {onOpenShortcutsModal && (
            <button
              onClick={onOpenShortcutsModal}
              title="View Keyboard Shortcuts Cheat Sheet (?)"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs transition-colors border border-slate-700 flex items-center justify-center font-mono font-bold"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="flex items-center justify-around px-2 py-1 bg-slate-900/90 text-xs">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
            activeTab === 'search'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
          {historyCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
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
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Offline Cache</span>
          {cachedCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'cached' ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400'
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
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </nav>
    </header>
  );
};
