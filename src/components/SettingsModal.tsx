import React, { useState } from 'react';
import { ExtensionSettings } from '../types';
import { 
  Settings, 
  Trash2, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Key, 
  Globe, 
  FolderKanban, 
  HardDrive, 
  RefreshCw, 
  HelpCircle,
  Eye,
  EyeOff,
  Download,
  Upload,
  CheckCircle2,
  Moon,
  Sun,
  Palette
} from 'lucide-react';

interface SettingsModalProps {
  settings: ExtensionSettings;
  onSaveSettings: (newSettings: ExtensionSettings) => void;
  onClearCache: () => void;
  onClearHistory: () => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClearCache,
  onClearHistory,
  onClearAllData,
}) => {
  const [formData, setFormData] = useState<ExtensionSettings>({ ...settings });
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const handleChange = (field: keyof ExtensionSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    try {
      const response = await fetch('/api/jira/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraUrl: formData.jiraUrl,
          email: formData.userEmail,
          apiToken: formData.apiToken,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setTestStatus({
          loading: false,
          success: true,
          message: result.message || 'Successfully authenticated with Jira!',
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          message: result.message || 'Connection test failed. Check Jira URL or token.',
        });
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || 'Failed to connect to Jira endpoint.',
      });
    }
  };

  return (
    <div className="p-3.5 space-y-5 max-w-xl mx-auto">
      {/* Header Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Extension Settings</h3>
            <p className="text-[11px] text-slate-500">Configure Jira instance, cache thresholds, and local storage</p>
          </div>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved!
          </span>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Jira Connection Config Box */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Jira Server Credentials
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Atlassian REST API v2/v3</span>
          </div>

          {/* Jira URL */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Jira Instance Base URL
            </label>
            <input
              type="text"
              value={formData.jiraUrl}
              onChange={(e) => handleChange('jiraUrl', e.target.value)}
              placeholder="https://company.atlassian.net"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Project Key(s) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block flex items-center justify-between">
              <span>Project Key(s)</span>
              <span className="text-[10px] text-slate-400 font-normal">Comma-separated (e.g. PROJ, DEV, CORE)</span>
            </label>
            <input
              type="text"
              value={formData.projectKey}
              onChange={(e) => handleChange('projectKey', e.target.value)}
              placeholder="PROJ, DEV, CORE"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* User Email & API Token */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Atlassian User Email
              </label>
              <input
                type="email"
                value={formData.userEmail}
                onChange={(e) => handleChange('userEmail', e.target.value)}
                placeholder="dev@company.com"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block flex items-center justify-between">
                <span>API Token / PAT</span>
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  Get Token
                </a>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={formData.apiToken}
                  onChange={(e) => handleChange('apiToken', e.target.value)}
                  placeholder="Atlassian API token..."
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Connection Test Output */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus.loading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
            >
              {testStatus.loading ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>Test Connection</span>
            </button>

            {testStatus.message && (
              <span className={`text-[11px] font-semibold ${
                testStatus.success ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {testStatus.message}
              </span>
            )}
          </div>
        </div>

        {/* Appearance & Theme Settings Card */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              Appearance & Dark Mode Theme
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Tailwind Theme Engine</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Extension Theme</span>
              <span className="text-[10px] text-slate-500 block">Switch interface theme between Light and Dark mode</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => handleChange('theme', 'light')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                  formData.theme === 'light'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleChange('theme', 'dark')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                  formData.theme === 'dark'
                    ? 'bg-slate-900 text-amber-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cache & Performance Options */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              Offline Cache Thresholds
            </span>
          </div>

          {/* Max Cached Tickets Limit Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>Max Cached Tickets Limit</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                {formData.maxCachedTickets} tickets
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={formData.maxCachedTickets}
              onChange={(e) => handleChange('maxCachedTickets', parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              When ticket limit is reached, oldest cached tickets are automatically purged to prevent local browser memory overflow.
            </p>
          </div>

          {/* Auto Cache Toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Auto-Cache Searched Tickets</span>
              <span className="text-[10px] text-slate-400 block">Automatically store fetched Jira tickets for offline viewing</span>
            </div>
            <input
              type="checkbox"
              checked={formData.autoCacheOnSearch}
              onChange={(e) => handleChange('autoCacheOnSearch', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-0 accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Clear Local Data Options Section */}
      <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3">
        <div className="font-bold text-xs text-rose-800 flex items-center gap-1.5 border-b border-rose-200/80 pb-2">
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          Clear Local Data & Cache Options
        </div>

        <div className="space-y-2 text-xs">
          {/* Option 1: Clear Cached Tickets */}
          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-rose-100">
            <div>
              <span className="font-semibold text-slate-800 block">Purge Cached Tickets</span>
              <span className="text-[10px] text-slate-500 block">Clears all offline stored ticket details</span>
            </div>
            <button
              type="button"
              onClick={onClearCache}
              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold transition-colors border border-rose-200"
            >
              Clear Cache
            </button>
          </div>

          {/* Option 2: Clear Search History */}
          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-rose-100">
            <div>
              <span className="font-semibold text-slate-800 block">Clear Search Query History</span>
              <span className="text-[10px] text-slate-500 block">Deletes all saved and pinned search queries</span>
            </div>
            <button
              type="button"
              onClick={onClearHistory}
              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold transition-colors border border-rose-200"
            >
              Clear History
            </button>
          </div>

          {/* Option 3: Reset Everything */}
          <div className="flex items-center justify-between p-2 bg-rose-100/60 rounded-lg border border-rose-200">
            <div>
              <span className="font-bold text-rose-900 block">Reset All Local Storage</span>
              <span className="text-[10px] text-rose-700 block">Resets all settings, history, and ticket cache to default state</span>
            </div>

            {confirmClearAll ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllData();
                    setConfirmClearAll(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-xs"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold transition-colors shadow-xs"
              >
                Reset All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
