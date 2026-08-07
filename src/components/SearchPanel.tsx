import React, { useState, useEffect } from 'react';
import { ExtensionSettings, SearchHistoryItem } from '../types';
import { Search, X, Filter, Code, Clock, ArrowRight, Zap, HelpCircle, UserCheck, Pin, Mic, MicOff, Copy, Check } from 'lucide-react';
import { JqlHelperModal } from './JqlHelperModal';

interface SearchPanelProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  settings: ExtensionSettings;
  searchHistory: SearchHistoryItem[];
  isSearching: boolean;
  selectedProject: string;
  setSelectedProject: (proj: string) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  settings,
  searchHistory,
  isSearching,
  selectedProject,
  setSelectedProject,
}) => {
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showJqlHelp, setShowJqlHelp] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [copiedSugLabel, setCopiedSugLabel] = useState<string | null>(null);

  const handleCopySuggestionJql = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(label);
    setCopiedSugLabel(label);
    setTimeout(() => setCopiedSugLabel(null), 2000);
  };

  const startVoiceSearch = () => {
    setSpeechError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setSearchQuery(transcript);
          onSearchSubmit(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setSpeechError(`Voice input error: ${event.error}`);
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Microphone access blocked or unavailable.');
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 3000);
    }
  };

  const availableProjects = settings.projectKey
    ? settings.projectKey.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  // JQL Auto-complete suggestions library
  const defaultJqlSuggestions = [
    `project = "${availableProjects[0] || 'PROJ'}"`,
    'assignee = currentUser()',
    'status = "In Progress"',
    'status = "To Do"',
    'status = "Done"',
    'priority = "High"',
    'priority = "Highest"',
    'updated >= -7d',
    'created >= -30d',
    'order by created DESC',
    'text ~ "bug"',
    'summary ~ "fix"',
  ];

  // Dynamic suggestion list based on user input and history
  const activeSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    // 1. History matches
    const historyMatches = searchHistory
      .filter(h => h.query.toLowerCase().includes(q) && h.query.toLowerCase() !== q)
      .map(h => ({ type: 'history' as const, label: h.query, meta: `${h.resultCount} results` }));

    // 2. JQL syntax matches
    const jqlMatches = defaultJqlSuggestions
      .filter(s => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
      .map(s => ({ type: 'jql' as const, label: s, meta: 'JQL Syntax' }));

    // 3. Project key prefix matches (e.g. "PROJ-")
    const pKeyMatches = availableProjects
      .filter(pk => pk.toLowerCase().includes(q))
      .map(pk => ({ type: 'project' as const, label: `project = "${pk}"`, meta: 'Project Filter' }));

    return [...historyMatches, ...pKeyMatches, ...jqlMatches].slice(0, 8);
  }, [searchQuery, searchHistory, availableProjects]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery);
      setShowHistoryDropdown(false);
    }
  };

  const applyQuickFilter = (query: string) => {
    setSearchQuery(query);
    onSearchSubmit(query);
  };

  const selectHistoryItem = (item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    onSearchSubmit(item.query);
    setShowHistoryDropdown(false);
  };

  return (
    <div className="bg-white border-b border-slate-200 p-3 space-y-2.5 shadow-xs">
      {/* Search Bar Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            id="jira-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowHistoryDropdown(true)}
            placeholder="Search key (PROJ-101), summary, or JQL query... (⌘K)"
            className="w-full pl-9 pr-28 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
          />

          {/* Right Action Icons & Voice Search & Shortcut badge */}
          <div className="absolute right-2 flex items-center gap-1.5">
            {/* Voice Search Button */}
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title={isListening ? 'Listening for voice input...' : 'Click to trigger Voice Search (Web Speech API)'}
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-blue-600" />
              )}
            </button>

            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold font-mono bg-slate-200 text-slate-600 border border-slate-300 rounded shadow-2xs">
              ⌘K
            </kbd>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onSearchSubmit(searchQuery)}
              disabled={isSearching}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 shadow-xs"
            >
              {isSearching ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Voice Search Feedback / Error Banner */}
        {isListening && (
          <div className="mt-1 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700 flex items-center gap-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>Listening to voice query... Speak now (e.g. &quot;assigned to me&quot; or &quot;PROJ-101&quot;)</span>
          </div>
        )}

        {speechError && (
          <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800 flex items-center justify-between animate-in fade-in">
            <span>{speechError}</span>
            <button onClick={() => setSpeechError(null)} className="text-amber-600 hover:text-amber-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick History Dropdown */}
        {showHistoryDropdown && searchHistory.length > 0 && !searchQuery && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1 max-h-56 overflow-y-auto"
            onMouseLeave={() => setShowHistoryDropdown(false)}
          >
            <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Recent Search Queries
              </span>
              <button 
                onClick={() => setShowHistoryDropdown(false)}
                className="text-slate-400 hover:text-slate-600 text-[10px]"
              >
                Close
              </button>
            </div>
            {searchHistory.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => selectHistoryItem(item)}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {item.pinned && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-medium">
                      Pinned
                    </span>
                  )}
                  <span className="font-mono text-slate-800 text-[11px] truncate">{item.query}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                  <span>{item.resultCount} results</span>
                  <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Live Search Suggestions Dropdown */}
        {activeSuggestions.length > 0 && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-lg shadow-xl z-20 py-1 max-h-60 overflow-y-auto animate-in fade-in duration-150">
            <div className="px-3 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center justify-between border-b border-blue-100 bg-blue-50/50">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-600" />
                JQL & History Auto-Complete Suggestions
              </span>
              <span className="text-[9px] text-slate-400 font-normal">Click or press Tab</span>
            </div>
            {activeSuggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchQuery(sug.label);
                  onSearchSubmit(sug.label);
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-800 hover:bg-blue-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-none"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                      sug.type === 'history'
                        ? 'bg-purple-100 text-purple-700'
                        : sug.type === 'project'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {sug.type === 'history' ? 'History' : sug.type === 'project' ? 'Project' : 'JQL'}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-800 truncate">{sug.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                  <span>{sug.meta}</span>
                  <button
                    type="button"
                    onClick={(e) => handleCopySuggestionJql(sug.label, e)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-600 transition-colors"
                    title="Copy JQL string to clipboard"
                  >
                    {copiedSugLabel === sug.label ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400 hover:text-blue-600" />
                    )}
                  </button>
                  <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Project Selector Chips & Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
        {/* Project Key Filters */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Project:</span>
          <button
            onClick={() => setSelectedProject('ALL')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
              selectedProject === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {availableProjects.map((pKey) => (
            <button
              key={pKey}
              onClick={() => setSelectedProject(pKey)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                selectedProject === pKey
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pKey}
            </button>
          ))}
        </div>

        {/* JQL Guide Trigger Button */}
        <button
          onClick={() => setShowJqlHelp(!showJqlHelp)}
          className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline ml-auto"
        >
          <Code className="w-3 h-3" />
          <span>JQL Helper</span>
        </button>
      </div>

      {/* Quick Filter Preset Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-[11px] no-scrollbar">
        <Zap className="w-3 h-3 text-amber-500 shrink-0" />
        <button
          onClick={() => applyQuickFilter('pinned = true')}
          className={`px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 shadow-xs border ${
            searchQuery.toLowerCase().includes('pinned')
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200'
          }`}
        >
          <Pin className="w-3 h-3 fill-amber-500 text-amber-600 group-hover:text-white" />
          <span>Pinned Tickets</span>
        </button>
        <button
          onClick={() => applyQuickFilter('assignee = currentUser()')}
          className={`px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 shadow-xs border ${
            searchQuery.toLowerCase().includes('assignee = currentuser()') || searchQuery === 'assigned to me'
              ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200'
          }`}
        >
          <UserCheck className="w-3 h-3 text-blue-600 group-hover:text-white" />
          <span>Assigned to Me</span>
        </button>
        <button
          onClick={() => applyQuickFilter('status = "In Progress"')}
          className="px-2 py-0.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full border border-slate-200 font-medium whitespace-nowrap transition-colors"
        >
          In Progress
        </button>
        <button
          onClick={() => applyQuickFilter('type = Bug AND priority = Highest')}
          className="px-2 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-full border border-rose-200/60 font-medium whitespace-nowrap transition-colors"
        >
          Critical Bugs
        </button>
        <button
          onClick={() => applyQuickFilter('status = "To Do"')}
          className="px-2 py-0.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full border border-slate-200 font-medium whitespace-nowrap transition-colors"
        >
          To Do
        </button>
        <button
          onClick={() => applyQuickFilter('status = Done')}
          className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full border border-emerald-200/60 font-medium whitespace-nowrap transition-colors"
        >
          Completed
        </button>
      </div>

      {/* JQL Helper Modal */}
      {showJqlHelp && (
        <JqlHelperModal
          onClose={() => setShowJqlHelp(false)}
          onApplyQuery={(q) => {
            setSearchQuery(q);
            onSearchSubmit(q);
          }}
          currentProjectKey={availableProjects[0] || settings.projectKey || 'PROJ'}
        />
      )}
    </div>
  );
};
