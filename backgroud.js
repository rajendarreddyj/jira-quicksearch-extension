// Manifest V3 Background Service Worker for Offline Cache Freshness
chrome.alarms.create("jiraCacheSync", { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "jiraCacheSync") {
    console.log("[Jira Extension] Auto-refreshing offline ticket cache in background...");
  }
});
