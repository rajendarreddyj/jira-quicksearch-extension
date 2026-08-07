export type StatusCategory = 'to-do' | 'in-progress' | 'done';

export interface JiraStatus {
  name: string;
  category: StatusCategory;
}

export type PriorityName = 'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest';

export interface JiraPriority {
  name: PriorityName;
  color?: string;
  icon?: string;
}

export interface JiraIssueType {
  name: 'Bug' | 'Task' | 'Story' | 'Epic' | 'Subtask' | 'Improvement';
  icon?: string;
}

export interface JiraUser {
  name: string;
  avatar?: string;
  email?: string;
}

export interface JiraComment {
  id: string;
  author: string;
  body: string;
  created: string;
  isDraft?: boolean;
}

export interface StatusDuration {
  statusName: string;
  category: StatusCategory;
  hours: number;
}

export interface JiraSubtask {
  key: string;
  summary: string;
  status: JiraStatus;
  assignee?: JiraUser;
}

export interface TimeTrackingInfo {
  originalEstimateSeconds?: number;
  timeSpentSeconds?: number;
  remainingEstimateSeconds?: number;
  originalEstimateText?: string;
  timeSpentText?: string;
  remainingEstimateText?: string;
}

export interface JiraIssue {
  key: string;
  summary: string;
  status: JiraStatus;
  priority: JiraPriority;
  issueType: JiraIssueType;
  assignee: JiraUser;
  reporter: JiraUser;
  description: string;
  created: string;
  updated: string;
  components: string[];
  labels: string[];
  comments: JiraComment[];
  url: string;
  cachedAt?: string;
  isCachedOffline?: boolean;
  storyPoints?: number;
  fixVersion?: string;
  statusTime?: StatusDuration[];
  isPinned?: boolean;
  isWatched?: boolean;
  subtasks?: JiraSubtask[];
  timeTracking?: TimeTrackingInfo;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  projectKey: string;
  pinned?: boolean;
  isJql?: boolean;
}

export interface ExtensionSettings {
  jiraUrl: string;
  projectKey: string; // e.g. "PROJ, DEV, CORE"
  userEmail: string;
  apiToken: string;
  maxCachedTickets: number; // default 20
  autoCacheOnSearch: boolean;
  enableAutoRefresh?: boolean; // background refresh of cached tickets every 15m
  groupCachedBy?: 'none' | 'status' | 'project' | 'priority'; // auto-grouping in CachedTicketsManager
  viewMode: 'popup' | 'full'; // 'popup' simulates ~400px extension popup window
  isSimulatedOffline: boolean;
  theme: 'light' | 'dark' | 'system';
  defaultSort: 'updated_desc' | 'created_desc' | 'priority_desc' | 'key_asc';
}

export interface CacheStats {
  totalCached: number;
  maxLimit: number;
  estimatedBytes: number;
  oldestTicketDate?: string;
  newestTicketDate?: string;
}

export type ActiveTab = 'search' | 'history' | 'cached' | 'activity' | 'settings';
