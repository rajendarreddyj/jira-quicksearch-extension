import React from 'react';
import { X, Bell, Pin, RefreshCw, ArrowRight, Trash2, ShieldCheck } from 'lucide-react';

export interface PinnedNotification {
  id: string;
  ticketKey: string;
  summary: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsModalProps {
  onClose: () => void;
  notifications: PinnedNotification[];
  onSelectIssueByKey: (key: string) => void;
  onClearAllNotifications: () => void;
  onCheckForPinnedUpdates: () => void;
  isChecking: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  onClose,
  notifications,
  onSelectIssueByKey,
  onClearAllNotifications,
  onCheckForPinnedUpdates,
  isChecking,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold flex items-center gap-2">
                <span>Pinned Tickets Live Alerts</span>
                <span className="text-[9px] font-mono bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded border border-blue-700">
                  {notifications.filter(n => !n.read).length} Unread
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Periodic status & activity alerts for bookmarked issues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={onCheckForPinnedUpdates}
            disabled={isChecking}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking Server...' : 'Check Updates Now'}</span>
          </button>

          {notifications.length > 0 && (
            <button
              onClick={onClearAllNotifications}
              className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-2.5 text-xs">
          {notifications.length === 0 ? (
            <div className="py-8 text-center space-y-2 text-slate-500">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">All Pinned Tickets Up to Date</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                No recent changes detected in your bookmarked issues. The background service checks automatically every 30s.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  onSelectIssueByKey(n.ticketKey);
                  onClose();
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 group ${
                  !n.read
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    <span className="font-mono text-blue-700 dark:text-blue-400">{n.ticketKey}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{n.summary}</p>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 font-medium flex items-center justify-between">
                  <span>{n.message}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Auto-sync interval: 30s</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
