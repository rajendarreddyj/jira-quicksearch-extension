import React, { useState, useRef } from 'react';
import { ExtensionSettings } from '../types';
import { loadSearchHistory, saveSearchHistory, getCachedIssues, purgeStaleCachedIssues } from '../services/jiraService';
import {
  Settings,
  Trash2,
  Check,
  AlertTriangle,
  ShieldCheck,
  Globe,
  HardDrive,
  Eye,
  EyeOff,
  Download,
  Upload,
  CheckCircle2
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const [stalePurgedMsg, setStalePurgedMsg] = useState<string | null>(null);

  const handlePurgeStaleNow = () => {
    purgeStaleCachedIssues(30);
    onClearCache(); // refresh list
    setStalePurgedMsg('Stale data cleanup complete! Retained recent tickets.');
    setTimeout(() => setStalePurgedMsg(null), 3500);
  };

  const handleExportJSON = () => {
    const { apiToken: _excludedToken, ...safeSettings } = formData;
    const exportData = {
      settings: safeSettings,
      tokenExcluded: true,
      searchHistory: loadSearchHistory(),
      cachedTicketsCount: getCachedIssues().length,
      exportedAt: new Date().toISOString(),
      version: '2.5.0',
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jira_extension_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);

      if (parsed && typeof parsed === 'object') {
        const newSettings = parsed.settings || parsed;
        if (newSettings.jiraUrl !== undefined || newSettings.projectKey !== undefined) {
          const safeImportedSettings: Partial<ExtensionSettings> = { ...newSettings };
          delete (safeImportedSettings as any).apiToken;

          const merged: ExtensionSettings = {
            ...formData,
            ...safeImportedSettings,
          };

          setFormData(merged);
          onSaveSettings(merged);

          if (Array.isArray(parsed.searchHistory)) {
            saveSearchHistory(parsed.searchHistory);
          }

          const importedWithoutToken = parsed.tokenExcluded === true;
          setImportStatus({
            success: true,
            message: importedWithoutToken
              ? 'Settings and search history imported. API token is excluded from backup; re-enter token or use OAuth.'
              : 'Settings and search history imported. Any token fields in backup were ignored for security.',
          });
          setTimeout(() => setImportStatus(null), 5000);
        } else {
          setImportStatus({
            success: false,
            message: 'Invalid backup format. Required settings keys missing.',
          });
        }
      } else {
        setImportStatus({
          success: false,
          message: 'Invalid backup format. Expected a JSON object.',
        });
      }
    } catch {
      setImportStatus({
        success: false,
        message: 'Failed to parse JSON backup file.',
      });
    }

    e.target.value = '';
  };

  const handleChange = (field: keyof ExtensionSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const testJiraConnectionDirect = async () => {
    const cleanUrl = (formData.jiraUrl || '').replace(/\/+$/, '');
    const auth = btoa(`${formData.userEmail}:${formData.apiToken}`);

    const endpoints = [`${cleanUrl}/rest/api/3/myself`, `${cleanUrl}/rest/api/2/myself`];

    for (const targetUrl of endpoints) {
      const response = await fetch(targetUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok) continue;

      const user = await response.json();
      return {
        success: true,
        message: `Connected successfully as ${user.displayName || user.emailAddress || 'Jira User'}`,
      };
    }

    throw new Error('Failed to authenticate with Jira. Check Jira URL, email, API token, and project access.');
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    try {
      const isExtensionRuntime = typeof window !== 'undefined' && !!(window as any).chrome?.runtime?.id;

      if (isExtensionRuntime) {
        const result = await testJiraConnectionDirect();
        setTestStatus({ loading: false, success: true, message: result.message });
      } else {
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
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Extension Settings</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure Jira instance, cache thresholds, and local storage</p>
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
        <div className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/60 pb-2">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Jira Server Credentials
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Atlassian REST API v2/v3</span>
          </div>

          {/* Jira URL */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
              Jira Instance Base URL
            </label>
            <input
              type="text"
              value={formData.jiraUrl}
              onChange={(e) => handleChange('jiraUrl', e.target.value)}
              placeholder="https://company.atlassian.net"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {/* Project Key(s) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block flex items-center justify-between">
              <span>Project Key(s)</span>
              <span className="text-[10px] text-slate-400 font-normal">Comma-separated (e.g. PROJ, DEV, CORE)</span>
            </label>
            <input
              type="text"
              value={formData.projectKey}
              onChange={(e) => handleChange('projectKey', e.target.value)}
              placeholder="PROJ, DEV, CORE"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {/* User Email & API Token */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                Atlassian User Email
              </label>
              <input
                type="email"
                value={formData.userEmail}
                onChange={(e) => handleChange('userEmail', e.target.value)}
                placeholder="dev@company.com"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block flex items-center justify-between">
                <span>API Token / PAT</span>
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
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
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                API tokens are excluded from JSON backups and stored in extension secure storage when available.
              </p>
              <p className="text-[10px] text-slate-400">
                OAuth 2.0 (Atlassian 3LO) is recommended over long-lived API tokens for stronger security.
              </p>
            </div>
          </div>

          {/* Connection Test Output */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus.loading}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 cursor-pointer"
            >
              {testStatus.loading ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-800 dark:border-t-slate-100 rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              )}
              <span>Test Connection</span>
            </button>

            {testStatus.message && (
              <span className={`text-[11px] font-semibold ${
                testStatus.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {testStatus.message}
              </span>
            )}
          </div>
        </div>

        {/* Cache & Performance Options */}
        <div className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/60 pb-2">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Offline Cache Thresholds
            </span>
          </div>

          {/* Max Cached Tickets Limit Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span>Max Cached Tickets Limit</span>
              <span className="font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-mono">
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
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Auto-Cache Searched Tickets</span>
              <span className="text-[10px] text-slate-400 block">Automatically store fetched Jira tickets for offline viewing</span>
            </div>
            <input
              type="checkbox"
              checked={formData.autoCacheOnSearch}
              onChange={(e) => handleChange('autoCacheOnSearch', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-0 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Enable Auto-Refresh Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Enable Auto-Refresh</span>
              <span className="text-[10px] text-slate-400 block">Triggers a background refresh of cached tickets every 15 minutes</span>
            </div>
            <input
              type="checkbox"
              checked={formData.enableAutoRefresh ?? true}
              onChange={(e) => handleChange('enableAutoRefresh', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-0 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Stale Data Cleanup Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Stale Data Cleanup (&gt;30 Days)</span>
              <span className="text-[10px] text-slate-400 block">Automatically purge cached tickets that have not been viewed or updated in more than 30 days</span>
            </div>
            <input
              type="checkbox"
              checked={formData.enableStaleCleanup ?? true}
              onChange={(e) => handleChange('enableStaleCleanup', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-0 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Group Cached Tickets Setting */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Group Cached Tickets In Manager
            </label>
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => handleChange('groupCachedBy', 'none')}
                className={`px-1.5 py-1.5 rounded-lg text-xs font-semibold border text-center transition-all ${
                  (formData.groupCachedBy || 'none') === 'none'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => handleChange('groupCachedBy', 'status')}
                className={`px-1.5 py-1.5 rounded-lg text-xs font-semibold border text-center transition-all ${
                  formData.groupCachedBy === 'status'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Status
              </button>
              <button
                type="button"
                onClick={() => handleChange('groupCachedBy', 'project')}
                className={`px-1.5 py-1.5 rounded-lg text-xs font-semibold border text-center transition-all ${
                  formData.groupCachedBy === 'project'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Project
              </button>
              <button
                type="button"
                onClick={() => handleChange('groupCachedBy', 'priority')}
                className={`px-1.5 py-1.5 rounded-lg text-xs font-semibold border text-center transition-all ${
                  formData.groupCachedBy === 'priority'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Priority
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Automatically organizes offline cached issues under collapsable group headings in the Cached Tickets tab.
            </p>
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

        {/* Multi-Device Sync & Export/Import JSON Card */}
        <div className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/60 pb-2">
            <span className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Backup & Multi-Device Synchronization
            </span>
            <span className="text-[10px] text-slate-400 font-normal">JSON Export/Import</span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Export your current extension settings and search history as a JSON file, or import from a file to sync across browser profiles or devices.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-blue-200 dark:border-blue-700/60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Settings & History JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-600"
            >
              <Upload className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Import Settings JSON</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>

          {importStatus && (
            <div className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
              importStatus.success
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {importStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>

      </form>

      {/* Clear Local Data Options Section */}
      <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-3">
        <div className="font-bold text-xs text-rose-800 dark:text-rose-300 flex items-center gap-1.5 border-b border-rose-200/80 dark:border-rose-900/40 pb-2">
          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          Clear Local Data &amp; Cache Options
        </div>

        <div className="space-y-2 text-xs">
          {/* Option 0: Purge Stale Tickets (>30d) */}
          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-rose-100 dark:border-slate-700">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Purge Stale Tickets (&gt;30 Days)</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Removes cached tickets not viewed or updated in 30+ days</span>
            </div>
            <button
              type="button"
              onClick={handlePurgeStaleNow}
              className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded text-[11px] font-semibold transition-colors border border-amber-200 dark:border-amber-700/60 cursor-pointer"
            >
              Purge Stale (&gt;30d)
            </button>
          </div>
          {stalePurgedMsg && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold px-2">{stalePurgedMsg}</p>
          )}

          {/* Option 1: Clear Cached Tickets */}
          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-rose-100 dark:border-slate-700">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Purge Cached Tickets</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Clears all offline stored ticket details</span>
            </div>
            <button
              type="button"
              onClick={onClearCache}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded text-[11px] font-semibold transition-colors border border-rose-200 dark:border-rose-800 cursor-pointer"
            >
              Clear Cache
            </button>
          </div>

          {/* Option 2: Clear Search History */}
          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-rose-100 dark:border-slate-700">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Clear Search Query History</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Deletes all saved and pinned search queries</span>
            </div>
            <button
              type="button"
              onClick={onClearHistory}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded text-[11px] font-semibold transition-colors border border-rose-200 dark:border-rose-800 cursor-pointer"
            >
              Clear History
            </button>
          </div>

          {/* Option 3: Reset Everything */}
          <div className="flex items-center justify-between p-2 bg-rose-100/60 dark:bg-rose-950/60 rounded-lg border border-rose-200 dark:border-rose-900/80">
            <div>
              <span className="font-bold text-rose-900 dark:text-rose-200 block">Reset All Local Storage</span>
              <span className="text-[10px] text-rose-700 dark:text-rose-300 block">Resets all settings, history, and ticket cache to default state</span>
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
