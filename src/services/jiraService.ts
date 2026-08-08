import { JiraIssue, SearchHistoryItem, ExtensionSettings, CacheStats } from '../types';
import { INITIAL_SETTINGS, MOCK_ISSUES, INITIAL_SEARCH_HISTORY } from '../data/mockData';

const SETTINGS_KEY = 'jira_ext_settings';
const HISTORY_KEY = 'jira_ext_history';
const CACHED_ISSUES_KEY = 'jira_ext_cached_issues';
const PINNED_TICKETS_KEY = 'jira_ext_pinned_tickets';
const WATCHED_TICKETS_KEY = 'jira_ext_watched_tickets';
const RECENTLY_VIEWED_KEY = 'jira_ext_recently_viewed';

function isExtensionRuntime(): boolean {
  return typeof window !== 'undefined' && !!(window as any).chrome?.runtime?.id;
}

function normalizeJiraUrl(jiraUrl: string): string {
  return jiraUrl.replace(/\/+$/, '');
}

function isLikelyJql(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  return (
    /order\s+by/i.test(q) ||
    /[=~()]/.test(q) ||
    /\b(and|or|in|is|not|status|project|assignee|reporter|issuetype|priority|labels|issuekey)\b/i.test(q)
  );
}

function splitOrderByClause(query: string): { criteria: string; orderBy: string } {
  const orderMatch = /\border\s+by\b/i.exec(query);
  if (!orderMatch || orderMatch.index < 0) {
    return { criteria: query.trim(), orderBy: '' };
  }

  const criteria = query.slice(0, orderMatch.index).trim();
  const orderBy = query.slice(orderMatch.index).trim();
  return { criteria, orderBy };
}

function buildJql(projectKey: string, query: string): string {
  let jql = '';
  if (projectKey) {
    const keys = projectKey.split(',').map((k) => k.trim()).filter(Boolean);
    if (keys.length === 1) {
      jql = `project = "${keys[0]}"`;
    } else if (keys.length > 1) {
      jql = `project IN (${keys.map((k) => `"${k}"`).join(',')})`;
    }
  }

  const trimmed = (query || '').trim();
  if (trimmed) {
    if (isLikelyJql(trimmed)) {
      const { criteria, orderBy } = splitOrderByClause(trimmed);

      if (criteria) {
        jql = jql ? `(${jql}) AND ${criteria}` : criteria;
      }
      if (orderBy) {
        jql = jql ? `${jql} ${orderBy}` : orderBy;
      }
    } else if (/^[A-Z0-9]+-\d+$/i.test(trimmed)) {
      jql = `issueKey = "${trimmed.toUpperCase()}"`;
    } else {
      const textCondition = `(summary ~ "${trimmed}*" OR text ~ "${trimmed}*")`;
      jql = jql ? `${jql} AND ${textCondition}` : textCondition;
    }
  }

  if (!jql) {
    return 'order by updated DESC';
  }
  if (!/order\s+by/i.test(jql)) {
    return `${jql} ORDER BY updated DESC`;
  }
  return jql;
}

function sanitizeOrderByParentheses(jql: string): string {
  // Defensive normalization: Jira rejects ORDER BY inside a parenthesized condition block.
  // Example fix: (reporter = currentUser() ORDER BY created DESC) -> reporter = currentUser() ORDER BY created DESC
  return jql.replace(/\(\s*([^()]+?)\s+(ORDER\s+BY\b[^)]*)\)/gi, '$1 $2');
}

function buildProjectClause(projectKey: string): string {
  const keys = (projectKey || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return '';
  if (keys.length === 1) return `project = "${keys[0]}"`;
  return `project IN (${keys.map((k) => `"${k}"`).join(',')})`;
}

function prepareProxySearchPayload(
  projectKey: string,
  query: string,
): { projectKey: string; query: string } {
  const trimmedQuery = (query || '').trim();
  if (!trimmedQuery || !projectKey || !isLikelyJql(trimmedQuery)) {
    return { projectKey, query };
  }

  // If query already constrains project, do not inject another project clause.
  if (/\bproject\s*(=|in)\b/i.test(trimmedQuery)) {
    return { projectKey, query: sanitizeOrderByParentheses(trimmedQuery) };
  }

  const projectClause = buildProjectClause(projectKey);
  if (!projectClause) {
    return { projectKey, query: sanitizeOrderByParentheses(trimmedQuery) };
  }

  const mergedJql = sanitizeOrderByParentheses(`${projectClause} AND ${trimmedQuery}`);
  // Clear projectKey so proxy does not merge again (important for older server builds).
  return { projectKey: '', query: mergedJql };
}

function toPlainText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value.map((item) => toPlainText(item)).filter(Boolean).join(' ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    if (typeof record.value === 'string') return record.value;
    if (record.content != null) return toPlainText(record.content);
    return '';
  }
  return String(value);
}

