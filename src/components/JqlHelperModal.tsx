import React, { useState } from 'react';
import { X, Copy, Check, ArrowRight, BookOpen } from 'lucide-react';

interface JqlHelperModalProps {
  onClose: () => void;
  onApplyQuery: (query: string) => void;
  currentProjectKey?: string;
}

export const JqlHelperModal: React.FC<JqlHelperModalProps> = ({
  onClose,
  onApplyQuery,
  currentProjectKey = 'PROJ',
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'assignee', label: 'Assignee & My Work' },
    { id: 'status', label: 'Status & Progress' },
    { id: 'bugs', label: 'Bugs & Client Bugs' },
    { id: 'time', label: 'Date & Time Ranges' },
    { id: 'priority', label: 'Priority & Risk' },
    { id: 'text', label: 'Text & Keyword Search' },
  ];

  const snippets = [
    {
      category: 'assignee',
      title: 'My Open Issues',
      jql: 'assignee = currentUser() AND statusCategory != Done',
      description: 'Returns all open tickets assigned to the logged in user.',
    },
    {
      category: 'assignee',
      title: 'Reported by Me',
      jql: 'reporter = currentUser() ORDER BY created DESC',
      description: 'List all issues created or logged by you.',
    },
    {
      category: 'status',
      title: 'In Progress Sprint Work',
      jql: `project = "${currentProjectKey}" AND status = "In Progress"`,
      description: 'Filter active tickets currently being developed or tested.',
    },
    {
      category: 'status',
      title: 'Unresolved Bugs & Defects',
      jql: `project = "${currentProjectKey}" AND issueType = Bug AND statusCategory != Done`,
      description: 'All open software defects requiring triage or fixing.',
    },
    {
      category: 'bugs',
      title: 'Bugs Created in Last 7 Days',
      jql: `project = "${currentProjectKey}" AND issueType = Bug AND created >= -7d ORDER BY created DESC`,
      description: 'Recently created Bug issues in the last 7 days.',
    },
    {
      category: 'bugs',
      title: 'Client Bugs Created in Last 7 Days',
      jql: `project = "${currentProjectKey}" AND issueType = "Client Bug" AND created >= -7d ORDER BY created DESC`,
      description: 'Recently created Client Bug issues in the last 7 days.',
    },
    {
      category: 'bugs',
      title: 'Bugs + Client Bugs Created in Last 7 Days',
      jql: `project = "${currentProjectKey}" AND issueType in (Bug, "Client Bug") AND created >= -7d ORDER BY created DESC`,
      description: 'Combined Bug and Client Bug issues created in the last 7 days.',
    },
    {
      category: 'bugs',
      title: 'Bugs Created in Last 30 Days',
      jql: `project = "${currentProjectKey}" AND issueType = Bug AND created >= -30d ORDER BY created DESC`,
      description: 'Recently created Bug issues in the last 30 days.',
    },
    {
      category: 'bugs',
      title: 'Client Bugs Created in Last 30 Days',
      jql: `project = "${currentProjectKey}" AND issueType = "Client Bug" AND created >= -30d ORDER BY created DESC`,
      description: 'Recently created Client Bug issues in the last 30 days.',
    },
    {
      category: 'bugs',
      title: 'Bugs + Client Bugs Created in Last 30 Days',
      jql: `project = "${currentProjectKey}" AND issueType in (Bug, "Client Bug") AND created >= -30d ORDER BY created DESC`,
      description: 'Combined Bug and Client Bug issues created in the last 30 days.',
    },
    {
      category: 'time',
      title: 'Updated in Last 7 Days',
      jql: 'updated >= -7d ORDER BY updated DESC',
      description: 'Find tickets modified within the last week.',
    },
    {
      category: 'time',
      title: 'Created Recently (Last 30 Days)',
      jql: 'created >= -30d ORDER BY created DESC',
      description: 'Recent tickets logged in the past month.',
    },
    {
      category: 'priority',
      title: 'High & Critical Priority',
      jql: 'priority in (Highest, High, Critical) AND statusCategory != Done',
      description: 'Urgent unresolved tickets requiring immediate attention.',
    },
    {
      category: 'text',
      title: 'Crash or Error Exceptions',
      jql: 'text ~ "crash" OR text ~ "exception" OR text ~ "error"',
      description: 'Search description and comments for crash logs or stack traces.',
    },
  ];

  const filteredSnippets = activeCategory === 'all'
    ? snippets
    : snippets.filter(s => s.category === activeCategory);

  const handleCopy = (jql: string, index: number) => {
    navigator.clipboard.writeText(jql);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApply = (jql: string) => {
    onApplyQuery(jql);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold flex items-center gap-2">
                <span>JQL Search Query Cheat Sheet & Templates</span>
                <span className="text-[9px] font-mono bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded border border-blue-700">
                  Jira Query Language
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Click any query template to apply it directly to your search bar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Snippets List */}
        <div className="p-4 overflow-y-auto space-y-3">
          {filteredSnippets.map((snippet, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 hover:border-blue-300 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{snippet.title}</span>
                    <span className="text-[9px] font-mono uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                      {snippet.category}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{snippet.description}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(snippet.jql, idx)}
                    className="p-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition-colors"
                    title="Copy JQL string to clipboard"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleApply(snippet.jql)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <span>Use Query</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* JQL Code Box */}
              <div className="p-2 bg-slate-900 text-emerald-400 rounded-lg font-mono text-xs border border-slate-800 break-all select-all flex items-center justify-between">
                <span>{snippet.jql}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tip: JQL keywords like AND, OR, ORDER BY are case-insensitive.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
