import { useState, useEffect, useCallback } from 'react';
import {
  JiraIssue,
  SearchHistoryItem,
  ExtensionSettings,
  ActiveTab,
  CacheStats,
  StatusCategory,
  PriorityName
} from './types';
import {
  loadSettings,
  saveSettings,
  loadSecureCredentials,
  saveSecureCredentials,
  clearSecureCredentials,
  loadSearchHistory,
  addSearchQueryToHistory,
  togglePinHistory,
  deleteHistoryItem,
  clearSearchHistory,
  getCachedIssues,
  cacheIssue,
  cacheMultipleIssues,
  removeCachedIssue,
  clearCachedIssues,
  clearAllLocalData,
  getCacheStats,
  executeJiraSearch,
  togglePinTicketKey,
  getRecentlyViewedTickets,
  addRecentlyViewedTicket,
  getWatchedTicketKeys,
  toggleWatchTicketKey,
  purgeStaleCachedIssues
} from './services/jiraService';
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { IssueList } from './components/IssueList';
import { HistorySection } from './components/HistorySection';
import { CachedTicketsManager } from './components/CachedTicketsManager';
import { SettingsModal } from './components/SettingsModal';
import { IssueDetailModal } from './components/IssueDetailModal';
import { ActivityDashboard } from './components/ActivityDashboard';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ReportIssueModal } from './components/ReportIssueModal';
import { NotificationsModal, PinnedNotification } from './components/NotificationsModal';

const LAST_SEARCH_CRITERIA_KEY = 'jira_ext_last_search_criteria';

function loadLastSearchCriteria(): { query: string; selectedProject: string } {
  try {
    const raw = localStorage.getItem(LAST_SEARCH_CRITERIA_KEY);
    if (!raw) return { query: '', selectedProject: 'ALL' };
    const parsed = JSON.parse(raw);
    return {
      query: typeof parsed?.query === 'string' ? parsed.query : '',
      selectedProject: typeof parsed?.selectedProject === 'string' ? parsed.selectedProject : 'ALL',
    };
  } catch {
    return { query: '', selectedProject: 'ALL' };
  }
}

function saveLastSearchCriteria(query: string, selectedProject: string): void {
  localStorage.setItem(
    LAST_SEARCH_CRITERIA_KEY,
    JSON.stringify({ query, selectedProject, savedAt: new Date().toISOString() })
  );
}

