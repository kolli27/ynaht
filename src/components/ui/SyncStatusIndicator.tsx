import { Cloud, CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SyncStatusIndicator() {
  const { syncStatus, forceSync } = useApp();

  // Don't show anything while loading initially
  if (syncStatus.isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-gray-400 text-sm">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </div>
    );
  }

  // Offline indicator
  if (!syncStatus.isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-amber-500 text-sm">
        <CloudOff className="w-4 h-4" />
        <span className="hidden sm:inline">Offline</span>
        {syncStatus.hasUnsyncedChanges && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
            Pending
          </span>
        )}
      </div>
    );
  }

  // Syncing indicator
  if (syncStatus.isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-primary-500 text-sm">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="hidden sm:inline">Syncing...</span>
      </div>
    );
  }

  // Error indicator (with retry button)
  if (syncStatus.error) {
    return (
      <button
        onClick={forceSync}
        className="flex items-center gap-1.5 text-red-500 text-sm hover:text-red-600 transition-colors"
        title={`Sync failed: ${syncStatus.error}. Click to retry.`}
      >
        <AlertCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Sync failed</span>
        <RefreshCw className="w-3 h-3" />
      </button>
    );
  }

  // Has unsynced changes
  if (syncStatus.hasUnsyncedChanges) {
    return (
      <button
        onClick={forceSync}
        className="flex items-center gap-1.5 text-amber-500 text-sm hover:text-amber-600 transition-colors"
        title="Changes pending sync. Click to sync now."
      >
        <Cloud className="w-4 h-4" />
        <span className="hidden sm:inline">Pending</span>
        <RefreshCw className="w-3 h-3" />
      </button>
    );
  }

  // All synced
  return (
    <div className="flex items-center gap-1.5 text-green-500 text-sm" title={`Last synced: ${syncStatus.lastSyncedAt ? new Date(syncStatus.lastSyncedAt).toLocaleTimeString() : 'Never'}`}>
      <Cloud className="w-4 h-4" />
      <Check className="w-3 h-3 -ml-2.5 -mt-2 bg-white rounded-full" />
      <span className="hidden sm:inline">Synced</span>
    </div>
  );
}
