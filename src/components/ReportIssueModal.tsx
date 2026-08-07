import React, { useState } from 'react';
import { X, Mail, Copy, Check, Bug, Send, ShieldAlert, Terminal } from 'lucide-react';
import { ExtensionSettings } from '../types';

interface ReportIssueModalProps {
  onClose: () => void;
  settings: ExtensionSettings;
  cachedCount: number;
  historyCount: number;
  currentQuery: string;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  onClose,
  settings,
  cachedCount,
  historyCount,
  currentQuery,
}) => {
  const [issueSummary, setIssueSummary] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Generate debug diagnostics payload
  const debugDiagnostics = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    appVersion: 'v2.4.0-chrome-ext',
    settings: {
      jiraUrl: settings.jiraUrl,
      userEmail: settings.userEmail,
      projectKey: settings.projectKey,
      maxCachedTickets: settings.maxCachedTickets,
      autoSyncInterval: settings.autoSyncIntervalMinutes,
      defaultViewMode: settings.defaultViewMode,
      theme: settings.theme,
      apiKeyConfigured: !!settings.jiraApiKey,
    },
    stateStats: {
      cachedTicketsCount: cachedCount,
      searchHistoryCount: historyCount,
      activeQuery: currentQuery || '(none)',
    },
  };

  const formattedDiagnosticsJson = JSON.stringify(debugDiagnostics, null, 2);

  const mailtoSubject = encodeURIComponent(`[Jira Extension Issue Report] ${issueSummary || 'Bug or Sync Error'}`);
  const mailtoBody = encodeURIComponent(
    `Developer Support Request\n\n` +
    `Summary: ${issueSummary || 'Issue Report'}\n\n` +
    `User Notes:\n${issueDescription || 'No additional details provided.'}\n\n` +
    `--- System & Extension Debug State ---\n` +
    `${formattedDiagnosticsJson}`
  );

  const mailtoUrl = `mailto:support@jira-quick-search-ext.internal?subject=${mailtoSubject}&body=${mailtoBody}`;

  const handleCopyDiagnostics = () => {
    navigator.clipboard.writeText(formattedDiagnosticsJson);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/30 text-rose-400 border border-rose-500/40 flex items-center justify-center">
              <Bug className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold flex items-center gap-2">
                <span>Report Issue to Developer</span>
                <span className="text-[9px] font-mono bg-rose-900 text-rose-200 px-1.5 py-0.5 rounded border border-rose-700">
                  Pre-filled Support Template
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Include settings and local diagnostic state for fast debugging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Issue Summary Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Issue Summary / Error Title
            </label>
            <input
              type="text"
              value={issueSummary}
              onChange={(e) => setIssueSummary(e.target.value)}
              placeholder="e.g. JQL search timing out or missing subtasks"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Details Textarea */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Additional Details / Steps to Reproduce
            </label>
            <textarea
              rows={3}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe what happened or copy error messages here..."
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Diagnostic Payload Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-500" />
                <span>Auto-Generated Debug Diagnostics</span>
              </span>
              <button
                type="button"
                onClick={handleCopyDiagnostics}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800"
              >
                {copiedPayload ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'Copied JSON' : 'Copy Diagnostics'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-900 text-slate-300 rounded-lg font-mono text-[10px] border border-slate-800 max-h-40 overflow-y-auto leading-relaxed select-all">
              {formattedDiagnosticsJson}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">API keys are automatically omitted for privacy.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <a
              href={mailtoUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Pre-filled Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
