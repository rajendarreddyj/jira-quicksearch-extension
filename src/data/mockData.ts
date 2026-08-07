import { JiraIssue, ExtensionSettings, SearchHistoryItem } from '../types';

export const INITIAL_SETTINGS: ExtensionSettings = {
  jiraUrl: '',
  projectKey: '',
  userEmail: '',
  apiToken: '',
  maxCachedTickets: 20,
  autoCacheOnSearch: true,
  enableAutoRefresh: true,
  viewMode: 'popup',
  isSimulatedOffline: false,
  theme: 'light',
  defaultSort: 'updated_desc',
};

export const MOCK_ISSUES: JiraIssue[] = [];

export const INITIAL_SEARCH_HISTORY: SearchHistoryItem[] = [];
