# GitHub Copilot Instructions for Jira Quick Search Chrome Extension

This project is a high-performance **Jira Quick Search & Offline Caching Chrome Extension** built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Vite**.

When assisting with or modifying code in this workspace, follow these architectural guidelines and coding standards:

---

## 1. Core Architecture & File Structure

- **`src/types.ts`**: Holds all TypeScript interfaces including `JiraIssue`, `ExtensionSettings`, `SearchHistoryItem`, `JiraComment`, `JiraSubtask`, etc.
- **`src/services/jiraService.ts`**: Central service layer managing JQL search execution, `localStorage` persistence, stale data cleanup, and production API proxies.
- **`src/components/IssueDetailModal.tsx`**: Full drawer view supporting keyboard shortcuts (`Esc` close, `Arrow` key navigation, `Alt+1/2/3`), auto-saving scratchpad, time tracking, and `chrome.tabs.create` browser tab opening.
- **`src/components/CachedTicketsManager.tsx`**: Offline ticket vault with flat/grouped layouts, "Refresh All" background sync, CSV export, and JQL filtering.
- **`src/components/SettingsModal.tsx`**: Extension settings (Jira URL, API Token, auto-refresh, stale cleanup, JSON import/export).
- **`src/components/ExtensionManifestModal.tsx`**: Chrome Extension Manifest V3 packaging and distribution modal.

---

## 2. Key Coding Standards & Conventions

1. **Strict Types**: Always maintain full type safety using `src/types.ts`.
2. **Tailwind CSS**: Use Tailwind CSS utility classes with dark mode (`dark:`) support.
3. **Icons**: Use `lucide-react` icons exclusively.
4. **Chrome API Guards**: Guard all `chrome.*` extension calls (e.g. `chrome.tabs.create`, `chrome.storage.local`) with checks for web preview compatibility.
5. **Clean Release**: Use `clearAllMockDataAndPrepareProduction()` in `jiraService.ts` to purge seed mock data prior to creating final extension packages.
