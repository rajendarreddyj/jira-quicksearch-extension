import React, { useState } from 'react';
import { SearchHistoryItem } from '../types';
import { History, Pin, Trash2, ArrowRight, Search, Clock, Check, Download, Copy } from 'lucide-react';

interface HistorySectionProps {
  history: SearchHistoryItem[];
  onSelectQuery: (query: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  onSelectQuery,
  onTogglePin,
  onDeleteHistoryItem,
  onClearAllHistory,
}) => {
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [copiedJqlId, setCopiedJqlId] = useState<string | null>(null);

  const getFullJql = (item: SearchHistoryItem) => {
    if (item.isJql || item.query.toLowerCase().includes('project =') || item.query.toLowerCase().includes('assignee =') || item.query.toLowerCase().includes('status =') || item.query.toLowerCase().includes('order by')) {
      return item.query;
    }
    if (/^[A-Z0-9]+-\d+$/i.test(item.query.trim())) {
      return `issueKey = "${item.query.trim().toUpperCase()}"`;
    }
    const proj = item.projectKey || 'PROJ';
    return `project in (${proj}) AND text ~ "${item.query}"`;
  };

  const handleCopyJql = (item: SearchHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const jql = getFullJql(item);
    navigator.clipboard.writeText(jql);
    setCopiedJqlId(item.id);
    setTimeout(() => setCopiedJqlId(null), 2000);
  };

  const handleDownloadHistoryJSON = () => {
    if (history.length === 0) return;
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jira_search_history_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const pinnedItems = history.filter(h => h.pinned);
  const recentItems = history.filter(h => !h.pinned);

  if (history.length === 0) {
    return (
      <div className="p-8 text-center space-y-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl my-4 mx-3 shadow-2xs">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-full flex items-center justify-center mx-auto">
          <History className="w-6 h-6 text-slate-400 dark:text-slate-300" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">No Search History</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Your search query history will be automatically recorded here for quick 1-click access and query re-runs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Search Query History ({history.length})
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Quickly re-execute frequent JQL searches or ticket lookups</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download History Button */}
          <button
            type="button"
            onClick={handleDownloadHistoryJSON}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            title="Export search query history to a JSON file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download History</span>
          </button>

          {confirmClear ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onClearAllHistory();
                  setConfirmClear(false);
                }}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
              >
                Confirm Clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-medium rounded hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-medium flex items-center gap-1 p-1 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Pinned Queries Section */}
      {pinnedItems.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            Pinned Queries ({pinnedItems.length})
          </div>
          <div className="space-y-1.5">
            {pinnedItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-lg flex items-center justify-between gap-2 hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-colors group"
              >
                <div 
                  onClick={() => onSelectQuery(item.query)}
                  className="flex-1 cursor-pointer min-w-0"
                >
                  <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {item.query}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{formatTime(item.timestamp)}</span>
                    <span>•</span>
                    <span>{item.resultCount} results</span>
                    {item.projectKey && (
                      <span className="bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1 py-0.2 rounded font-semibold">
                        {item.projectKey}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleCopyJql(item, e)}
                    title="Copy full JQL query string to clipboard"
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/50 flex items-center gap-1 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    {copiedJqlId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Copy JQL</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onTogglePin(item.id)}
                    title="Unpin query"
                    className="p-1 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/50 cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5 fill-amber-600 dark:fill-amber-400" />
                  </button>
                  <button
                    onClick={() => onSelectQuery(item.query)}
                    title="Run Query"
                    className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded hover:bg-blue-100/50 dark:hover:bg-blue-900/50 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    title="Delete item"
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent History Items */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Recent Searches ({recentItems.length})
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs overflow-hidden">
          {recentItems.map((item) => (
            <div
              key={item.id}
              className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors group"
            >
              <div 
                onClick={() => onSelectQuery(item.query)}
                className="flex-1 cursor-pointer min-w-0"
              >
                <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {item.query}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">
                  <span>{formatTime(item.timestamp)}</span>
                  <span>•</span>
                  <span>{item.resultCount} results</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => handleCopyJql(item, e)}
                  title="Copy full JQL query string to clipboard"
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  {copiedJqlId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      <span className="hidden sm:inline">Copy JQL</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onTogglePin(item.id)}
                  title="Pin query to top"
                  className="p-1 text-slate-300 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onSelectQuery(item.query)}
                  title="Run Search"
                  className="p-1 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/40 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteHistoryItem(item.id)}
                  title="Delete"
                  className="p-1 text-slate-300 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
