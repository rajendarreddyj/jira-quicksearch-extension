import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const shortcutGroups = [
    {
      title: 'Global Navigation & Search',
      items: [
        { keyCombo: ['⌘', 'K'], label: 'Focus Search Bar & Select Text' },
        { keyCombo: ['⌘', 'Shift', 'L'], label: 'Jump to Cached Tickets Tab' },
        { keyCombo: ['?'], label: 'Open Keyboard Shortcuts Cheat Sheet' },
        { keyCombo: ['Esc'], label: 'Close Active Modal / Clear Selection' },
      ],
    },
    {
      title: 'Search Panel & Voice Control',
      items: [
        { keyCombo: ['Enter'], label: 'Execute JQL / Ticket Search' },
        { keyCombo: ['Click 🎙️'], label: 'Trigger Web Speech Voice-to-Text Search' },
        { keyCombo: ['Tab'], label: 'Select Auto-Complete Search Suggestion' },
      ],
    },
    {
      title: 'Issue Detail Modal & Quick Actions',
      items: [
        { keyCombo: ['Alt', '1'], label: 'Transition Issue Status to "To Do"' },
        { keyCombo: ['Alt', '2'], label: 'Transition Issue Status to "In Progress"' },
        { keyCombo: ['Alt', '3'], label: 'Transition Issue Status to "Done"' },
        { keyCombo: ['Alt', 'P'], label: 'Toggle Pin / Bookmark Ticket' },
        { keyCombo: ['⌘', 'P'], label: 'Open Print-Friendly View / Export PDF' },
      ],
    },
    {
      title: 'Cache & History Management',
      items: [
        { keyCombo: ['Click Sync'], label: 'Manual Sync & Re-fetch from Server' },
        { keyCombo: ['Click Export'], label: 'Download History Backup (JSON)' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold flex items-center gap-2">
                <span>Keyboard Shortcuts Cheat Sheet</span>
                <span className="text-[9px] font-mono bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded border border-blue-700">
                  Quick Access
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Power user key bindings for high productivity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {shortcutGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keyCombo.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Press <kbd className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded text-[10px]">?</kbd> anytime to toggle this window</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
