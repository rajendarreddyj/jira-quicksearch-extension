import React, { useState } from 'react';
import { JiraIssue, ExtensionSettings, CacheStats } from '../types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  HardDrive, 
  CheckCircle2, 
  ChevronRight, 
  AlertTriangle,
  Zap,
  Info,
  Download,
  FileSpreadsheet,
  PieChart as PieChartIcon
} from 'lucide-react';

interface CachedTicketsManagerProps {
  cachedIssues: JiraIssue[];
  cacheStats: CacheStats;
  settings: ExtensionSettings;
  onSelectIssue: (issue: JiraIssue) => void;
  onRemoveFromCache: (key: string) => void;
  onClearAllCache: () => void;
  onUpdateSettings: (newSettings: ExtensionSettings) => void;
  onSyncAndRefresh?: () => Promise<void> | void;
}

export const CachedTicketsManager: React.FC<CachedTicketsManagerProps> = ({
  cachedIssues,
  cacheStats,
  settings,
  onSelectIssue,
  onRemoveFromCache,
  onClearAllCache,
  onUpdateSettings,
  onSyncAndRefresh,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleSyncClick = async () => {
    if (!onSyncAndRefresh) return;
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      await onSyncAndRefresh();
      setSyncStatusMsg('Sync complete! Local cache updated with latest server state.');
    } catch (err) {
      setSyncStatusMsg('Sync failed or completed with offline fallback.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  // Active grouping calculation
  const percentageUsed = Math.min(100, Math.round((cacheStats.totalCached / (cacheStats.maxLimit || 1)) * 100));
  const activeGroupMode = settings.groupCachedBy || 'none';

  const groupedIssues = React.useMemo(() => {
    if (activeGroupMode === 'none') return null;

    const groups: Record<string, JiraIssue[]> = {};
    cachedIssues.forEach((issue) => {
      let groupKey = 'Other';
      if (activeGroupMode === 'status') {
        groupKey = issue.status?.name || 'Unassigned Status';
      } else if (activeGroupMode === 'project') {
        groupKey = issue.key.split('-')[0]?.toUpperCase() || 'Other Project';
      } else if (activeGroupMode === 'priority') {
        const pName = (issue.priority?.name || '').toLowerCase();
        if (pName.includes('highest') || pName.includes('high') || pName.includes('blocker') || pName.includes('critical')) {
          groupKey = '🔥 High Priority Swimlane';
        } else if (pName.includes('medium') || pName.includes('normal')) {
          groupKey = '⚡ Medium Priority Swimlane';
        } else if (pName.includes('low') || pName.includes('minor') || pName.includes('trivial')) {
          groupKey = '☕ Low Priority Swimlane';
        } else {
          groupKey = `${issue.priority?.name || 'Unassigned'} Priority Swimlane`;
        }
      }
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(issue);
    });

    return groups;
  }, [cachedIssues, activeGroupMode]);

  // Status Distribution calculation for Recharts
  const statusCounts = cachedIssues.reduce((acc, issue) => {
    const sName = issue.status?.name || 'Unknown';
    acc[sName] = (acc[sName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const STATUS_COLORS: Record<string, string> = {
    'To Do': '#64748b',
    'In Progress': '#2563eb',
    'In Review': '#7c3aed',
    'Testing': '#d97706',
    'Done': '#10b981',
    'Closed': '#059669',
  };

  const chartData = Object.entries(statusCounts).map(([name, count]) => ({
    name,
    value: count,
    color: STATUS_COLORS[name] || '#64748b',
  }));

  const formatKB = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const handleExportCSV = () => {
    if (cachedIssues.length === 0) return;

    const headers = ['Key', 'Summary', 'Status', 'Priority', 'Issue Type', 'Assignee', 'Reporter', 'Story Points', 'Updated Date', 'Jira URL'];
    
    const rows = cachedIssues.map(issue => [
      issue.key,
      `"${(issue.summary || '').replace(/"/g, '""')}"`,
      `"${issue.status?.name || ''}"`,
      `"${issue.priority?.name || ''}"`,
      `"${issue.issueType?.name || ''}"`,
      `"${(issue.assignee?.name || '').replace(/"/g, '""')}"`,
      `"${(issue.reporter?.name || '').replace(/"/g, '""')}"`,
      issue.storyPoints ?? '',
      `"${issue.updated || ''}"`,
      `"${issue.url || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jira_cached_tickets_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 space-y-4">
      {/* Cache Usage Dashboard Card */}
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl p-3.5 space-y-3 shadow-2xs dark:shadow-md border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Offline Ticket Cache Storage</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Stores ticket details locally for instant offline access</p>
            </div>
          </div>

          {/* Sync & Refresh Button & Auto Cache Toggle */}
          <div className="flex items-center gap-2">
            {onSyncAndRefresh && (
              <button
                type="button"
                onClick={handleSyncClick}
                disabled={isSyncing}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs border border-blue-500 disabled:opacity-50"
                title="Explicitly re-fetch and overwrite local cached data with latest server state"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync & Refresh'}</span>
              </button>
            )}

            {/* Auto Cache Toggle Switch */}
            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={settings.autoCacheOnSearch}
                onChange={(e) => onUpdateSettings({ ...settings, autoCacheOnSearch: e.target.checked })}
                className="w-3 h-3 text-blue-600 rounded focus:ring-0 accent-blue-500 cursor-pointer"
              />
              <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">Auto-Cache</span>
            </label>
          </div>
        </div>

        {syncStatusMsg && (
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}

        {/* Storage Bar Gauge */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <span>Capacity Used: {cacheStats.totalCached} / {cacheStats.maxLimit} Tickets ({percentageUsed}%)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">{formatKB(cacheStats.estimatedBytes)}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700/80">
            <div
              className={`h-full transition-all duration-300 ${
                percentageUsed > 90 ? 'bg-rose-500' : percentageUsed > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${percentageUsed}%` }}
            />
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
          <span>Oldest Cached: {formatTime(cacheStats.oldestTicketDate)}</span>
          <span>Newest: {formatTime(cacheStats.newestTicketDate)}</span>
        </div>
      </div>

      {/* Recharts Ticket Status Distribution Card */}
      {cachedIssues.length > 0 && (
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-3.5 space-y-3 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-100">
              <PieChartIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Cached Tickets Status Breakdown</span>
            </div>
            <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              Recharts Analytics
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Recharts Donut / Pie Chart */}
            <div className="h-36 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={48}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderColor: '#334155', 
                      borderRadius: '8px', 
                      color: '#f8fafc',
                      fontSize: '11px',
                      padding: '4px 8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Status Breakdown Legend & Counts */}
            <div className="space-y-1.5">
              {chartData.map((item) => {
                const countVal = Number(item.value) || 0;
                const pct = Math.round((countVal / Math.max(1, cachedIssues.length)) * 100);
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{item.value}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-medium text-[10px]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Action Bar & Grouping Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            Cached Tickets ({cachedIssues.length})
          </h4>

          {/* Grouping Mode Quick Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, groupCachedBy: 'none' })}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                activeGroupMode === 'none'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Flat
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, groupCachedBy: 'status' })}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                activeGroupMode === 'status'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Status
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, groupCachedBy: 'project' })}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                activeGroupMode === 'project'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Project
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, groupCachedBy: 'priority' })}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                activeGroupMode === 'priority'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Priority
            </button>
          </div>
        </div>

        {cachedIssues.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Refresh All Button (Background Fetch from Jira API) */}
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-[11px] font-bold rounded-md transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
              title="Trigger background fetch to update details of all currently cached tickets from the Jira API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Refreshing All...' : 'Refresh All'}</span>
            </button>

            {/* Export to CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-md transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
              title="Export offline cached Jira tickets to a CSV file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {confirmClear ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    onClearAllCache();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded transition-colors shadow-xs cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-medium rounded hover:bg-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 p-1 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Clear all cached tickets"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Purge All</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* List of Cached Tickets (Flat vs Grouped) */}
      {cachedIssues.length === 0 ? (
        <div className="p-8 text-center space-y-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-800/80">
            <Database className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">No Tickets Cached Offline</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              When you search or inspect tickets, they will automatically be cached locally so you can view full issue descriptions and comments even without an internet connection.
            </p>
          </div>
        </div>
      ) : groupedIssues ? (
        /* Grouped Ticket Layout */
        <div className="space-y-3">
          {Object.entries(groupedIssues).map(([groupTitle, issues]) => (
            <div key={groupTitle} className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-50 dark:bg-slate-800 px-3.5 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>{activeGroupMode === 'status' ? `Status: ${groupTitle}` : `Project: ${groupTitle}`}</span>
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  {issues.length} {issues.length === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {issues.map((issue) => (
                  <div
                    key={issue.key}
                    className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div 
                      onClick={() => onSelectIssue(issue)}
                      className="flex-1 cursor-pointer min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:underline">
                          {issue.key}
                        </span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-600">
                          {issue.status.name}
                        </span>
                      </div>
                      <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                        {issue.summary}
                      </h5>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">
                        Cached: {formatTime(issue.cachedAt)} • Assignee: {issue.assignee.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onSelectIssue(issue)}
                        title="View cached ticket details"
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 text-[11px] font-medium rounded flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-600 cursor-pointer"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => onRemoveFromCache(issue.key)}
                        title="Remove ticket from offline cache"
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat List Layout */
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs overflow-hidden">
          {cachedIssues.map((issue) => (
            <div
              key={issue.key}
              className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
            >
              <div 
                onClick={() => onSelectIssue(issue)}
                className="flex-1 cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:underline">
                    {issue.key}
                  </span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-600">
                    {issue.status.name}
                  </span>
                </div>
                <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                  {issue.summary}
                </h5>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">
                  Cached: {formatTime(issue.cachedAt)} • Assignee: {issue.assignee.name}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onSelectIssue(issue)}
                  title="View cached ticket details"
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 text-[11px] font-medium rounded flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-600 cursor-pointer"
                >
                  <span>View</span>
                  <ChevronRight className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onRemoveFromCache(issue.key)}
                  title="Remove ticket from offline cache"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
