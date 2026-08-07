import React, { useState, useEffect } from 'react';
import { JiraIssue } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Database, 
  ExternalLink, 
  User, 
  MessageSquare,
  Tag,
  ChevronRight,
  Sparkles,
  Pin,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  Keyboard,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  ListFilter,
  Target,
  ArrowUpDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface IssueListProps {
  issues: JiraIssue[];
  onSelectIssue: (issue: JiraIssue) => void;
  onTogglePinTicket?: (key: string) => void;
  onBulkPin?: (keys: string[]) => void;
  onBulkRemoveFromCache?: (keys: string[]) => void;
  isOfflineResult: boolean;
  searchQuery: string;
}

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  onSelectIssue,
  onTogglePinTicket,
  onBulkPin,
  onBulkRemoveFromCache,
  isOfflineResult,
  searchQuery,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'updated' | 'priority' | 'created' | 'assignee'>('updated');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Priority weight map for sorting
  const getPriorityWeight = (pName?: string) => {
    const p = (pName || '').toLowerCase();
    if (p === 'highest' || p === 'critical') return 5;
    if (p === 'high') return 4;
    if (p === 'medium') return 3;
    if (p === 'low') return 2;
    return 1;
  };

  // Filter & Sort issues
  const filteredIssues = issues
    .filter((issue) => {
      // Priority filter
      if (priorityFilter !== 'ALL') {
        const p = (issue.priority?.name || '').toLowerCase();
        const filterP = priorityFilter.toLowerCase();
        if (filterP === 'highest' && (p !== 'highest' && p !== 'critical')) return false;
        if (filterP !== 'highest' && p !== filterP) return false;
      }

      // Focus Mode filter
      if (isFocusMode) {
        const isPinned = !!issue.isPinned;
        const assigneeName = (issue.assignee?.name || '').toLowerCase();
        const isUserAssigned = assigneeName.includes('you') || assigneeName.includes('sarah') || assigneeName.includes('alex') || assigneeName.includes('dev');
        if (!isPinned && !isUserAssigned) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return getPriorityWeight(b.priority?.name) - getPriorityWeight(a.priority?.name);
      }
      if (sortBy === 'created') {
        return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime();
      }
      if (sortBy === 'assignee') {
        return (a.assignee?.name || '').localeCompare(b.assignee?.name || '');
      }
      // Default: 'updated'
      const timeA = new Date(a.updated || a.created || 0).getTime();
      const timeB = new Date(b.updated || b.created || 0).getTime();
      return timeB - timeA;
    });

  // Reset focus & bulk selections when issue list or filters change
  useEffect(() => {
    setFocusedIndex(0);
    setSelectedKeys([]);
  }, [issues, priorityFilter, sortBy, isFocusMode]);

  // Bulk selection helper
  const isAllSelected = filteredIssues.length > 0 && selectedKeys.length === filteredIssues.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(filteredIssues.map((i) => i.key));
    }
  };

  const handleToggleSelectKey = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleBulkPinAction = () => {
    if (selectedKeys.length === 0 || !onBulkPin) return;
    onBulkPin(selectedKeys);
    setSelectedKeys([]);
  };

  const handleBulkRemoveAction = () => {
    if (selectedKeys.length === 0 || !onBulkRemoveFromCache) return;
    onBulkRemoveFromCache(selectedKeys);
    setSelectedKeys([]);
  };

  // Keyboard navigation listener (ArrowUp, ArrowDown, J, K, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredIssues.length === 0) return;

      // Ignore keyboard shortcuts if typing in input/textarea/editable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, filteredIssues.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredIssues[focusedIndex]) {
          onSelectIssue(filteredIssues[focusedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredIssues, focusedIndex, onSelectIssue]);

  if (issues.length === 0) {
    return (
      <div className="p-8 text-center space-y-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl my-4 mx-3">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-700">No Jira Tickets Found</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {searchQuery 
              ? `No issues matched "${searchQuery}". Try a different ticket key or broader search term.`
              : 'Try searching by Jira ticket key (e.g. PROJ-101), summary text, or JQL query.'}
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (statusName: string, category: string) => {
    switch (category) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {statusName}
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-2.5 h-2.5" />
            {statusName}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {statusName}
          </span>
        );
    }
  };

  const getPriorityBadge = (priorityName: string) => {
    switch (priorityName) {
      case 'Highest':
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
            <AlertTriangle className="w-2.5 h-2.5 text-rose-600 fill-rose-200" />
            <span>Highest</span>
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            <ArrowUp className="w-2.5 h-2.5 text-orange-600" />
            <span>High</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-300">
            <Minus className="w-2.5 h-2.5 text-amber-600" />
            <span>Medium</span>
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <ArrowDown className="w-2.5 h-2.5 text-blue-600" />
            <span>Low</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <ArrowDown className="w-2.5 h-2.5 text-slate-400" />
            <span>{priorityName || 'Lowest'}</span>
          </span>
        );
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getStatusDurationLabel = (issue: JiraIssue) => {
    if (!issue.statusTime || issue.statusTime.length === 0) return null;
    // Find current status item or use last item
    const currentItem = issue.statusTime.find(
      st => st.statusName.toLowerCase() === issue.status.name.toLowerCase()
    ) || issue.statusTime[issue.statusTime.length - 1];

    if (!currentItem || currentItem.hours <= 0) return null;

    const hours = currentItem.hours;
    let timeStr = `${hours}h`;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const rem = hours % 24;
      timeStr = rem > 0 ? `${days}d ${rem}h` : `${days}d`;
    }

    return `${timeStr} in ${issue.status.name}`;
  };

  return (
    <div className="space-y-2 p-3">
      {/* Offline result header notification banner if offline */}
      {isOfflineResult && (
        <div className="flex items-center justify-between text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 mb-2">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Loaded from local cache dataset</span>
          </div>
          <span className="font-semibold text-slate-900">{issues.length} tickets</span>
        </div>
      )}

      {/* Control Toolbar: Focus Mode, Select All, Priority & Sort */}
      <div className="flex flex-wrap items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-2xs gap-2">
        {/* Left Controls: Select All & Focus Mode */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : selectedKeys.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-blue-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All</span>
          </button>
          {selectedKeys.length > 0 && (
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {selectedKeys.length} selected
            </span>
          )}

          {/* Focus Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isFocusMode
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs ring-2 ring-purple-200'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
            title="Focus Mode: Hide tickets except those assigned to you or pinned"
          >
            <Target className={`w-3.5 h-3.5 ${isFocusMode ? 'text-amber-300 animate-spin-slow' : 'text-purple-600'}`} />
            <span>Focus Mode</span>
            {isFocusMode && (
              <span className="text-[9px] bg-purple-900 text-purple-200 px-1 py-0.2 rounded ml-0.5 font-mono">
                ON
              </span>
            )}
          </button>
        </div>

        {/* Right Controls: Sort By & Priority Filter */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated">Recently Updated</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="created">Created Date</option>
              <option value="assignee">Assignee Name</option>
            </select>
          </div>

          {/* Priority Filter Dropdown */}
          <div className="flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Priorities ({issues.length})</option>
              <option value="Highest">Highest / Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Floating Bar when items selected */}
      {selectedKeys.length > 0 && (
        <div className="flex items-center justify-between bg-blue-900 text-white p-2.5 rounded-xl border border-blue-800 shadow-md text-xs animate-in fade-in">
          <span className="font-semibold text-blue-100 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-blue-300" />
            <span>{selectedKeys.length} ticket(s) selected</span>
          </span>

          <div className="flex items-center gap-2">
            {onBulkPin && (
              <button
                onClick={handleBulkPinAction}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-xs"
              >
                <Pin className="w-3 h-3 fill-slate-950" />
                <span>Bulk Pin</span>
              </button>
            )}

            {onBulkRemoveFromCache && (
              <button
                onClick={handleBulkRemoveAction}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-xs"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Cache</span>
              </button>
            )}

            <button
              onClick={() => setSelectedKeys([])}
              className="px-2 py-1 bg-blue-800 hover:bg-blue-700 text-blue-200 rounded-lg text-[11px] font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Navigation Hint Bar */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80 mb-1">
        <div className="flex items-center gap-1.5 font-medium">
          <Keyboard className="w-3 h-3 text-blue-600" />
          <span>Keyboard Nav: Use <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700">↑</kbd> <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700">↓</kbd> or <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700">J</kbd>/<kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700">K</kbd> to move, <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700">Enter</kbd> to open</span>
        </div>
        <span className="font-semibold text-slate-600">
          {filteredIssues.length > 0 ? focusedIndex + 1 : 0} / {filteredIssues.length}
        </span>
      </div>

      {/* Ticket Cards List */}
      <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredIssues.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No tickets match priority filter &quot;{priorityFilter}&quot;.
          </div>
        ) : (
          filteredIssues.map((issue, idx) => {
            const isFocused = idx === focusedIndex;
            const isSelected = selectedKeys.includes(issue.key);

            return (
              <div
                key={issue.key}
                onClick={() => {
                  setFocusedIndex(idx);
                  onSelectIssue(issue);
                }}
                className={`p-3 transition-all cursor-pointer group flex items-start gap-2.5 relative ${
                  isFocused
                    ? 'bg-blue-50/80 ring-2 ring-blue-500 ring-inset z-10'
                    : issue.isPinned
                    ? 'bg-amber-50/30 hover:bg-amber-50/60 border-l-3 border-l-amber-400'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Row Checkbox */}
                <button
                  type="button"
                  onClick={(e) => handleToggleSelectKey(issue.key, e)}
                  className="mt-0.5 text-slate-400 hover:text-blue-600 shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                  )}
                </button>

                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                  {/* Top Row: Key, Priority Badge, IssueType, Pin, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-blue-700 group-hover:underline">
                        {issue.key}
                      </span>

                      {/* Visual Priority Badge Indicator */}
                      {getPriorityBadge(issue.priority.name)}

                      {/* Issue Type */}
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.2 rounded">
                        {issue.issueType.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Pin Ticket Action Toggle */}
                      {onTogglePinTicket && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinTicket(issue.key);
                          }}
                          className={`p-1 rounded-md transition-all ${
                            issue.isPinned
                              ? 'text-amber-600 bg-amber-100/80 hover:bg-amber-200 border border-amber-300'
                              : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                          }`}
                          title={issue.isPinned ? 'Unpin ticket' : 'Pin ticket to top'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${issue.isPinned ? 'fill-amber-400' : ''}`} />
                        </button>
                      )}

                      {/* Offline Cached Tag Indicator */}
                      {issue.isCachedOffline && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80" title={`Cached offline ${formatRelativeTime(issue.cachedAt)}`}>
                          <Database className="w-2.5 h-2.5 text-emerald-600" />
                          <span className="hidden sm:inline">Cached</span>
                        </span>
                      )}

                      {/* Status Badge */}
                      {getStatusBadge(issue.status.name, issue.status.category)}

                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all ml-0.5" />
                    </div>
                  </div>

                  {/* Summary Title */}
                  <h4 className="text-xs font-semibold text-slate-800 group-hover:text-blue-900 leading-snug line-clamp-2">
                    {issue.summary}
                  </h4>

                  {/* Bottom Meta Row: Assignee, Comments count, Components */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {issue.assignee.avatar ? (
                        <img 
                          src={issue.assignee.avatar} 
                          alt={issue.assignee.name} 
                          className="w-4 h-4 rounded-full border border-slate-200"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="text-slate-600 font-medium truncate max-w-[120px]">
                        {issue.assignee.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      {getStatusDurationLabel(issue) && (
                        <span className="flex items-center gap-1 bg-slate-100 text-slate-700 font-medium px-1.5 py-0.2 rounded border border-slate-200" title="Time spent in current status">
                          <Clock className="w-2.5 h-2.5 text-blue-600" />
                          {getStatusDurationLabel(issue)}
                        </span>
                      )}

                      {issue.comments && issue.comments.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <MessageSquare className="w-3 h-3" />
                          {issue.comments.length}
                        </span>
                      )}

                      {issue.components && issue.components.length > 0 && (
                        <span className="hidden sm:inline bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded truncate max-w-[100px]">
                          {issue.components[0]}
                        </span>
                      )}

                      <span>Updated {formatRelativeTime(issue.updated)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