function mapJiraApiIssue(issue: any, cleanUrl: string): JiraIssue {
  return {
    key: issue.key,
    summary: issue.fields?.summary || 'No Summary',
    status: {
      name: issue.fields?.status?.name || 'To Do',
      category:
        (issue.fields?.status?.statusCategory?.key || 'new') === 'done'
          ? 'done'
          : issue.fields?.status?.statusCategory?.key === 'indeterminate'
            ? 'in-progress'
            : 'to-do',
    },
    priority: {
      name: issue.fields?.priority?.name || 'Medium',
      icon: issue.fields?.priority?.iconUrl || '',
    },
    issueType: {
      name: issue.fields?.issuetype?.name || 'Task',
      icon: issue.fields?.issuetype?.iconUrl || '',
    },
    assignee: issue.fields?.assignee
      ? {
          name: issue.fields.assignee.displayName,
          avatar: issue.fields.assignee.avatarUrls?.['48x48'] || issue.fields.assignee.avatarUrls?.['32x32'],
          email: issue.fields.assignee.emailAddress || '',
        }
      : { name: 'Unassigned', avatar: '', email: '' },
    reporter: issue.fields?.reporter
      ? {
          name: issue.fields.reporter.displayName,
          avatar: issue.fields.reporter.avatarUrls?.['48x48'],
        }
      : { name: 'System', avatar: '' },
    description: toPlainText(issue.fields?.description) || 'No description provided.',
    created: issue.fields?.created || new Date().toISOString(),
    updated: issue.fields?.updated || new Date().toISOString(),
    components: (issue.fields?.components || []).map((c: any) => c.name),
    labels: issue.fields?.labels || [],
    comments: (issue.fields?.comment?.comments || []).map((cmt: any) => ({
      id: cmt.id,
      author: cmt.author?.displayName || 'User',
      body: toPlainText(cmt.body),
      created: cmt.created,
    })),
    url: `${cleanUrl}/browse/${issue.key}`,
  };
}

