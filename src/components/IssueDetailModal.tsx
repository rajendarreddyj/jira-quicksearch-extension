import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { JiraIssue, StatusCategory, PriorityName, JiraSubtask } from '../types';
import { 
  X, 
  ExternalLink, 
  Database, 
  Clock, 
  User, 
  UserCheck,
  Hourglass,
  Loader2,
  MessageSquare, 
  Tag, 
  Layers, 
  Send, 
  Copy, 
  Check,
  CheckCircle2,
  AlertCircle,
  Pin,
  Eye,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  Sparkles,
  GitPullRequest,
  CheckSquare,
  Printer,
  FileText,
  Timer,
  NotebookPen,
  Save,
  Trash2
} from 'lucide-react';

interface IssueDetailModalProps {
  issue: JiraIssue | null;
  onClose: () => void;
  onUpdateIssueStatus?: (key: string, newStatusName: string, category: StatusCategory) => void;
  onUpdateIssuePriority?: (key: string, newPriorityName: PriorityName) => void;
  onUpdateIssueAssignee?: (key: string, name: string, email: string) => void;
  onAddComment?: (key: string, commentText: string) => void;
  onTogglePinTicket?: (key: string) => void;
  onToggleWatchTicket?: (key: string) => void;
  onFilterByLabel?: (label: string) => void;
  jiraUrl: string;
  currentUserEmail?: string;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onClose,
  onUpdateIssueStatus,
  onUpdateIssuePriority,
  onUpdateIssueAssignee,
  onAddComment,
  onTogglePinTicket,
  onToggleWatchTicket,
  onFilterByLabel,
  jiraUrl,
  currentUserEmail,
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Subtasks local state
  const [subtasks, setSubtasks] = useState<JiraSubtask[]>([]);

  // Scratchpad / Local Notes state for this ticket with debounced auto-save
  const [scratchpadNote, setScratchpadNote] = useState<string>('');
  const [scratchpadSaveStatus, setScratchpadSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load ticket scratchpad from localStorage whenever selected issue changes
  useEffect(() => {
    if (issue) {
      const storedNote = localStorage.getItem(`jira_scratchpad_${issue.key.toUpperCase()}`) || '';
      setScratchpadNote(storedNote);
      setScratchpadSaveStatus('idle');
    }
  }, [issue?.key]);

  // Debounced auto-save effect whenever scratchpadNote changes
  useEffect(() => {
    if (!issue) return;

    const storageKey = `jira_scratchpad_${issue.key.toUpperCase()}`;
    const stored = localStorage.getItem(storageKey) || '';

    if (scratchpadNote === stored) return;

    setScratchpadSaveStatus('saving');

    const saveTimer = setTimeout(() => {
      if (scratchpadNote.trim() === '') {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, scratchpadNote);
      }
      setScratchpadSaveStatus('saved');

      const idleTimer = setTimeout(() => {
        setScratchpadSaveStatus('idle');
      }, 2500);

      return () => clearTimeout(idleTimer);
    }, 350);

    return () => clearTimeout(saveTimer);
  }, [scratchpadNote, issue?.key]);

  const handleClearScratchpad = () => {
    setScratchpadNote('');
    if (issue) {
      localStorage.removeItem(`jira_scratchpad_${issue.key.toUpperCase()}`);
      setScratchpadSaveStatus('saved');
      setTimeout(() => setScratchpadSaveStatus('idle'), 2000);
    }
  };

  const handleAssignToMe = () => {
    if (!issue || !onUpdateIssueAssignee) return;
    const userEmail = currentUserEmail || 'user@example.com';
    const namePart = userEmail.split('@')[0] || 'User';
    const formattedName = namePart
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    onUpdateIssueAssignee(issue.key, formattedName, userEmail);
  };

  // Keyboard Shortcuts in Detail Modal (Alt+1, Alt+2, Alt+3, Alt+P, Cmd+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in comment textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'textarea' || targetTag === 'input') return;

