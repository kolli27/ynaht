import { useState } from 'react';
import { Settings, Clock, Calendar, Percent, Download, Trash2, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportDataAsJSON, exportDataAsCSV } from '../../utils/export';
import { formatDistanceToNow } from 'date-fns';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';

export default function SettingsPage() {
  const { state, updateSettings } = useApp();
  const { settings } = state;

  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<'json' | 'csv' | null>(null);

  const handleExportJSON = () => {
    exportDataAsJSON({
      daySessions: state.daySessions,
      goals: state.goals,
    });
    updateSettings({ lastExportedAt: new Date().toISOString() });
    setExportSuccess('json');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const handleExportCSV = () => {
    exportDataAsCSV(state.daySessions);
    updateSettings({ lastExportedAt: new Date().toISOString() });
    setExportSuccess('csv');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const handleClearData = () => {
    // Clear all data except settings
    localStorage.removeItem('ynaht_appState_v2');
    window.location.reload();
  };

  const handleResetAll = () => {
    // Full reset including settings
    localStorage.clear();
    window.location.reload();
  };

  const sessionCount = Object.keys(state.daySessions).length;
  const activityCount = Object.values(state.daySessions).reduce(
    (sum, session) => sum + session.activities.length,
    0
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Settings className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Customize your YNAHT experience</p>
        </div>
      </div>

      {/* Default Times */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Default Times</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          These defaults are used when starting a new day.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Wake Time
            </label>
            <Input
              type="time"
              value={settings.defaultWakeTime}
              onChange={(e) => updateSettings({ defaultWakeTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Sleep Time
            </label>
            <Input
              type="time"
              value={settings.defaultSleepTime}
              onChange={(e) => updateSettings({ defaultSleepTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Planning Preferences */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Planning Preferences</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Productivity Buffer
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Recommended free time to leave in your day for unexpected tasks.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                max={50}
                value={settings.productivityBuffer}
                onChange={(e) => updateSettings({ productivityBuffer: parseInt(e.target.value) || 0 })}
                className="w-24"
              />
              <span className="text-gray-600">%</span>
              <span className="text-sm text-gray-500">
                ({Math.round((settings.productivityBuffer / 100) * 16 * 60)} min of a 16h day)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Week Settings */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Week Settings</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Week Starts On
          </label>
          <Select
            value={settings.weekStartsOn.toString()}
            onChange={(e) => updateSettings({ weekStartsOn: parseInt(e.target.value) as 0 | 1 })}
            options={[
              { value: '0', label: 'Sunday' },
              { value: '1', label: 'Monday' },
            ]}
            className="w-48"
          />
        </div>
      </div>

      {/* Data Export */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Download your data for backup or analysis.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-2xl font-bold text-gray-900">{sessionCount}</p>
            <p className="text-xs text-gray-500">Days tracked</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activityCount}</p>
            <p className="text-xs text-gray-500">Activities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{state.goals.length}</p>
            <p className="text-xs text-gray-500">Goals</p>
          </div>
        </div>

        {/* Last Export */}
        {settings.lastExportedAt && (
          <p className="text-sm text-gray-500 mb-4">
            Last exported: {formatDistanceToNow(new Date(settings.lastExportedAt), { addSuffix: true })}
          </p>
        )}
        {!settings.lastExportedAt && (
          <p className="text-sm text-yellow-600 mb-4">
            You haven't exported your data yet. Regular backups are recommended.
          </p>
        )}

        {/* Export Success Message */}
        {exportSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              Exported as {exportSuccess.toUpperCase()} successfully!
            </span>
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleExportJSON} className="justify-center">
            <Download className="w-4 h-4 mr-2" />
            Export JSON (Full Backup)
          </Button>
          <Button variant="secondary" onClick={handleExportCSV} className="justify-center">
            <Download className="w-4 h-4 mr-2" />
            Export CSV (Spreadsheet)
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          These actions cannot be undone. Make sure to export your data first.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowClearDataModal(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
          <Button variant="danger" onClick={() => setShowResetModal(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Factory Reset
          </Button>
        </div>
      </div>

      {/* Clear Data Modal */}
      <Modal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        title="Clear All Data"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowClearDataModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearData}>
              Yes, Clear Everything
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            This will permanently delete all your:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>{sessionCount} day sessions and {activityCount} activities</li>
            <li>{state.goals.length} goals</li>
            <li>{state.backlog.length} backlog items</li>
          </ul>
          <p className="text-red-600 font-medium">
            This action cannot be undone!
          </p>
        </div>
      </Modal>

      {/* Reset Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Factory Reset"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetAll}>
              Yes, Reset Everything
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            This will reset the app to its original state, deleting:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>All data (sessions, activities, goals)</li>
            <li>All settings (will return to defaults)</li>
            <li>Onboarding status (will show welcome screen again)</li>
          </ul>
          <p className="text-red-600 font-medium">
            This action cannot be undone!
          </p>
        </div>
      </Modal>
    </div>
  );
}