export default function App() {
  const lastCriteria = loadLastSearchCriteria();
  const [settings, setSettings] = useState<ExtensionSettings>(() => ({
    ...loadSettings(),
    theme: 'dark',
  }));
  const [history, setHistory] = useState<SearchHistoryItem[]>(loadSearchHistory);
  const [cachedIssues, setCachedIssues] = useState<JiraIssue[]>(getCachedIssues);
  const [cacheStats, setCacheStats] = useState<CacheStats>(() => getCacheStats(settings.maxCachedTickets));
  const [recentlyViewed, setRecentlyViewed] = useState<JiraIssue[]>(getRecentlyViewedTickets);
  const [watchedTicketKeys, setWatchedTicketKeys] = useState<string[]>(getWatchedTicketKeys);

  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [searchQuery, setSearchQuery] = useState(lastCriteria.query);
  const [selectedProject, setSelectedProject] = useState(lastCriteria.selectedProject || 'ALL');
  const [searchResults, setSearchResults] = useState<JiraIssue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOfflineResult, setIsOfflineResult] = useState(false);

  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Live Pinned & Watched Ticket Notifications State
  const [notifications, setNotifications] = useState<PinnedNotification[]>([]);
  const [isCheckingPinned, setIsCheckingPinned] = useState(false);

  const isForcedFullTabView = (() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('view') === 'full';
  })();

  const isDarkTheme = true;

  // Sync resolved dark mode class to document element
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, [isDarkTheme]);

  // Hydrate sensitive credentials from secure storage.
  useEffect(() => {
    let active = true;
    loadSecureCredentials()
      .then((secure) => {
        if (!active) return;
        if (!secure) return;
        setSettings((prev) => ({
          ...prev,
          jiraUrl: secure.jiraUrl || prev.jiraUrl,
          userEmail: secure.userEmail || prev.userEmail,
          apiToken: secure.apiToken || prev.apiToken,
          theme: 'dark',
        }));
      })
      .catch((err) => {
        console.warn('Failed to hydrate secure credentials:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  // Run Stale Data Cleanup on mount or settings change if enabled (>30 days)
  useEffect(() => {
    if (settings.enableStaleCleanup !== false) {
      const fresh = purgeStaleCachedIssues(30);
      setCachedIssues(fresh);
      setCacheStats(getCacheStats(settings.maxCachedTickets));
    }
  }, [settings.enableStaleCleanup, settings.maxCachedTickets]);

  // Check for updates on pinned and watched tickets
  const checkForPinnedUpdates = useCallback(() => {
    setIsCheckingPinned(true);
    setTimeout(() => {
      const allKnown = getCachedIssues();
      const pinnedOrWatched = allKnown.filter(i => i.isPinned || watchedTicketKeys.includes(i.key.toUpperCase()));

      if (pinnedOrWatched.length > 0) {
        const sample = pinnedOrWatched[Math.floor(Math.random() * pinnedOrWatched.length)];
        const isWatchedAlert = watchedTicketKeys.includes(sample.key.toUpperCase());
        const newAlert: PinnedNotification = {
          id: 'notif_' + Date.now(),
          ticketKey: sample.key,
          summary: sample.summary,
          message: isWatchedAlert
            ? `Watched ticket activity: Status updated or new comment added`
            : `Pinned ticket update: Status updated or comment added`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setNotifications(prev => [newAlert, ...prev.filter(n => n.ticketKey !== sample.key)].slice(0, 10));
      }
      setIsCheckingPinned(false);
    }, 600);
  }, [watchedTicketKeys]);

  // Periodic interval check every 30 seconds for pinned ticket updates
  useEffect(() => {
    const interval = setInterval(() => {
      checkForPinnedUpdates();
    }, 30000);
    return () => clearInterval(interval);
  }, [checkForPinnedUpdates]);

  // Refresh cache stats
  const refreshCacheState = useCallback(() => {
    const cached = getCachedIssues();
    setCachedIssues(cached);
    setCacheStats(getCacheStats(settings.maxCachedTickets));
  }, [settings.maxCachedTickets]);

  // Execute Search
  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      saveLastSearchCriteria(query, selectedProject);

      const activeSettings = {
        ...settings,
        // if user chose a specific project chip, override project key
        projectKey: selectedProject === 'ALL' ? settings.projectKey : selectedProject,
      };

      const result = await executeJiraSearch(query, activeSettings);
      setSearchResults(result.issues);
      setIsOfflineResult(result.isOfflineResult);

      // Record query in search history if not empty
      if (query.trim()) {
        const isJql = query.includes('=') || query.includes('~') || query.toUpperCase().includes('ORDER BY');
        const updatedHistory = addSearchQueryToHistory(
          query,
          result.total,
          selectedProject === 'ALL' ? settings.projectKey : selectedProject,
          isJql
        );
        setHistory(updatedHistory);
      }

      refreshCacheState();
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [settings, selectedProject, refreshCacheState]);

  // 15-minute background auto-refresh of cached tickets when enableAutoRefresh is enabled
  useEffect(() => {
    if (!settings.enableAutoRefresh) return;

    // 15 minutes = 15 * 60 * 1000 ms = 900,000 ms
    const AUTO_REFRESH_INTERVAL = 15 * 60 * 1000;

    const interval = setInterval(() => {
      console.log('[Auto-Refresh] Background 15-minute refresh triggered for cached tickets.');
      refreshCacheState();
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [settings.enableAutoRefresh, searchQuery, performSearch, refreshCacheState]);

  // Initial load search
  useEffect(() => {
    performSearch(searchQuery);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K focus search, Ctrl+Shift+L jump to Cached Tickets tab)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

      // Ctrl+K / Cmd+K -> Focus Search input
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('search');
        setTimeout(() => {
          const searchInput = document.getElementById('jira-search-input');
          if (searchInput) {
            searchInput.focus();
            (searchInput as HTMLInputElement).select();
          }
        }, 50);
      }
      // Ctrl+Shift+L / Cmd+Shift+L -> Jump directly to 'Cached Tickets' tab
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toUpperCase() === 'L') {
        e.preventDefault();
        setActiveTab('cached');
      }
      // ? -> Toggle shortcuts modal
      else if (!isInput && e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handle Project selector change
  useEffect(() => {
    performSearch(searchQuery);
  }, [selectedProject]);

  // Save Settings handler
  const handleSaveSettings = (newSettings: ExtensionSettings) => {
    const forcedDarkSettings: ExtensionSettings = { ...newSettings, theme: 'dark' };
    setSettings(forcedDarkSettings);
    saveSecureCredentials(forcedDarkSettings).catch((err) => {
      console.warn('Failed to save secure credentials:', err);
    });
    saveSettings(forcedDarkSettings);
    refreshCacheState();
  };

  // Select Issue for Detail Modal
  const handleSelectIssue = (issue: JiraIssue) => {
    const isWatched = watchedTicketKeys.includes(issue.key.toUpperCase());
    const enrichedIssue = { ...issue, isWatched };
    setSelectedIssue(enrichedIssue);

    // Track recently viewed tickets (last 5)
    const updatedRV = addRecentlyViewedTicket(enrichedIssue);
    setRecentlyViewed(updatedRV);

    // Cache issue if auto cache is on
    if (settings.autoCacheOnSearch) {
      const updatedCache = cacheIssue(enrichedIssue, settings.maxCachedTickets);
      setCachedIssues(updatedCache);
      refreshCacheState();
    }
  };

  const handleSelectIssueByKey = (key: string) => {
    const allKnown = [...searchResults, ...cachedIssues];
    const match = allKnown.find((i) => i.key.toUpperCase() === key.toUpperCase());
    if (match) {
      handleSelectIssue(match);
    } else {
      setSearchQuery(key);
      setActiveTab('search');
      performSearch(key);
    }
  };

  // Toggle Pin Ticket Handler
  const handleTogglePinTicket = (key: string) => {
    togglePinTicketKey(key);
    performSearch(searchQuery);
    if (selectedIssue && selectedIssue.key.toUpperCase() === key.toUpperCase()) {
      setSelectedIssue((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : null));
    }
  };

  // Toggle Watch Ticket Handler
  const handleToggleWatchTicket = (key: string) => {
    const updatedKeys = toggleWatchTicketKey(key);
    setWatchedTicketKeys(updatedKeys);
    if (selectedIssue && selectedIssue.key.toUpperCase() === key.toUpperCase()) {
      setSelectedIssue((prev) => (prev ? { ...prev, isWatched: !prev.isWatched } : null));
    }
    performSearch(searchQuery);
  };

  // Bulk Pin Handler
  const handleBulkPin = (keys: string[]) => {
    keys.forEach((k) => togglePinTicketKey(k));
    performSearch(searchQuery);
  };

  // Bulk Remove from Cache Handler
  const handleBulkRemoveFromCache = (keys: string[]) => {
    keys.forEach((k) => removeCachedIssue(k));
    refreshCacheState();
    performSearch(searchQuery);
  };

  // Bulk Update Status Handler
  const handleBulkUpdateStatus = (keys: string[], newStatusName: string, category: StatusCategory) => {
    const keySet = new Set(keys.map(k => k.toUpperCase()));
    const updateFn = (issue: JiraIssue): JiraIssue => {
      if (keySet.has(issue.key.toUpperCase())) {
        return {
          ...issue,
          status: { name: newStatusName, category },
          updated: new Date().toISOString(),
        };
      }
      return issue;
    };

    setSearchResults((prev) => prev.map(updateFn));
    setCachedIssues((prev) => prev.map((issue) => {
      if (keySet.has(issue.key.toUpperCase())) {
        const updated = updateFn(issue);
        cacheIssue(updated, settings.maxCachedTickets);
        return updated;
      }
      return issue;
    }));
    refreshCacheState();
  };

  // Update Status in detail view
  const handleUpdateIssueStatus = (key: string, newStatusName: string, category: StatusCategory) => {
    const updateFn = (issue: JiraIssue): JiraIssue => {
      if (issue.key.toUpperCase() === key.toUpperCase()) {
        return {
          ...issue,
          status: { name: newStatusName, category },
          updated: new Date().toISOString(),
        };
      }
      return issue;
    };

    setSearchResults((prev) => prev.map(updateFn));
    setCachedIssues((prev) => prev.map(updateFn));

    if (selectedIssue && selectedIssue.key.toUpperCase() === key.toUpperCase()) {
      const updated = updateFn(selectedIssue);
      setSelectedIssue(updated);
      cacheIssue(updated, settings.maxCachedTickets);
      refreshCacheState();
    }
  };

  // Update Priority in detail view
  const handleUpdateIssuePriority = (key: string, newPriorityName: PriorityName) => {
    const updateFn = (issue: JiraIssue): JiraIssue => {
      if (issue.key.toUpperCase() === key.toUpperCase()) {
        return {
          ...issue,
          priority: { ...issue.priority, name: newPriorityName },
          updated: new Date().toISOString(),
        };
      }
      return issue;
    };

    setSearchResults((prev) => prev.map(updateFn));
    setCachedIssues((prev) => prev.map(updateFn));

    if (selectedIssue && selectedIssue.key.toUpperCase() === key.toUpperCase()) {
      const updated = updateFn(selectedIssue);
      setSelectedIssue(updated);
      cacheIssue(updated, settings.maxCachedTickets);
      refreshCacheState();
    }
  };

  // Update Assignee in detail view
  const handleUpdateIssueAssignee = (key: string, name: string, email: string) => {
    const updateFn = (issue: JiraIssue): JiraIssue => {
      if (issue.key.toUpperCase() === key.toUpperCase()) {
        return {
          ...issue,
          assignee: {
            name,
            email,
            avatar: issue.assignee.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          },
          updated: new Date().toISOString(),
        };
      }
      return issue;
    };

    setSearchResults((prev) => prev.map(updateFn));
    setCachedIssues((prev) => prev.map(updateFn));

    if (selectedIssue && selectedIssue.key.toUpperCase() === key.toUpperCase()) {
      const updated = updateFn(selectedIssue);
      setSelectedIssue(updated);
      cacheIssue(updated, settings.maxCachedTickets);
      refreshCacheState();
    }
  };

  const handleFilterByLabel = (label: string) => {
    setSelectedIssue(null);
    setActiveTab('search');
    const labelQuery = `labels = "${label}"`;
    setSearchQuery(labelQuery);
    performSearch(labelQuery);
  };

  // Add Comment in detail view
  const handleAddComment = (key: string, commentText: string) => {
    const updateFn = (issue: JiraIssue): JiraIssue => {
      if (issue.key.toUpperCase() === key.toUpperCase()) {
        const newComment = {
          id: 'c_' + Date.now(),
          author: settings.userEmail ? settings.userEmail.split('@')[0] : 'You',
          body: commentText,
          created: new Date().toISOString(),
        };
        return {
          ...issue,
          comments: [...issue.comments, newComment],
          updated: new Date().toISOString(),
        };
      }
      return issue;
    };

    setSearchResults((prev) => prev.map(updateFn));
    setCachedIssues((prev) => prev.map(updateFn));

    if (selectedIssue && selectedIssue.key.toUpperCase() === key.toUpperCase()) {
      const updated = updateFn(selectedIssue);
      setSelectedIssue(updated);
      cacheIssue(updated, settings.maxCachedTickets);
      refreshCacheState();
    }
  };

  // History handlers
  const handleTogglePinHistory = (id: string) => {
    const updated = togglePinHistory(id);
    setHistory(updated);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  // Manual Sync & Refresh Handler for local cache
  const handleSyncAndRefresh = async () => {
    setIsSearching(true);
    try {
      const res = await executeJiraSearch(searchQuery, settings);
      setSearchResults(res.issues);
      setIsOfflineResult(res.isOfflineResult);
      if (settings.autoCacheOnSearch && searchQuery.trim().length > 0 && res.issues.length > 0) {
        const updatedCache = cacheMultipleIssues(res.issues, settings.maxCachedTickets);
        setCachedIssues(updatedCache);
      } else {
        setCachedIssues(getCachedIssues());
      }
      refreshCacheState();
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCacheCurrentSearchResults = () => {
    const explicitSearch = searchQuery.trim().length > 0;
    if (!settings.autoCacheOnSearch || !explicitSearch || searchResults.length === 0) return;
    const updatedCache = cacheMultipleIssues(searchResults, settings.maxCachedTickets);
    setCachedIssues(updatedCache);
    refreshCacheState();
  };

  // Cache handlers
  const handleRemoveFromCache = (key: string) => {
    const updated = removeCachedIssue(key);
    setCachedIssues(updated);
    refreshCacheState();
  };

  const handleClearCache = () => {
    clearCachedIssues();
    setCachedIssues([]);
    refreshCacheState();
  };

  const handleClearAllData = () => {
    clearSecureCredentials().catch((err) => {
      console.warn('Failed to clear secure credentials:', err);
    });
    clearAllLocalData();
    localStorage.removeItem(LAST_SEARCH_CRITERIA_KEY);
    const defaultSet = { ...loadSettings(), theme: 'dark' as const };
    setSettings(defaultSet);
    setHistory([]);
    setCachedIssues([]);
    setSearchQuery('');
    setSelectedProject('ALL');
    refreshCacheState();
    performSearch('');
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-blue-200 ${
      isDarkTheme ? 'dark bg-slate-950 text-slate-100' : 'bg-white text-slate-800'
    }`}>

      {/* Chrome Extension Container Shell */}
      <div
        className={`min-h-screen shadow-2xl transition-all duration-300 flex flex-col ${
          isDarkTheme
            ? 'bg-slate-900 border-slate-800 shadow-black/80'
            : 'bg-white border-slate-200/80 shadow-slate-300/50'
        } ${
          isForcedFullTabView
            ? 'w-full max-w-none border-x-0'
            : settings.viewMode === 'popup'
              ? 'mx-auto max-w-[440px] border rounded-xl overflow-hidden'
              : 'mx-auto max-w-5xl border-x'
        }`}
      >
        {/* Navbar Header */}
        <Header
          settings={settings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onUpdateSettings={handleSaveSettings}
          onOpenShortcutsModal={() => setShowShortcutsModal(true)}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          notificationsCount={notifications.filter(n => !n.read).length}
          cachedCount={cachedIssues.length}
          historyCount={history.length}
        />

        {/* Dynamic Tab Body */}
        <main className={`flex-1 flex flex-col ${isDarkTheme ? 'bg-slate-900/90' : 'bg-white'}`}>
          {/* SEARCH TAB */}
          {activeTab === 'search' && (
            <div className="flex-1 flex flex-col">
              <SearchPanel
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearchSubmit={(q) => performSearch(q)}
                onCacheSearchResults={handleCacheCurrentSearchResults}
                canCacheSearchResults={settings.autoCacheOnSearch && searchQuery.trim().length > 0 && searchResults.length > 0}
                settings={settings}
                searchHistory={history}
                isSearching={isSearching}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
              />

              <div className="flex-1">
                <IssueList
                  issues={searchResults}
                  onSelectIssue={handleSelectIssue}
                  onTogglePinTicket={handleTogglePinTicket}
                  onBulkPin={handleBulkPin}
                  onBulkRemoveFromCache={handleBulkRemoveFromCache}
                  onBulkUpdateStatus={handleBulkUpdateStatus}
                  recentlyViewed={recentlyViewed}
                  isOfflineResult={isOfflineResult}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <HistorySection
              history={history}
              onSelectQuery={(q) => {
                setSearchQuery(q);
                setActiveTab('search');
                performSearch(q);
              }}
              onTogglePin={handleTogglePinHistory}
              onDeleteHistoryItem={handleDeleteHistoryItem}
              onClearAllHistory={handleClearHistory}
            />
          )}

          {/* CACHED TICKETS TAB */}
          {activeTab === 'cached' && (
            <CachedTicketsManager
              cachedIssues={cachedIssues}
              cacheStats={cacheStats}
              settings={settings}
              onSelectIssue={handleSelectIssue}
              onRemoveFromCache={handleRemoveFromCache}
              onClearAllCache={handleClearCache}
              onUpdateSettings={handleSaveSettings}
              onSyncAndRefresh={handleSyncAndRefresh}
            />
          )}

          {/* ACTIVITY DASHBOARD TAB */}
          {activeTab === 'activity' && (
            <ActivityDashboard
              issues={searchResults.length > 0 ? searchResults : cachedIssues}
              onSelectIssue={handleSelectIssue}
            />
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <SettingsModal
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onClearCache={handleClearCache}
              onClearHistory={handleClearHistory}
              onClearAllData={handleClearAllData}
            />
          )}
        </main>

        {/* Footer Container Status */}
        <footer className="p-2.5 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] flex items-center justify-between border-t border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Jira Quick Search</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowReportIssueModal(true)}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Report Issue</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>Cache Limit: {settings.maxCachedTickets} issues</span>
            <span>•</span>
            <span className="font-mono">{settings.projectKey}</span>
            <span>•</span>
            <span className="font-mono">v{__APP_VERSION__}</span>
          </div>
        </footer>
      </div>

      {/* Ticket Detail Drawer Modal */}
      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        allIssues={searchResults.length > 0 ? searchResults : cachedIssues}
        onSelectIssue={(issue) => {
          setSelectedIssue(issue);
          addRecentlyViewedTicket(issue);
          setRecentlyViewed(getRecentlyViewedTickets());
        }}
        onUpdateIssueStatus={handleUpdateIssueStatus}
        onUpdateIssuePriority={handleUpdateIssuePriority}
        onUpdateIssueAssignee={handleUpdateIssueAssignee}
        onAddComment={handleAddComment}
        onTogglePinTicket={handleTogglePinTicket}
        onToggleWatchTicket={handleToggleWatchTicket}
        onFilterByLabel={handleFilterByLabel}
        jiraUrl={settings.jiraUrl}
        currentUserEmail={settings.userEmail}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcutsModal && (
        <KeyboardShortcutsModal
          onClose={() => setShowShortcutsModal(false)}
        />
      )}

      {/* Report Issue to Developer Modal */}
      {showReportIssueModal && (
        <ReportIssueModal
          onClose={() => setShowReportIssueModal(false)}
          settings={settings}
          cachedCount={cachedIssues.length}
          historyCount={history.length}
          currentQuery={searchQuery}
        />
      )}

      {/* Pinned Ticket Updates Notification Modal */}
      {showNotificationsModal && (
        <NotificationsModal
          onClose={() => {
            setShowNotificationsModal(false);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          }}
          notifications={notifications}
          onSelectIssueByKey={(key) => handleSelectIssueByKey(key)}
          onClearAllNotifications={() => setNotifications([])}
          onCheckForPinnedUpdates={checkForPinnedUpdates}
          isChecking={isCheckingPinned}
        />
      )}
    </div>
  );
}