async function searchJiraLive(
  query: string,
  settings: ExtensionSettings,
  maxResults: number,
): Promise<{ issues: JiraIssue[]; total: number } | null> {
  const cleanUrl = normalizeJiraUrl(settings.jiraUrl);
  const preferDirect = isExtensionRuntime();
  // In regular web mode (localhost), direct Jira calls trigger CORS.
  // Use the local proxy only; keep direct calls for extension runtime.
  const attempts: Array<'direct' | 'proxy'> = preferDirect ? ['direct', 'proxy'] : ['proxy'];

  for (const attempt of attempts) {
    try {
      if (attempt === 'proxy') {
        const proxyPayload = prepareProxySearchPayload(settings.projectKey, query);
        const response = await fetch('/api/jira/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jiraUrl: settings.jiraUrl,
            email: settings.userEmail,
            apiToken: settings.apiToken,
            projectKey: proxyPayload.projectKey,
            query: proxyPayload.query,
            maxResults,
          }),
        });

        if (!response.ok) continue;
        const data = await response.json();
        return { issues: data.issues || [], total: data.total || 0 };
      }

      const jql = sanitizeOrderByParentheses(buildJql(settings.projectKey, query));
      const auth = btoa(`${settings.userEmail}:${settings.apiToken}`);

      // Prefer the current Jira endpoint first, then fall back for older tenants.
      const directRequests: Array<{ url: string; init: RequestInit }> = [
        {
          url: `${cleanUrl}/rest/api/3/search/jql`,
          init: {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
              jql,
              maxResults,
              fields: [
                'summary',
                'status',
                'priority',
                'issuetype',
                'assignee',
                'reporter',
                'created',
                'updated',
                'description',
                'components',
                'labels',
                'comment',
              ],
            }),
          },
        },
        {
          url: `${cleanUrl}/rest/api/3/search`,
          init: {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
              jql,
              maxResults,
              fields: [
                'summary',
                'status',
                'priority',
                'issuetype',
                'assignee',
                'reporter',
                'created',
                'updated',
                'description',
                'components',
                'labels',
                'comment',
              ],
            }),
          },
        },
        {
          url: `${cleanUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=summary,status,priority,issuetype,assignee,reporter,created,updated,description,components,labels,comment`,
          init: {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Basic ${auth}`,
            },
          },
        },
      ];

      for (const request of directRequests) {
        const response = await fetch(request.url, request.init);
        if (!response.ok) continue;

        const data = await response.json();
        const liveIssues: JiraIssue[] = (data.issues || []).map((issue: any) => mapJiraApiIssue(issue, cleanUrl));
        return { issues: liveIssues, total: data.total || liveIssues.length };
      }
    } catch {
      // Try next strategy.
    }
  }

  return null;
}

// --- WATCHED TICKETS MANAGEMENT ---
export function getWatchedTicketKeys(): string[] {
  try {
    const raw = localStorage.getItem(WATCHED_TICKETS_KEY);
    if (!raw) {
      const initial: string[] = [];
      localStorage.setItem(WATCHED_TICKETS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function toggleWatchTicketKey(key: string): string[] {
  const current = getWatchedTicketKeys();
  const upperKey = key.toUpperCase();
  let updated: string[];
  if (current.includes(upperKey)) {
    updated = current.filter(k => k !== upperKey);
  } else {
    updated = [upperKey, ...current];
  }
  try {
    localStorage.setItem(WATCHED_TICKETS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save watched tickets:', e);
  }
  return updated;
}

// --- RECENTLY VIEWED TICKETS MANAGEMENT ---
export function getRecentlyViewedTickets(): JiraIssue[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function addRecentlyViewedTicket(issue: JiraIssue): JiraIssue[] {
  const current = getRecentlyViewedTickets();
  const filtered = current.filter(i => i.key.toUpperCase() !== issue.key.toUpperCase());
  const updated = [issue, ...filtered].slice(0, 5); // keep max 5
  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recently viewed tickets:', e);
  }
  return updated;
}

// --- PINNED TICKETS MANAGEMENT ---
export function getPinnedTicketKeys(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_TICKETS_KEY);
    if (!raw) {
      const initial: string[] = [];
      localStorage.setItem(PINNED_TICKETS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function togglePinTicketKey(key: string): string[] {
  const current = getPinnedTicketKeys();
  const upperKey = key.toUpperCase();
  let updated: string[];
  if (current.includes(upperKey)) {
    updated = current.filter(k => k !== upperKey);
  } else {
    updated = [upperKey, ...current];
  }
  try {
    localStorage.setItem(PINNED_TICKETS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save pinned tickets:', e);
  }
  return updated;
}

// --- SETTINGS MANAGEMENT ---
export function loadSettings(): ExtensionSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      const defaultDark = { ...INITIAL_SETTINGS, theme: 'dark' as const };
      saveSettings(defaultDark);
      return defaultDark;
    }
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw), theme: 'dark' };
  } catch (e) {
    return { ...INITIAL_SETTINGS, theme: 'dark' };
  }
}

export function saveSettings(settings: ExtensionSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, theme: 'dark' }));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

// --- SEARCH HISTORY MANAGEMENT ---
export function loadSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(INITIAL_SEARCH_HISTORY));
      return INITIAL_SEARCH_HISTORY;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_SEARCH_HISTORY;
  }
}

export function saveSearchHistory(history: SearchHistoryItem[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save search history:', e);
  }
}

export function addSearchQueryToHistory(
  query: string,
  resultCount: number,
  projectKey: string,
  isJql: boolean = false
): SearchHistoryItem[] {
  if (!query || !query.trim()) return loadSearchHistory();

  const history = loadSearchHistory();
  const cleanQuery = query.trim();

  // Remove existing duplicate non-pinned query if present
  const filtered = history.filter(item => !(item.query.toLowerCase() === cleanQuery.toLowerCase() && !item.pinned));

  const newItem: SearchHistoryItem = {
    id: 'h_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    query: cleanQuery,
    timestamp: new Date().toISOString(),
    resultCount,
    projectKey,
    pinned: false,
    isJql,
  };

  // Keep pinned items at top, then new search item
  const pinnedItems = filtered.filter(i => i.pinned);
  const unpinnedItems = filtered.filter(i => !i.pinned);

  const updated = [...pinnedItems, newItem, ...unpinnedItems].slice(0, 50); // keep last 50
  saveSearchHistory(updated);
  return updated;
}

export function togglePinHistory(id: string): SearchHistoryItem[] {
  const history = loadSearchHistory();
  const updated = history.map(item => item.id === id ? { ...item, pinned: !item.pinned } : item);
  saveSearchHistory(updated);
  return updated;
}

export function deleteHistoryItem(id: string): SearchHistoryItem[] {
  const history = loadSearchHistory();
  const updated = history.filter(item => item.id !== id);
  saveSearchHistory(updated);
  return updated;
}

export function clearSearchHistory(): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
}

// --- CACHED TICKETS MANAGEMENT ---
export function getCachedIssues(): JiraIssue[] {
  try {
    const raw = localStorage.getItem(CACHED_ISSUES_KEY);
    if (!raw) {
      const initialCache: JiraIssue[] = [];
      localStorage.setItem(CACHED_ISSUES_KEY, JSON.stringify(initialCache));
      return initialCache;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function getCachedIssueByKey(key: string): JiraIssue | undefined {
  const cached = getCachedIssues();
  return cached.find(i => i.key.toUpperCase() === key.toUpperCase());
}

export function cacheIssue(issue: JiraIssue, maxLimit: number = 20): JiraIssue[] {
  let cached = getCachedIssues();
  const key = issue.key.toUpperCase();

  // Enrich with cached timestamp
  const issueToCache: JiraIssue = {
    ...issue,
    cachedAt: new Date().toISOString(),
    isCachedOffline: true,
  };

  // Remove existing instance if already present
  cached = cached.filter(i => i.key.toUpperCase() !== key);

  // Add at top (most recent)
  cached.unshift(issueToCache);

  // Enforce Max Cached Tickets limit
  if (cached.length > maxLimit) {
    cached = cached.slice(0, maxLimit);
  }

  try {
    localStorage.setItem(CACHED_ISSUES_KEY, JSON.stringify(cached));
  } catch (e) {
    console.error('LocalStorage quota exceeded when caching ticket:', e);
  }

  return cached;
}

export function cacheMultipleIssues(issues: JiraIssue[], maxLimit: number = 20): JiraIssue[] {
  const settings = loadSettings();
  if (!settings.autoCacheOnSearch) return getCachedIssues();

  let cached = getCachedIssues();
  const cachedKeysMap = new Map(cached.map(i => [i.key.toUpperCase(), i]));

  const now = new Date().toISOString();
  issues.forEach(issue => {
    cachedKeysMap.set(issue.key.toUpperCase(), {
      ...issue,
      cachedAt: now,
      isCachedOffline: true,
    });
  });

  // Convert back to array sorted by cachedAt desc
  let updatedList = Array.from(cachedKeysMap.values()).sort((a, b) => {
    const timeA = new Date(a.cachedAt || 0).getTime();
    const timeB = new Date(b.cachedAt || 0).getTime();
    return timeB - timeA;
  });

  if (updatedList.length > maxLimit) {
    updatedList = updatedList.slice(0, maxLimit);
  }

  try {
    localStorage.setItem(CACHED_ISSUES_KEY, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Failed to cache batch issues:', e);
  }

  return updatedList;
}

export function removeCachedIssue(key: string): JiraIssue[] {
  const cached = getCachedIssues();
  const updated = cached.filter(i => i.key.toUpperCase() !== key.toUpperCase());
  localStorage.setItem(CACHED_ISSUES_KEY, JSON.stringify(updated));
  return updated;
}

export function purgeStaleCachedIssues(maxDays: number = 30): JiraIssue[] {
  const cached = getCachedIssues();
  const now = Date.now();
  const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;

  const fresh = cached.filter(issue => {
    const checkDate = issue.lastViewedAt || issue.cachedAt || issue.updated;
    if (!checkDate) return true;
    const ageMs = now - new Date(checkDate).getTime();
    return ageMs < maxAgeMs;
  });

  localStorage.setItem(CACHED_ISSUES_KEY, JSON.stringify(fresh));
  return fresh;
}

export async function syncAndRefreshAllCachedIssues(settings: ExtensionSettings): Promise<JiraIssue[]> {
  const cached = getCachedIssues();
  if (cached.length === 0) return [];

  // If online with credentials, attempt background refresh via API proxy
  if (!settings.isSimulatedOffline && settings.jiraUrl && settings.apiToken && settings.userEmail) {
    try {
      const keysToRefresh = cached.map(i => i.key).join(', ');
      const liveResult = await searchJiraLive(`issueKey in (${keysToRefresh})`, settings, cached.length);
      if (liveResult && liveResult.issues.length > 0) {
        const updatedCache = cacheMultipleIssues(liveResult.issues, settings.maxCachedTickets);
        return updatedCache;
      }
    } catch (e) {
      console.warn('Background sync failed, using touch refresh fallback:', e);
    }
  }

  // Fallback: refresh timestamps on cached items
  const now = new Date().toISOString();
  const refreshed = cached.map(issue => ({
    ...issue,
    cachedAt: now,
    updated: now,
  }));
  localStorage.setItem(CACHED_ISSUES_KEY, JSON.stringify(refreshed));
  return refreshed;
}

export function clearCachedIssues(): void {
  localStorage.setItem(CACHED_ISSUES_KEY, JSON.stringify([]));
}

export function clearAllMockDataAndPrepareProduction(): void {
  localStorage.setItem(CACHED_ISSUES_KEY, JSON.stringify([]));
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
  localStorage.setItem(PINNED_TICKETS_KEY, JSON.stringify([]));
  localStorage.setItem(WATCHED_TICKETS_KEY, JSON.stringify([]));
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([]));
}

export function clearAllLocalData(): void {
  localStorage.removeItem(CACHED_ISSUES_KEY);
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(PINNED_TICKETS_KEY);
  localStorage.removeItem(WATCHED_TICKETS_KEY);
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
}

export function getCacheStats(maxLimit: number): CacheStats {
  const cached = getCachedIssues();
  const rawStr = localStorage.getItem(CACHED_ISSUES_KEY) || '';
  const estimatedBytes = new Blob([rawStr]).size;

  let oldestTicketDate: string | undefined = undefined;
  let newestTicketDate: string | undefined = undefined;

  if (cached.length > 0) {
    const sorted = [...cached].sort((a, b) => {
      const timeA = new Date(a.cachedAt || 0).getTime();
      const timeB = new Date(b.cachedAt || 0).getTime();
      return timeA - timeB;
    });
    oldestTicketDate = sorted[0]?.cachedAt;
    newestTicketDate = sorted[sorted.length - 1]?.cachedAt;
  }

  return {
    totalCached: cached.length,
    maxLimit,
    estimatedBytes,
    oldestTicketDate,
    newestTicketDate,
  };
}

// --- JIRA SEARCH ENGINE (ONLINE / OFFLINE FALLBACK) ---
export async function executeJiraSearch(
  query: string,
  settings: ExtensionSettings
): Promise<{ issues: JiraIssue[]; total: number; isOfflineResult: boolean }> {
  // If user toggled simulated offline OR browser is offline
  if (settings.isSimulatedOffline || !navigator.onLine) {
    return searchLocalCacheAndMocks(query, settings);
  }

  // Attempt real API call via server proxy if API token is present or test server connection
  if (settings.jiraUrl && settings.apiToken && settings.userEmail) {
    try {
      const liveResult = await searchJiraLive(query, settings, settings.maxCachedTickets);
      if (liveResult) {
        const liveIssues = liveResult.issues;
        // Auto-cache only for explicit (non-empty) searches.
        const hasExplicitQuery = query.trim().length > 0;
        if (settings.autoCacheOnSearch && hasExplicitQuery && liveIssues.length > 0) {
          cacheMultipleIssues(liveIssues, settings.maxCachedTickets);
        }
        return { issues: liveIssues, total: liveResult.total, isOfflineResult: false };
      }
    } catch (err) {
      console.warn('Real Jira search proxy unreachable or failed, falling back to local dataset:', err);
    }
  }

  // Local dataset search (Mock + Cached items)
  return searchLocalCacheAndMocks(query, settings);
}

function searchLocalCacheAndMocks(
  query: string,
  settings: ExtensionSettings
): { issues: JiraIssue[]; total: number; isOfflineResult: boolean } {
  const cached = getCachedIssues();
  const cachedKeys = new Set(cached.map(c => c.key.toUpperCase()));

  // Combine cached issues with mock issues
  const combined = [...cached];
  MOCK_ISSUES.forEach(mock => {
    if (!cachedKeys.has(mock.key.toUpperCase())) {
      combined.push(mock);
    }
  });

  const cleanQuery = query.trim().toLowerCase();
  const projectKeys = settings.projectKey
    ? settings.projectKey.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    : [];

  let filtered = combined;

  // Filter by project key if specified
  if (projectKeys.length > 0) {
    filtered = filtered.filter(issue => {
      const issueProj = issue.key.split('-')[0]?.toLowerCase();
      return projectKeys.includes(issueProj);
    });
  }

  // Search filter
  const pinnedKeys = getPinnedTicketKeys();

  if (cleanQuery) {
    const userEmail = (settings.userEmail || '').toLowerCase();
    const userHandle = userEmail.split('@')[0] || '';

    if (
      cleanQuery.includes('pinned = true') ||
      cleanQuery.includes('pinned=true') ||
      cleanQuery.includes('is:pinned') ||
      cleanQuery === 'pinned' ||
      cleanQuery === 'pinned tickets'
    ) {
      filtered = filtered.filter(i => pinnedKeys.includes(i.key.toUpperCase()));
    } else if (
      cleanQuery.includes('assignee = currentuser()') ||
      cleanQuery.includes('assignee=currentuser()') ||
      cleanQuery === 'assigned to me' ||
      cleanQuery === 'my tickets' ||
      cleanQuery === 'assignee = me'
    ) {
      filtered = filtered.filter(i => {
        const emailMatch = userEmail.length > 0 && i.assignee.email?.toLowerCase() === userEmail;
        const nameMatch = userHandle.length > 0 && i.assignee.name.toLowerCase().includes(userHandle);
        return emailMatch || nameMatch;
      });
    } else if (cleanQuery.startsWith('status =')) {
      const statusVal = cleanQuery.replace('status =', '').replace(/"/g, '').trim();
      filtered = filtered.filter(i => toPlainText(i.status.name).toLowerCase().includes(statusVal));
    } else if (cleanQuery.includes('labels =') || cleanQuery.includes('label =')) {
      const labelVal = cleanQuery.replace(/labels?\s*=\s*/, '').replace(/"/g, '').trim();
      filtered = filtered.filter(i => (i.labels || []).some(l => toPlainText(l).toLowerCase().includes(labelVal.toLowerCase())));
    } else if (/^[a-z0-9]+-\d+$/i.test(cleanQuery)) {
      filtered = filtered.filter(i => i.key.toLowerCase() === cleanQuery);
    } else {
      filtered = filtered.filter(i =>
        toPlainText(i.key).toLowerCase().includes(cleanQuery) ||
        toPlainText(i.summary).toLowerCase().includes(cleanQuery) ||
        toPlainText(i.description).toLowerCase().includes(cleanQuery) ||
        (i.labels || []).some(l => toPlainText(l).toLowerCase().includes(cleanQuery)) ||
        (i.components || []).some(c => toPlainText(c).toLowerCase().includes(cleanQuery)) ||
        toPlainText(i.assignee?.name).toLowerCase().includes(cleanQuery) ||
        toPlainText(i.assignee?.email).toLowerCase().includes(cleanQuery)
      );
    }
  }

  // Sort
  if (settings.defaultSort === 'created_desc') {
    filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  } else if (settings.defaultSort === 'priority_desc') {
    const pRank: Record<string, number> = { Highest: 5, High: 4, Medium: 3, Low: 2, Lowest: 1 };
    filtered.sort((a, b) => (pRank[b.priority.name] || 0) - (pRank[a.priority.name] || 0));
  } else if (settings.defaultSort === 'key_asc') {
    filtered.sort((a, b) => a.key.localeCompare(b.key));
  } else {
    // updated_desc
    filtered.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
  }

  // Sort pinned tickets to top if not specifically querying something else
  const isPinnedQuery = cleanQuery.includes('pinned');
  if (!isPinnedQuery) {
    filtered.sort((a, b) => {
      const aPinned = pinnedKeys.includes(a.key.toUpperCase()) ? 1 : 0;
      const bPinned = pinnedKeys.includes(b.key.toUpperCase()) ? 1 : 0;
      return bPinned - aPinned;
    });
  }

  // Mark whether each item is cached offline & pinned
  const enriched = filtered.map(issue => {
    const isCached = cachedKeys.has(issue.key.toUpperCase());
    const isPinned = pinnedKeys.includes(issue.key.toUpperCase());
    return {
      ...issue,
      isCachedOffline: isCached || settings.isSimulatedOffline,
      cachedAt: isCached ? getCachedIssueByKey(issue.key)?.cachedAt : issue.cachedAt,
      isPinned,
    };
  });

  return {
    issues: enriched,
    total: enriched.length,
    isOfflineResult: true,
  };
}
