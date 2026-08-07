import React from 'react';
import { SearchHistoryItem } from '../types';
import { History, Pin, Trash2, ArrowRight, Search, Clock, Check } from 'lucide-react';

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
      <div className="p-8 text-center space-y-3 bg-white border border-slate-200 rounded-xl my-4 mx-3 shadow-2xs">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <History className="w-6 h-6 text-slate-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">No Search History</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Your search query history will be automatically recorded here for quick 1-click access and query re-runs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            Search Query History ({history.length})
          </h3>
          <p className="text-[11px] text-slate-500">Quickly re-execute frequent JQL searches or ticket lookups</p>
        </div>

        {confirmClear ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClearAllHistory();
                setConfirmClear(false);
              }}
              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded transition-colors"
            >
              Confirm Clear
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-medium rounded hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 p-1 hover:bg-rose-50 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Pinned Queries Section */}
      {pinnedItems.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            Pinned Queries ({pinnedItems.length})
          </div>
          <div className="space-y-1.5">
            {pinnedItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-lg flex items-center justify-between gap-2 hover:bg-amber-100/50 transition-colors group"
              >
                <div 
                  onClick={() => onSelectQuery(item.query)}
                  className="flex-1 cursor-pointer min-w-0"
                >
                  <p className="text-xs font-mono font-bold text-slate-800 truncate group-hover:text-blue-700">
                    {item.query}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span>{formatTime(item.timestamp)}</span>
                    <span>•</span>
                    <span>{item.resultCount} results</span>
                    {item.projectKey && (
                      <span className="bg-amber-200/60 text-amber-800 px-1 py-0.2 rounded font-semibold">
                        {item.projectKey}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onTogglePin(item.id)}
                    title="Unpin query"
                    className="p-1 text-amber-700 hover:text-amber-900 rounded hover:bg-amber-200/50"
                  >
                    <Pin className="w-3.5 h-3.5 fill-amber-600" />
                  </button>
                  <button
                    onClick={() => onSelectQuery(item.query)}
                    title="Run Query"
                    className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100/50"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    title="Delete item"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
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
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Recent Searches ({recentItems.length})
        </div>
        <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          {recentItems.map((item) => (
            <div
              key={item.id}
              className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors group"
            >
              <div 
                onClick={() => onSelectQuery(item.query)}
                className="flex-1 cursor-pointer min-w-0"
              >
                <p className="text-xs font-mono font-semibold text-slate-800 truncate group-hover:text-blue-600">
                  {item.query}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span>{formatTime(item.timestamp)}</span>
                  <span>•</span>
                  <span>{item.resultCount} results</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onTogglePin(item.id)}
                  title="Pin query to top"
                  className="p-1 text-slate-300 hover:text-amber-600 rounded hover:bg-slate-100"
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onSelectQuery(item.query)}
                  title="Run Search"
                  className="p-1 text-slate-400 group-hover:text-blue-600 rounded hover:bg-blue-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteHistoryItem(item.id)}
                  title="Delete"
                  className="p-1 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50"
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
