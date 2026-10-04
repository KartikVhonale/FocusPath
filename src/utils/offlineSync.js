import { get, set } from 'idb-keyval';
import toast from 'react-hot-toast';
import api from '../services/api';

const OFFLINE_QUEUE_KEY = 'FOCUSPATH_OFFLINE_MUTATION_QUEUE';

/**
 * Retrieves the current pending offline mutation queue from IndexedDB
 */
export async function getOfflineQueue() {
  try {
    const queue = await get(OFFLINE_QUEUE_KEY);
    return Array.isArray(queue) ? queue : [];
  } catch (err) {
    console.warn('Failed to read offline queue from IndexedDB, falling back to localStorage:', err);
    try {
      const fallback = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return fallback ? JSON.parse(fallback) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Saves the offline mutation queue to IndexedDB
 */
export async function saveOfflineQueue(queue) {
  try {
    await set(OFFLINE_QUEUE_KEY, queue);
  } catch (err) {
    console.warn('Failed to save to IndexedDB, fallback to localStorage:', err);
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // ignore
    }
  }
}

/**
 * Enqueue an action to be dispatched when network connectivity is restored
 */
export async function enqueueOfflineAction(type, payload) {
  const queue = await getOfflineQueue();
  const newAction = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    queuedAt: new Date().toISOString(),
  };

  queue.push(newAction);
  await saveOfflineQueue(queue);

  toast('💾 Saved offline. Will sync with cloud once reconnected.', {
    icon: '⚡',
    id: 'offline-saved',
    duration: 3000,
  });

  return newAction;
}

/**
 * Processes all pending offline mutations sequentially and pushes them to MongoDB
 */
export async function syncOfflineQueue(queryClient) {
  if (!navigator.onLine) return;

  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`[OfflineSync] Processing ${queue.length} pending actions...`);
  const toastId = toast.loading(`🌐 Syncing ${queue.length} offline actions...`);

  let syncedCount = 0;
  const remainingQueue = [];

  for (const action of queue) {
    try {
      if (action.type === 'TOGGLE_NODE') {
        await api.toggleNodeSRS(action.payload);
      } else if (action.type === 'LOG_TIME') {
        await api.logTopicTime(action.payload);
      } else if (action.type === 'AUTO_SCHEDULE') {
        await api.autoSchedule(action.payload);
      }
      syncedCount++;
    } catch (err) {
      console.error(`[OfflineSync] Failed to sync action ${action.id}:`, err);
      // Keep in queue if it's a network error
      if (!navigator.onLine || err.code === 'ERR_NETWORK') {
        remainingQueue.push(action);
      }
    }
  }

  await saveOfflineQueue(remainingQueue);

  if (syncedCount > 0) {
    toast.success(`Synced ${syncedCount} offline updates to cloud!`, { id: toastId });
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline() });
    }
  } else {
    toast.dismiss(toastId);
  }
}

/**
 * Initialize offline network listeners on window
 */
export function initOfflineSync(queryClient) {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    toast.success('🌐 Connection restored!', { id: 'online-status' });
    syncOfflineQueue(queryClient);
  });

  window.addEventListener('offline', () => {
    toast('📡 Running in Offline Mode. All changes stored locally.', {
      icon: '⚡',
      id: 'online-status',
      duration: 4000,
    });
  });

  // Attempt sync on initial boot if online and items exist
  if (navigator.onLine) {
    syncOfflineQueue(queryClient);
  }
}


