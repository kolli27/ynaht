import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserId } from '../utils/userId';
import { AppState } from '../types';

const API_BASE = '/api/data';
const SYNC_DEBOUNCE_MS = 1000; // Debounce saves by 1 second
const OFFLINE_QUEUE_KEY = 'ynaht_offlineQueue';

interface SyncState {
  isLoading: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  hasUnsyncedChanges: boolean;
}

interface OfflineQueueItem {
  data: AppState;
  timestamp: string;
}

// Get offline queue from localStorage
function getOfflineQueue(): OfflineQueueItem | null {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : null;
  } catch {
    return null;
  }
}

// Save to offline queue
function saveToOfflineQueue(data: AppState): void {
  try {
    const item: OfflineQueueItem = {
      data,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(item));
  } catch (error) {
    console.error('Failed to save to offline queue:', error);
  }
}

// Clear offline queue
function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: true,
    isSyncing: false,
    isOnline: navigator.onLine,
    lastSyncedAt: null,
    error: null,
    hasUnsyncedChanges: !!getOfflineQueue(),
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userId = getUserId();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setSyncState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setSyncState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch data from API
  const fetchData = useCallback(async (): Promise<AppState | null> => {
    setSyncState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(API_BASE, {
        method: 'GET',
        headers: {
          'X-User-Id': userId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();

      setSyncState((prev) => ({
        ...prev,
        isLoading: false,
        lastSyncedAt: result.lastSyncedAt,
        error: null,
      }));

      // Check for offline queue data that might be newer
      const offlineData = getOfflineQueue();
      if (offlineData && result.data) {
        // If we have offline data, compare timestamps
        const serverTime = result.data._meta?.lastUpdatedAt;
        if (!serverTime || new Date(offlineData.timestamp) > new Date(serverTime)) {
          // Offline data is newer, return it and sync it
          return offlineData.data;
        }
      }

      // Remove metadata before returning
      if (result.data) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _meta, ...cleanData } = result.data;
        return cleanData as AppState;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setSyncState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // If offline, try to return offline queue data
      const offlineData = getOfflineQueue();
      if (offlineData) {
        return offlineData.data;
      }

      return null;
    }
  }, [userId]);

  // Save data to API (with debouncing)
  const saveData = useCallback(
    async (data: AppState, immediate = false): Promise<boolean> => {
      // Cancel any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      const performSave = async (): Promise<boolean> => {
        // If offline, queue the data
        if (!navigator.onLine) {
          saveToOfflineQueue(data);
          setSyncState((prev) => ({ ...prev, hasUnsyncedChanges: true }));
          return false;
        }

        setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));

        try {
          const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
              'X-User-Id': userId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data }),
          });

          if (!response.ok) {
            throw new Error(`Failed to save data: ${response.status}`);
          }

          const result = await response.json();

          // Clear offline queue on successful save
          clearOfflineQueue();

          setSyncState((prev) => ({
            ...prev,
            isSyncing: false,
            lastSyncedAt: result.lastSyncedAt,
            hasUnsyncedChanges: false,
            error: null,
          }));

          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to save data';

          // Save to offline queue on failure
          saveToOfflineQueue(data);

          setSyncState((prev) => ({
            ...prev,
            isSyncing: false,
            error: errorMessage,
            hasUnsyncedChanges: true,
          }));

          return false;
        }
      };

      if (immediate) {
        return performSave();
      }

      // Debounce the save
      return new Promise((resolve) => {
        saveTimeoutRef.current = setTimeout(async () => {
          const result = await performSave();
          resolve(result);
        }, SYNC_DEBOUNCE_MS);
      });
    },
    [userId]
  );

  // Sync offline queue when coming back online
  const syncOfflineQueue = useCallback(async (): Promise<boolean> => {
    const offlineData = getOfflineQueue();
    if (!offlineData || !navigator.onLine) {
      return false;
    }

    const success = await saveData(offlineData.data, true);
    if (success) {
      clearOfflineQueue();
      setSyncState((prev) => ({ ...prev, hasUnsyncedChanges: false }));
    }
    return success;
  }, [saveData]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (syncState.isOnline && syncState.hasUnsyncedChanges) {
      syncOfflineQueue();
    }
  }, [syncState.isOnline, syncState.hasUnsyncedChanges, syncOfflineQueue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...syncState,
    fetchData,
    saveData,
    syncOfflineQueue,
    userId,
  };
}
