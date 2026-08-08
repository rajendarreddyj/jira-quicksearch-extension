# GitHub Copilot Instructions for Jira Quick Search Chrome Extension

This project is a high-performance **Jira Quick Search & Offline Caching Chrome Extension** built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Vite**.

When assisting with or modifying code in this workspace, follow these architectural guidelines and coding standards:

---

## 1. Core Architecture & File Structure

- **`src/types.ts`**: Holds all TypeScript interfaces including `JiraIssue`, `ExtensionSettings`, `SearchHistoryItem`, `JiraComment`, `JiraSubtask`, etc. Maintain full type safety across all components.
- **`src/App.tsx`**: Main orchestration layer for search execution, tab routing, cache refresh behavior, notifications, and settings hydration.
- **`src/services/jiraService.ts`**: Central service layer managing:
   - JQL search execution (local/offline + live Jira REST via direct/proxy fallback).
   - Secure credential utilities (`saveSecureCredentials`, `loadSecureCredentials`, `clearSecureCredentials`) and settings persistence split.
   - Storage persistence using current keys (`jira_ext_settings`, `jira_ext_secure_credentials`, `jira_ext_cached_issues`, `jira_ext_history`, `jira_ext_pinned_tickets`, `jira_ext_watched_tickets`, `jira_ext_recently_viewed`).
   - Cache operations (`cacheIssue`, `cacheMultipleIssues`, `purgeStaleCachedIssues`, `syncAndRefreshAllCachedIssues`).
- **`src/components/IssueDetailModal.tsx`**: Full drawer view supporting:
  - Keyboard shortcuts (`Esc` to close, `←`/`→`/`↑`/`↓` arrow keys for issue list navigation, `Alt+1/2/3` for status, `Alt+P` for pin, `⌘P`/`Ctrl+P` for print view).
  - Direct scratchpad auto-save with debounced persistence (`jira_scratchpad_<KEY>`).
  - Time tracking (`originalEstimate`, `timeSpent`), subtasks checklist, assignee updates, and `chrome.tabs.create` integration.
- **`src/components/IssueList.tsx`**: Search result list with quick filters, bulk actions, keyboard navigation, and **Open in New Tab** action per issue row.
- **`src/components/CachedTicketsManager.tsx`**: Offline ticket vault with grouping (by Status, Project, Priority), JQL search filtering, CSV export, and "Refresh All" background sync.
- **`src/components/SettingsModal.tsx`**: Config options for Jira URL, API token, user email, auto-caching, auto-refresh, stale data cleanup (>30d), and JSON backup/restore with secure-token rules.

---

## 2. Key Coding Standards & Conventions

1. **Strict Types & Null Safety**:
   - Always export/import interfaces from `src/types.ts`.
   - Never use `any` unless wrapping optional `chrome` extension APIs (`window.chrome?.tabs?.create`).

2. **Tailwind CSS Styling**:
   - Use Tailwind utility classes with standard responsive prefixes (`sm:`, `md:`, `lg:`).
   - Keep styling compatible with current always-dark shell behavior (`theme` forced to dark at runtime).

3. **Icons & UI Elements**:
   - All icons MUST come from `lucide-react`.
   - Touch targets should be accessible with clear visual feedback (`hover:`, `active:`, `disabled:` states).

4. **Chrome Extension Manifest V3 Compatibility**:
   - All Chrome extension APIs (`chrome.storage.local`, `chrome.tabs.create`, `chrome.runtime.onMessage`) must be safely guarded with `typeof window !== 'undefined' && window.chrome?.tabs` checks for seamless web sandbox execution.

5. **Credential & Backup Security Rules**:
   - Do not store `apiToken` in plain settings payload (`jira_ext_settings`).
   - Save/retrieve secrets via secure credential helpers in `jiraService.ts`.
   - Settings export must exclude token fields; settings import must ignore token fields from backup payloads.

6. **Search Cache Behavior**:
   - Search-result caching from Search tab actions should only operate when `settings.autoCacheOnSearch` is enabled.
   - Keep manual and auto cache paths consistent with this gate.

7. **Live API Fallback Behavior**:
   - In extension runtime, direct Jira calls can be attempted; in web mode, prefer `/api/jira/search` proxy.
   - Preserve JQL sanitization and `ORDER BY` handling safeguards in `jiraService.ts` and `server.ts`.

---

## 3. Keyboard Shortcuts Reference

| Shortcut | Action |
| --- | --- |
| `Esc` | Close active modal or ticket detail drawer |
| `←` / `↑` | Navigate to previous issue in list |
| `→` / `↓` | Navigate to next issue in list |
| `Alt + 1` | Set status to "To Do" |
| `Alt + 2` | Set status to "In Progress" |
| `Alt + 3` | Set status to "Done" |
| `Alt + P` | Toggle Pin ticket to top |
| `Cmd + P` / `Ctrl + P` | Open Print-friendly / PDF Export view |
