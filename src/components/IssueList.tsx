import React, { useState, useEffect } from 'react';
import { JiraIssue } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Database,
  User,
  MessageSquare,
  ChevronRight,
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
  ArrowUpDown
} from 'lucide-react';

interface IssueListProps {
  issues: JiraIssue[];
  onSelectIssue: (issue: JiraIssue) => void;
  onTogglePinTicket?: (key: string) => void;
  onBulkPin?: (keys: string[]) => void;
  onBulkRemoveFromCache?: (keys: string[]) => void;
  onBulkUpdateStatus?: (keys: string[], newStatusName: string, category: 'to-do' | 'in-progress' | 'done') => void;
  recentlyViewed?: JiraIssue[];
  isOfflineResult: boolean;
  searchQuery: string;
}

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  onSelectIssue,
  onTogglePinTicket,
  onBulkPin,
  onBulkRemoveFromCache,
  onBulkUpdateStatus,
  recentlyViewed,
  isOfflineResult,
  searchQuery,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [quickFilter, setQuickFilter] = useState<
    | 'all'
    | 'my'
    | 'high_priority'
    | 'bugs'
    | 'status_todo'
    | 'status_in_progress'
    | 'status_blocked'
    | 'status_in_review'
    | 'status_ready_to_test'
    | 'status_in_test'
    | 'status_final_review'
    | 'status_done'
  >('all');
  const [sortBy, setSortBy] = useState<'updated' | 'priority' | 'created' | 'assignee'>('updated');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const normalizeStatusKey = (statusName: string) => {
    const cleaned = statusName.trim().toLowerCase().replace(/[-_]+/g, ' ');
    if (cleaned === 'to do' || cleaned === 'todo') return 'todo';
    if (cleaned.includes('blocked') || cleaned.includes('on hold')) return 'blocked';
    if (cleaned === 'in review' || cleaned.includes('code review') || cleaned.includes('peer review')) return 'in_review';
    if (cleaned === 'ready to test' || cleaned === 'ready for test' || cleaned === 'ready for testing') return 'ready_to_test';
    if (cleaned === 'in test' || cleaned === 'in testing' || cleaned === 'testing') return 'in_test';
    if (cleaned === 'final review') return 'final_review';
    if (cleaned.includes('done') || cleaned.includes('closed') || cleaned.includes('resolved')) return 'done';
    if (cleaned.includes('progress') || cleaned === 'inprogress' || cleaned === 'in progress') return 'in_progress';
    return cleaned;
  };

  const hasStatus = (issue: JiraIssue, statusKey: string) => {
    if (statusKey === 'in_progress') {
      if (issue.status?.category === 'in-progress') return true;
    }
    if (statusKey === 'done') {
      if (issue.status?.category === 'done') return true;
    }
    return normalizeStatusKey(issue.status?.name || '') === statusKey;
  };

  // Compute Quick Filter counts dynamically
  const myCount = issues.filter(i => {
    const a = (i.assignee?.name || '').toLowerCase();
    const e = (i.assignee?.email || '').toLowerCase();
    return a.includes('sarah') || a.includes('you') || e.includes('sarah');
  }).length;
  const highCount = issues.filter(i => ['high', 'highest', 'critical'].includes((i.priority?.name || '').toLowerCase())).length;
  const todoCount = issues.filter(i => hasStatus(i, 'todo')).length;
  const inProgressCount = issues.filter(i => hasStatus(i, 'in_progress')).length;
  const blockedCount = issues.filter(i => hasStatus(i, 'blocked')).length;
  const inReviewCount = issues.filter(i => hasStatus(i, 'in_review')).length;
  const readyToTestCount = issues.filter(i => hasStatus(i, 'ready_to_test')).length;
  const inTestCount = issues.filter(i => hasStatus(i, 'in_test')).length;
  const finalReviewCount = issues.filter(i => hasStatus(i, 'final_review')).length;
  const doneCount = issues.filter(i => hasStatus(i, 'done')).length;
  const bugsCount = issues.filter(i => i.issueType?.name === 'Bug').length;

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
      // Quick Filter chips
      if (quickFilter === 'my') {
        const aName = (issue.assignee?.name || '').toLowerCase();
        const aEmail = (issue.assignee?.email || '').toLowerCase();
        if (!aName.includes('sarah') && !aName.includes('you') && !aEmail.includes('sarah')) return false;
      } else if (quickFilter === 'high_priority') {
        const pName = (issue.priority?.name || '').toLowerCase();
        if (!['high', 'highest', 'critical'].includes(pName)) return false;
      } else if (quickFilter === 'status_todo') {
        if (!hasStatus(issue, 'todo')) return false;
      } else if (quickFilter === 'status_in_progress') {
        if (!hasStatus(issue, 'in_progress')) return false;
      } else if (quickFilter === 'status_blocked') {
        if (!hasStatus(issue, 'blocked')) return false;
      } else if (quickFilter === 'status_in_review') {
        if (!hasStatus(issue, 'in_review')) return false;
      } else if (quickFilter === 'status_ready_to_test') {
        if (!hasStatus(issue, 'ready_to_test')) return false;
      } else if (quickFilter === 'status_in_test') {
        if (!hasStatus(issue, 'in_test')) return false;
      } else if (quickFilter === 'status_final_review') {
        if (!hasStatus(issue, 'final_review')) return false;
      } else if (quickFilter === 'status_done') {
        if (!hasStatus(issue, 'done')) return false;
      } else if (quickFilter === 'bugs') {
        if (issue.issueType?.name !== 'Bug') return false;
      }

      // Priority filter dropdown
      if (priorityFilter !== 'ALL') {
        const p = (issue.priority?.name || '').toLowerCase();
        const filterP = priorityFilter.toLowerCase();
        if (filterP === 'highest' && (p !== 'highest' && p !== 'critical')) return false;
        if (filterP !== 'highest' && p !== filterP) return false;
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
  }, [issues, priorityFilter, sortBy, quickFilter]);

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
      <div className="p-8 text-center space-y-3 bg-slate-900 border border-dashed border-slate-700 rounded-xl my-4 mx-3">
        <div className="w-12 h-12 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center mx-auto border border-slate-700">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-100">No Jira Tickets Found</p>
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-slate-700 border border-slate-200">
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200">
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

  const handleBulkStatusChange = (newStatusName: string, category: 'to-do' | 'in-progress' | 'done') => {
    if (onBulkUpdateStatus && selectedKeys.length > 0) {
      onBulkUpdateStatus(selectedKeys, newStatusName, category);
      setSelectedKeys([]);
    }
  };

  return (
    <div className="space-y-2 p-3">
      {/* Recently Viewed Section (Last 5 Opened Tickets) */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Recently Viewed (Last 5 Tickets)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Quick Re-access</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {recentlyViewed.slice(0, 5).map((rv) => (
              <button
                key={rv.key}
                onClick={() => onSelectIssue(rv)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 shadow-2xs hover:shadow-xs transition-all group"
                title={`Open details for ${rv.key}: ${rv.summary}`}
              >
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-[11px] group-hover:underline">
                  {rv.key}
                </span>
                <span className="truncate max-w-[130px] text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {rv.summary}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Offline result header notification banner if offline */}
      {isOfflineResult && (
        <div className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 mb-2">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Loaded from local cache dataset</span>
          </div>
          <span className="font-semibold text-slate-900">{issues.length} tickets</span>
        </div>
      )}

      {/* Control Toolbar: Select All, Priority & Sort */}
      <div className="flex flex-col items-start justify-start bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs gap-2.5">
        {/* Left Controls: Select All */}
        <div className="flex flex-col gap-2 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2 w-full">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : selectedKeys.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              )}
              <span>Select All</span>
            </button>
            {selectedKeys.length > 0 && (
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {selectedKeys.length} selected
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 text-xs min-w-0 w-full">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span>Quick Filter</span>
            </span>

            <select
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value as typeof quickFilter)}
              className="w-full text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All ({issues.length})</option>
              <option value="status_todo">To Do ({todoCount})</option>
              <option value="status_in_progress">In Progress ({inProgressCount})</option>
              <option value="status_blocked">Blocked ({blockedCount})</option>
              <option value="status_in_review">In Review ({inReviewCount})</option>
              <option value="status_ready_to_test">Ready to Test ({readyToTestCount})</option>
              <option value="status_in_test">In Test ({inTestCount})</option>
              <option value="status_final_review">Final Review ({finalReviewCount})</option>
              <option value="status_done">Done ({doneCount})</option>
              <option value="my">My Issues ({myCount})</option>
              <option value="high_priority">High Priority ({highCount})</option>
              <option value="bugs">Bugs ({bugsCount})</option>
            </select>
          </div>
        </div>

        {/* Right Controls: Sort By & Priority Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 min-w-0 w-full">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="created">Created Date</option>
              <option value="assignee">Assignee Name</option>
            </select>
          </div>

          {/* Priority Filter Dropdown */}
          <div className="flex items-center gap-1.5 min-w-0 w-full">
            <ListFilter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
        <div className="flex flex-wrap items-center justify-between bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 shadow-md text-xs animate-in fade-in gap-2">
          <span className="font-semibold text-blue-200 flex items-center gap-1.5 shrink-0">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>{selectedKeys.length} selected</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Bulk Status Transition Buttons */}
            {onBulkUpdateStatus && (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold px-1 uppercase hidden sm:inline">Set Status:</span>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('To Do', 'to-do')}
                  className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-bold transition-colors"
                >
                  To Do
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('In Progress', 'in-progress')}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-colors"
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('Done', 'done')}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            )}

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
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Navigation Hint Bar */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700/80 mb-1">
        <div className="flex items-center gap-1.5 font-medium">
          <Keyboard className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>Keyboard Nav: Use <kbd className="px-1 py-0.2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold text-slate-700 dark:text-slate-200">↑</kbd> <kbd className="px-1 py-0.2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold text-slate-700 dark:text-slate-200">↓</kbd> or <kbd className="px-1 py-0.2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold text-slate-700 dark:text-slate-200">J</kbd>/<kbd className="px-1 py-0.2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold text-slate-700 dark:text-slate-200">K</kbd> to move, <kbd className="px-1 py-0.2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold text-slate-700 dark:text-slate-200">Enter</kbd> to open</span>
        </div>
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          {filteredIssues.length > 0 ? focusedIndex + 1 : 0} / {filteredIssues.length}
        </span>
      </div>

      {/* Ticket Cards List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {filteredIssues.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
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
                    ? 'bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500 ring-inset z-10'
                    : issue.isPinned
                    ? 'bg-amber-50/30 dark:bg-amber-950/30 hover:bg-amber-50/60 dark:hover:bg-amber-950/50 border-l-3 border-l-amber-400'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Row Checkbox */}
                <button
                  type="button"
                  onClick={(e) => handleToggleSelectKey(issue.key, e)}
                  className="mt-0.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400" />
                  )}
                </button>

                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                  {/* Top Row: Key, Priority Badge, IssueType, Pin, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:underline">
                        {issue.key}
                      </span>

                      {/* Visual Priority Badge Indicator */}
                      {getPriorityBadge(issue.priority.name)}

                      {/* Issue Type */}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200/50 dark:border-slate-700/50">
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
                          className={`p-1 rounded-md transition-all cursor-pointer ${
                            issue.isPinned
                              ? 'text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800'
                                : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                          title={issue.isPinned ? 'Unpin ticket' : 'Pin ticket to top'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${issue.isPinned ? 'fill-amber-400' : ''}`} />
                        </button>
                      )}

                      {/* Offline Cached Tag Indicator */}
                      {issue.isCachedOffline && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80" title={`Cached offline ${formatRelativeTime(issue.cachedAt)}`}>
                          <Database className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="hidden sm:inline">Cached</span>
                        </span>
                      )}

                      {/* Status Badge */}
                      {getStatusBadge(issue.status.name, issue.status.category)}

                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all ml-0.5" />
                    </div>
                  </div>

                  {/* Summary Title */}
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-900 dark:group-hover:text-blue-300 leading-snug line-clamp-2">
                    {issue.summary}
                  </h4>

                  {/* Bottom Meta Row: Assignee, Comments count, Components */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {issue.assignee.avatar ? (
                        <img
                          src={issue.assignee.avatar}
                          alt={issue.assignee.name}
                          className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      )}
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                        {issue.assignee.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-400">
                      {getStatusDurationLabel(issue) && (
                        <span className="flex items-center gap-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700" title="Time spent in current status">
                          <Clock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                          {getStatusDurationLabel(issue)}
                        </span>
                      )}

                      {issue.comments && issue.comments.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <MessageSquare className="w-3 h-3" />
                          {issue.comments.length}
                        </span>
                      )}

                      {issue.components && issue.components.length > 0 && (
                        <span className="hidden sm:inline bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded truncate max-w-[100px] border border-slate-200/50 dark:border-slate-700/50">
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

