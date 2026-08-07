# GitHub Copilot Instructions for Jira Quick Search Chrome Extension

This project is a high-performance **Jira Quick Search & Offline Caching Chrome Extension** built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Vite**.

When assisting with or modifying code in this workspace, follow these architectural guidelines and coding standards:

---

## 1. Core Architecture & File Structure

- **`src/types.ts`**: Holds all TypeScript interfaces including `JiraIssue`, `ExtensionSettings`, `SearchHistoryItem`, `JiraComment`, `JiraSubtask`, etc. Maintain full type safety across all components.
- **`src/services/jiraService.ts`**: Central service layer managing:
  - JQL search execution (mock simulated JQL execution + live Atlassian REST API `/rest/api/3/search` proxy fallback).
  - Storage persistence (`localStorage` keys: `jira_extension_settings`, `jira_cached_issues`, `jira_search_history`, `jira_pinned_tickets`, `jira_watched_tickets`, `jira_recently_viewed`).
  - Stale data cleanup (`purgeStaleCachedIssues`), background sync (`syncAndRefreshAllCachedIssues`), and production prep (`clearAllMockDataAndPrepareProduction`).
- **`src/components/IssueDetailModal.tsx`**: Full drawer view supporting:
  - Keyboard shortcuts (`Esc` to close, `←`/`→`/`↑`/`↓` arrow keys for issue list navigation, `Alt+1/2/3` for status, `Alt+P` for pin, `⌘P`/`Ctrl+P` for print view).
  - Direct scratchpad auto-save with debounced persistence (`jira_scratchpad_<KEY>`).
  - Time tracking (`originalEstimate`, `timeSpent`), subtasks checklist, assignee updates, and `chrome.tabs.create` integration.
- **`src/components/CachedTicketsManager.tsx`**: Offline ticket vault with grouping (by Status, Project, Priority), JQL search filtering, CSV export, and "Refresh All" background sync.
- **`src/components/SettingsModal.tsx`**: Config options for Jira URL, API Token, user email, auto-caching, auto-refresh, stale data cleanup (>30d), and JSON backup/restore.
- **`src/components/ExtensionManifestModal.tsx`**: Manifest V3 package builder and Live Setup guide.

---

## 2. Key Coding Standards & Conventions

1. **Strict Types & Null Safety**:
   - Always export/import interfaces from `src/types.ts`.
   - Never use `any` unless wrapping optional `chrome` extension APIs (`window.chrome?.tabs?.create`).

2. **Tailwind CSS Styling**:
   - Use Tailwind utility classes with standard responsive prefixes (`sm:`, `md:`, `lg:`).
   - Support dark mode using standard `dark:` class modifiers synchronized with `document.documentElement.classList`.

3. **Icons & UI Elements**:
   - All icons MUST come from `lucide-react`.
   - Touch targets should be accessible with clear visual feedback (`hover:`, `active:`, `disabled:` states).

4. **Chrome Extension Manifest V3 Compatibility**:
   - All Chrome extension APIs (`chrome.storage.local`, `chrome.tabs.create`, `chrome.runtime.onMessage`) must be safely guarded with `typeof window !== 'undefined' && window.chrome?.tabs` checks for seamless web sandbox execution.

5. **Mock Data vs. Production Live API**:
   - Simulated JQL is powered by `SEED_JIRA_ISSUES` in `jiraService.ts`.
   - In production live mode, server proxy `/api/jira/search` forwards requests to `https://<YOUR-DOM>.atlassian.net/rest/api/3/search` using Base64 encoded Basic Auth (`email:apiToken`).

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
