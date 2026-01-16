import { useState } from 'react';
import { Clock, Settings, Download, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { exportDataAsJSON, exportDataAsCSV } from '../../utils/export';

export default function Header() {
  const { state, currentSession, updateSettings } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Clock className="w-8 h-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">YNAHT</span>
          <span className="text-sm text-gray-500 hidden sm:block">You Need A Hour Tracker</span>
        </div>

        {/* Current Session Info */}
        {currentSession && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Sun className="w-4 h-4 text-yellow-500" />
              <span>{format(parseISO(currentSession.wakeTime), 'h:mm a')}</span>
            </div>
            <span className="text-gray-400">→</span>
            <div className="flex items-center gap-2 text-gray-600">
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>{format(parseISO(currentSession.plannedSleepTime), 'h:mm a')}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowExport(true)}>
            <Download className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Settings"
        footer={
          <Button onClick={() => setShowSettings(false)}>Done</Button>
        }
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Default Day Times</h3>
            <p className="text-xs text-gray-500 mb-3">These will be used as defaults when starting a new day.</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Default Wake Time"
                type="time"
                value={state.settings.defaultWakeTime}
                onChange={(e) => updateSettings({ defaultWakeTime: e.target.value })}
              />
              <Input
                label="Default Sleep Time"
                type="time"
                value={state.settings.defaultSleepTime}
                onChange={(e) => updateSettings({ defaultSleepTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Week Starts On</h3>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  state.settings.weekStartsOn === 0
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => updateSettings({ weekStartsOn: 0 })}
              >
                Sunday
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  state.settings.weekStartsOn === 1
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => updateSettings({ weekStartsOn: 1 })}
              >
                Monday
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        title="Export Data"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Export all your time tracking data.</p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                exportDataAsJSON({ daySessions: state.daySessions, goals: state.goals });
                setShowExport(false);
              }}
            >
              Export as JSON
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                exportDataAsCSV(state.daySessions);
                setShowExport(false);
              }}
            >
              Export as CSV
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
