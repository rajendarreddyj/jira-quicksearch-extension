import React, { useState, useEffect } from 'react';
import { ExtensionSettings, SearchHistoryItem } from '../types';
import { Search, X, Filter, Code, Clock, ArrowRight, Zap, HelpCircle, UserCheck, Pin } from 'lucide-react';

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

  const availableProjects = settings.projectKey
    ? settings.projectKey.split(',').map(p => p.trim()).filter(Boolean)
    : [];

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

          {/* Right Action Icons & Shortcut badge */}
          <div className="absolute right-2 flex items-center gap-1.5">
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

      {/* JQL Helper Modal / Card */}
      {showJqlHelp && (
        <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs space-y-2 border border-slate-800 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-semibold border-b border-slate-800 pb-1 text-blue-300">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Jira Query Language (JQL) Cheatsheet
            </span>
            <button onClick={() => setShowJqlHelp(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div 
              onClick={() => applyQuickFilter('project = PROJ AND status = "In Progress"')}
              className="p-1.5 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <span className="text-emerald-400">project</span> = "PROJ" <span className="text-amber-300">AND</span> status = "In Progress"
            </div>
            <div 
              onClick={() => applyQuickFilter('priority IN (High, Highest)')}
              className="p-1.5 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <span className="text-emerald-400">priority</span> <span className="text-purple-300">IN</span> (High, Highest)
            </div>
            <div 
              onClick={() => applyQuickFilter('summary ~ "cache" OR text ~ "storage"')}
              className="p-1.5 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <span className="text-emerald-400">summary</span> ~ "cache" <span className="text-amber-300">OR</span> text ~ "storage"
            </div>
            <div 
              onClick={() => applyQuickFilter('updated >= -7d ORDER BY updated DESC')}
              className="p-1.5 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <span className="text-emerald-400">updated</span> &gt;= -7d <span className="text-blue-300">ORDER BY</span> updated DESC
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