      if (e.altKey && e.key === '1') {
        e.preventDefault();
        handleStatusChange('To Do', 'to-do');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        handleStatusChange('In Progress', 'in-progress');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        handleStatusChange('Done', 'done');
      } else if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (issue && onTogglePinTicket) onTogglePinTicket(issue.key);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleTriggerPrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [issue]);

  const handleTriggerPrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  useEffect(() => {
    if (issue) {
      if (issue.subtasks && issue.subtasks.length > 0) {
        setSubtasks(issue.subtasks);
      } else {
        // Fallback default subtasks for issue
        const defaultSubs: JiraSubtask[] = [
          {
            key: `${issue.key}-1`,
            summary: `Technical implementation for ${issue.summary.slice(0, 30)}...`,
            status: { name: 'Done', category: 'done' },
            assignee: issue.assignee,
          },
          {
            key: `${issue.key}-2`,
            summary: 'Code review and unit test coverage verification',
            status: { name: 'In Progress', category: 'in-progress' },
            assignee: issue.assignee,
          },
          {
            key: `${issue.key}-3`,
            summary: 'QA validation & browser extension compatibility testing',
            status: { name: 'To Do', category: 'to-do' },
            assignee: issue.reporter,
          },
        ];
        setSubtasks(defaultSubs);
        issue.subtasks = defaultSubs;
      }
    }
  }, [issue]);

  if (!issue) return null;

  const handleSubtaskStatusChange = (subKey: string, newStatusName: string, category: StatusCategory) => {
    const updated = subtasks.map(st => st.key === subKey ? { ...st, status: { name: newStatusName, category } } : st);
    setSubtasks(updated);
    if (issue) {
      issue.subtasks = updated;
    }
  };

  const handleCopyLink = () => {
    const link = issue.url || `${jiraUrl.replace(/\/+$/, '')}/browse/${issue.key}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStatusChange = (statusName: string, category: StatusCategory) => {
    if (onUpdateIssueStatus) {
      onUpdateIssueStatus(issue.key, statusName, category);
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !onAddComment) return;
    onAddComment(issue.key, newCommentText.trim());
    setNewCommentText('');
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatHours = (hours: number) => {
    if (hours <= 0) return '0h';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
  };

  const statusTimeData = issue.statusTime || [
    { statusName: 'To Do', category: 'to-do' as const, hours: 24 },
    { statusName: 'In Progress', category: 'in-progress' as const, hours: 48 },
  ];

  const totalStatusHours = statusTimeData.reduce((acc, curr) => acc + curr.hours, 0);

  const getStatusBgColor = (cat: string, index: number) => {
    switch (cat) {
      case 'done': return 'bg-emerald-500';
      case 'in-progress': return index % 2 === 0 ? 'bg-blue-500' : 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  if (isPrintMode) {
    return (
      <div className="fixed inset-0 z-50 bg-white text-slate-900 p-6 overflow-y-auto">
        {/* Print Control Toolbar */}
        <div className="print:hidden max-w-3xl mx-auto mb-6 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-xs font-bold">Print-Friendly Document Mode</h3>
              <p className="text-[10px] text-slate-400">Formatted clean layout for physical print or PDF saving</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={() => setIsPrintMode(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-xs transition-colors"
            >
              Exit Print View
            </button>
          </div>
        </div>

        {/* Print Document Paper Layout */}
        <div className="max-w-3xl mx-auto bg-white p-8 border border-slate-300 rounded-lg shadow-sm space-y-6 text-sm font-sans print:border-none print:shadow-none print:p-0">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">{issue.issueType.name}</span>
              <h1 className="text-2xl font-black text-slate-900 mt-0.5">{issue.key}: {issue.summary}</h1>
              <p className="text-xs text-slate-500 mt-1">Project: Jira | Created: {issue.created || 'N/A'}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded">
                {issue.status.name}
              </span>
              <span className="block text-xs font-semibold text-slate-700 mt-1">Priority: {issue.priority.name}</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <strong className="text-slate-500 uppercase text-[10px]">Assignee:</strong>
              <div className="font-semibold text-slate-900 mt-0.5">{issue.assignee.name} ({issue.assignee.email})</div>
            </div>
            <div>
              <strong className="text-slate-500 uppercase text-[10px]">Reporter:</strong>
              <div className="font-semibold text-slate-900 mt-0.5">{issue.reporter.name} ({issue.reporter.email})</div>
            </div>
            <div>
              <strong className="text-slate-500 uppercase text-[10px]">Fix Version:</strong>
              <div className="font-semibold text-slate-900 mt-0.5">{issue.fixVersion || 'Unassigned'}</div>
            </div>
            <div>
              <strong className="text-slate-500 uppercase text-[10px]">Labels:</strong>
              <div className="font-semibold text-slate-900 mt-0.5">{issue.labels.join(', ') || 'None'}</div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">Description</h3>
            <div className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-sans bg-slate-50/50 p-3 rounded border border-slate-200">
              {issue.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
                Subtasks ({subtasks.filter(st => st.status.category === 'done').length}/{subtasks.length} Done)
              </h3>
              <div className="space-y-1.5">
                {subtasks.map((st) => (
                  <div key={st.key} className="flex items-center justify-between p-2 border border-slate-200 rounded text-xs bg-slate-50">
                    <span className="font-mono font-bold text-blue-800">{st.key} - {st.summary}</span>
                    <span className="font-bold text-[10px] px-2 py-0.5 bg-slate-200 rounded">{st.status.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {issue.comments && issue.comments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
                Activity & Comments ({issue.comments.length})
              </h3>
              <div className="space-y-2">
                {issue.comments.map((c) => (
                  <div key={c.id} className="p-3 border border-slate-200 rounded-lg text-xs bg-slate-50 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>{c.author}</span>
                      <span>{c.created}</span>
                    </div>
                    <p className="text-slate-800">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-4 text-[10px] text-slate-400 border-t">
            Exported from Jira Quick Search Chrome Extension • {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 dark:text-slate-100 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono font-bold text-xs bg-blue-600 px-2 py-0.5 rounded text-white shadow-xs">
              {issue.key}
            </span>
            <span className="text-xs text-slate-300 truncate font-medium">
              {issue.issueType.name}
            </span>
            {issue.isCachedOffline && (
              <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30">
                <Database className="w-2.5 h-2.5 text-emerald-400" />
                Cached Offline
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleWatchTicket && (
              <button
                onClick={() => onToggleWatchTicket(issue.key)}
                title={issue.isWatched ? 'Stop watching ticket' : 'Watch ticket for live updates'}
                className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-semibold ${
                  issue.isWatched
                    ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-2xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{issue.isWatched ? 'Watching' : 'Watch'}</span>
              </button>
            )}

            {onTogglePinTicket && (
              <button
                onClick={() => onTogglePinTicket(issue.key)}
                title={issue.isPinned ? 'Unpin ticket' : 'Pin ticket'}
                className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-semibold ${
                  issue.isPinned
                    ? 'bg-amber-400 text-slate-900 hover:bg-amber-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${issue.isPinned ? 'fill-slate-900' : ''}`} />
                <span className="hidden sm:inline">{issue.isPinned ? 'Pinned' : 'Pin'}</span>
              </button>
            )}

            {/* Print-Friendly View Button */}
            <button
              onClick={handleTriggerPrint}
              title="Print-Friendly View / PDF Export (⌘P)"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1 text-xs font-medium"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Copy Direct Jira Link Button */}
            <button
              onClick={handleCopyLink}
              title="Copy direct URL of Jira ticket to clipboard"
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-all text-xs font-bold flex items-center gap-1 shadow-2xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Jira Link'}</span>
            </button>

            <a
              href={issue.url || `${jiraUrl.replace(/\/+$/, '')}/browse/${issue.key}`}
              target="_blank"
              rel="noreferrer"
              title="Open issue directly in Jira"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Summary Heading */}
          <h2 className="text-base font-bold text-slate-900 leading-snug">
            {issue.summary}
          </h2>

          {/* QUICK ACTIONS SECTION */}
          <div className="p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-200/80 rounded-xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Quick Actions</span>
              </div>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                Fast Ticket Management
              </span>
            </div>

            {/* Status & Priority Quick Modifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Quick Status */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Status
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => handleStatusChange('To Do', 'to-do')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                      issue.status.category === 'to-do'
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    To Do
                  </button>
                  <button
                    onClick={() => handleStatusChange('In Progress', 'in-progress')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                      issue.status.category === 'in-progress'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange('Done', 'done')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                      issue.status.category === 'done'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Priority Selector */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Priority
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {['Highest', 'High', 'Medium', 'Low'].map((pName) => {
                    const isCurrent = issue.priority.name.toLowerCase() === pName.toLowerCase();
                    return (
                      <button
                        key={pName}
                        onClick={() => onUpdateIssuePriority && onUpdateIssuePriority(issue.key, pName as PriorityName)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-0.5 ${
                          isCurrent
                            ? pName === 'Highest'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : pName === 'High'
                              ? 'bg-orange-600 text-white shadow-2xs'
                              : pName === 'Medium'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {pName === 'Highest' && <AlertTriangle className="w-2.5 h-2.5" />}
                        {pName === 'High' && <ArrowUp className="w-2.5 h-2.5" />}
                        {pName === 'Medium' && <Minus className="w-2.5 h-2.5" />}
                        {pName === 'Low' && <ArrowDown className="w-2.5 h-2.5" />}
                        <span>{pName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pin to Top & Quick Copy Bar */}
            <div className="flex items-center gap-2 pt-1">
              {onTogglePinTicket && (
                <button
                  onClick={() => onTogglePinTicket(issue.key)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs border ${
                    issue.isPinned
                      ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 border-amber-500'
                      : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-300 hover:border-amber-300'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${issue.isPinned ? 'fill-slate-900' : 'text-amber-500'}`} />
                  <span>{issue.isPinned ? 'Pinned to Top' : 'Pin Ticket'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Copy direct URL to Jira ticket"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
              </button>

              <a
                href={`${jiraUrl.replace(/\/+$/, '')}/browse/${issue.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Open direct ticket in browser"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Open in Jira</span>
              </a>
            </div>
          </div>

          {/* TIME TRACKING & ESTIMATES SECTION */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Timer className="w-3.5 h-3.5 text-blue-600" />
                <span>Time Tracking & Estimates</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500">
                Worklog Stats
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-medium text-slate-400 block">Original Estimate</span>
                <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Timer className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    {issue.timeTracking?.originalEstimateText ||
                      (issue.timeTracking?.originalEstimateSeconds
                        ? `${Math.round(issue.timeTracking.originalEstimateSeconds / 3600)}h`
                        : '3d (24h)')}
                  </span>
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-medium text-slate-400 block">Time Spent</span>
                <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {issue.timeTracking?.timeSpentText ||
                      (issue.timeTracking?.timeSpentSeconds
                        ? `${Math.round(issue.timeTracking.timeSpentSeconds / 3600)}h`
                        : '2d (16h)')}
                  </span>
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-medium text-slate-400 block">Remaining</span>
                <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                  <Hourglass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    {issue.timeTracking?.remainingEstimateText ||
                      (issue.timeTracking?.remainingEstimateSeconds
                        ? `${Math.round(issue.timeTracking.remainingEstimateSeconds / 3600)}h`
                        : '1d (8h)')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TIME SPENT IN EACH STATUS ANALYTICS SECTION */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Time Spent in Each Status</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                Total: {formatHours(totalStatusHours)}
              </span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
              {statusTimeData.map((st, idx) => {
                const pct = totalStatusHours > 0 ? (st.hours / totalStatusHours) * 100 : 0;
                return (
                  <div
                    key={st.statusName + idx}
                    style={{ width: `${pct}%` }}
                    className={`h-full transition-all ${getStatusBgColor(st.category, idx)}`}
                    title={`${st.statusName}: ${formatHours(st.hours)} (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>

            {/* Status Duration Grid Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              {statusTimeData.map((st, idx) => {
                const pct = totalStatusHours > 0 ? Math.round((st.hours / totalStatusHours) * 100) : 0;
                return (
                  <div key={st.statusName + idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusBgColor(st.category, idx)}`} />
                      <span className="font-medium text-slate-700 truncate text-[11px]">
                        {st.statusName}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 shrink-0">
                      {formatHours(st.hours)} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PERSONAL TICKET SCRATCHPAD (Auto-Saving) */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-xl space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                <NotebookPen className="w-4 h-4 text-blue-600" />
                <span>Personal Ticket Scratchpad</span>
              </div>
              <div className="flex items-center gap-2">
                {scratchpadSaveStatus === 'saving' && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                )}
                {scratchpadSaveStatus === 'saved' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" /> Auto-saved
                  </span>
                )}
                {scratchpadNote && (
                  <button
                    type="button"
                    onClick={handleClearScratchpad}
                    title="Clear Scratchpad Note"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={3}
              value={scratchpadNote}
              onChange={(e) => setScratchpadNote(e.target.value)}
              placeholder="Jot down quick personal notes, draft code snippets, or reminder checklists for this ticket... (Auto-saved immediately on typing)"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none resize-y"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Private notes are auto-saved in your local browser cache.</span>
              <span className="font-mono">{scratchpadNote.length} chars</span>
            </div>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-medium">Assignee</span>
                {onUpdateIssueAssignee && (
                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    title="Assign this ticket to my email account"
                  >
                    <UserCheck className="w-3 h-3 text-blue-600" />
                    <span>Assign to Me</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-800">
                {issue.assignee.avatar ? (
                  <img src={issue.assignee.avatar} className="w-4 h-4 rounded-full border border-slate-200" alt="" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{issue.assignee.name}</span>
                {currentUserEmail && issue.assignee.email?.toLowerCase() === currentUserEmail.toLowerCase() && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                    You
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block font-medium">Reporter</span>
              <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-800">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{issue.reporter.name}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block font-medium">Priority</span>
              <span className="font-semibold text-slate-800 block mt-1">
                {issue.priority.name}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block font-medium">Fix Version</span>
              <span className="font-semibold text-slate-800 block mt-1">
                {issue.fixVersion || 'Unassigned'}
              </span>
            </div>

            {issue.storyPoints !== undefined && (
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Story Points</span>
                <span className="font-semibold text-slate-800 block mt-1">
                  {issue.storyPoints} pts
                </span>
              </div>
            )}

            <div>
              <span className="text-slate-400 text-[11px] block font-medium">Updated</span>
              <span className="text-slate-700 block mt-1">
                {formatTime(issue.updated)}
              </span>
            </div>
          </div>

          {/* Components & Labels */}
          {(issue.components.length > 0 || issue.labels.length > 0) && (
            <div className="space-y-2">
              {issue.components.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Components:
                  </span>
                  {issue.components.map(comp => (
                    <span key={comp} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                      {comp}
                    </span>
                  ))}
                </div>
              )}

              {issue.labels.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                    <Tag className="w-3 h-3 text-blue-600" /> Labels:
                  </span>
                  {issue.labels.map(lbl => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => onFilterByLabel?.(lbl)}
                      className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/60 hover:text-blue-900 px-2 py-0.5 rounded-full font-semibold text-[11px] transition-all border border-blue-200 dark:border-blue-700/60 flex items-center gap-1 group cursor-pointer shadow-2xs"
                      title={`Click tag to filter issues list by label "${lbl}"`}
                    >
                      <Tag className="w-2.5 h-2.5 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBTASKS SECTION */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Subtasks & Technical Steps ({subtasks.length})</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                {subtasks.filter(st => st.status.category === 'done').length} / {subtasks.length} Done
              </span>
            </div>

            {/* Subtasks Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${
                    subtasks.length > 0
                      ? Math.round((subtasks.filter(st => st.status.category === 'done').length / subtasks.length) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* Subtasks List */}
            <div className="space-y-2">
              {subtasks.map((st) => {
                const isDone = st.status.category === 'done';
                const isInProgress = st.status.category === 'in-progress';

                return (
                  <div
                    key={st.key}
                    className={`p-2.5 rounded-lg border text-xs transition-all space-y-1.5 ${
                      isDone
                        ? 'bg-emerald-50/50 border-emerald-200/80'
                        : isInProgress
                        ? 'bg-blue-50/50 border-blue-200/80'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-[11px] text-blue-700 shrink-0">
                          {st.key}
                        </span>
                        <span className={`font-semibold text-slate-800 truncate ${isDone ? 'line-through text-slate-500' : ''}`}>
                          {st.summary}
                        </span>
                      </div>

                      {/* Current Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {st.status.name}
                      </span>
                    </div>

                    {/* Quick Transition Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                      <span className="text-[10px] text-slate-400">
                        Assignee: {st.assignee?.name || issue.assignee.name}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSubtaskStatusChange(st.key, 'To Do', 'to-do')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            st.status.category === 'to-do'
                              ? 'bg-slate-700 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          To Do
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSubtaskStatusChange(st.key, 'In Progress', 'in-progress')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            st.status.category === 'in-progress'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          In Progress
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSubtaskStatusChange(st.key, 'Done', 'done')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            st.status.category === 'done'
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Tracking Section */}
          {(() => {
            const tt = issue.timeTracking;
            const origSec = tt?.originalEstimateSeconds || (tt?.timeSpentSeconds ? tt.timeSpentSeconds + (tt.remainingEstimateSeconds || 0) : 0);
            const spentSec = tt?.timeSpentSeconds || 0;
            const remSec = tt?.remainingEstimateSeconds || Math.max(0, origSec - spentSec);
            const pct = origSec > 0 ? Math.min(100, Math.round((spentSec / origSec) * 100)) : (spentSec > 0 ? 100 : 0);

            const spentDisplay = tt?.timeSpentText || (spentSec > 0 ? `${Math.round(spentSec / 3600)}h` : '0h');
            const remDisplay = tt?.remainingEstimateText || (remSec > 0 ? `${Math.round(remSec / 3600)}h` : '0h');
            const origDisplay = tt?.originalEstimateText || (origSec > 0 ? `${Math.round(origSec / 3600)}h` : 'Not specified');

            return (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Time Tracking</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                    {pct}% logged
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
                      title={`Logged: ${spentDisplay}`}
                    />
                    <div
                      style={{ width: `${100 - pct}%` }}
                      className="bg-slate-300 dark:bg-slate-600 h-full transition-all duration-300 opacity-60"
                      title={`Remaining: ${remDisplay}`}
                    />
                  </div>
                </div>

                {/* Tracking Stats Pill Row */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Logged</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono">{spentDisplay}</div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Remaining</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono">{remDisplay}</div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Original Est.</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono">{origDisplay}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Description Section */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Description</span>
              <span className="text-[10px] font-mono text-slate-400 font-normal lowercase">markdown supported</span>
            </h3>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans prose dark:prose-invert max-w-none">
              <Markdown>{issue.description || '_No description provided._'}</Markdown>
            </div>
          </div>

          {/* Comments Thread Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Comments ({issue.comments.length})</span>
              </h3>
            </div>

            {/* Existing Comments */}
            <div className="space-y-2">
              {issue.comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                    <span className="text-blue-700 dark:text-blue-400 font-bold">{comment.author}</span>
                    <span className="text-slate-400 font-normal">{formatTime(comment.created)}</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 leading-normal prose dark:prose-invert max-w-none pt-1">
                    <Markdown>{comment.body}</Markdown>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleSendComment} className="pt-1 flex items-center gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add an offline draft comment..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Post</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
