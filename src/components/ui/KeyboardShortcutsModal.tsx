import Modal from './Modal';
import { Keyboard } from 'lucide-react';

interface ShortcutItem {
  key: string;
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const cmdKey = isMac ? '⌘' : 'Ctrl+';

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { key: '?', description: 'Show keyboard shortcuts' },
      { key: 'Esc', description: 'Close modal / Cancel' },
      { key: '/', description: 'Focus activity input' },
    ],
  },
  {
    title: 'Activities',
    shortcuts: [
      { key: `${cmdKey}S`, description: 'Save activity (when editing)' },
      { key: `${cmdKey}Enter`, description: 'Quick save activity' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { key: '1', description: 'Go to Daily Planner' },
      { key: '2', description: 'Go to Goals' },
      { key: '3', description: 'Go to History' },
      { key: '4', description: 'Go to Settings' },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="space-y-6">
        {shortcutGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{group.title}</h3>
            <div className="space-y-2">
              {group.shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-1.5">
                  <span className="text-gray-700">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-600">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Keyboard className="w-4 h-4" />
          <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">?</kbd> anytime to show this help</span>
        </div>
      </div>
    </Modal>
  );
}
