import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import localforage from 'localforage';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import { initOfflineSync } from './utils/offlineSync';
import './index.css';
import App from './App.jsx';
import { Analytics } from '@vercel/analytics/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes global cache stale time
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days persistence in IndexedDB
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// localforage instance dedicated to TanStack Query offline cache
// Uses IndexedDB via localforage — consistent with storage.js across the entire codebase
const queryCache = localforage.createInstance({
  name: 'StudyTrackerDB',
  storeName: 'query_cache',
  description: 'Offline TanStack Query persistence store (localforage/IndexedDB)',
});

const QUERY_CACHE_KEY = 'FOCUSPATH_OFFLINE_CACHE';

// localforage-backed persister (replaces idb-keyval)
const idbPersister = {
  persistClient: async (client) => {
    try {
      await queryCache.setItem(QUERY_CACHE_KEY, client);
    } catch (e) {
      console.warn('[localforage] Failed to persist query client:', e);
    }
  },
  restoreClient: async () => {
    try {
      return (await queryCache.getItem(QUERY_CACHE_KEY)) ?? undefined;
    } catch (e) {
      console.warn('[localforage] Failed to restore query client:', e);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      await queryCache.removeItem(QUERY_CACHE_KEY);
    } catch (e) {
      console.warn('[localforage] Failed to clear query client cache:', e);
    }
  },
};

// Start offline mutation listener & auto-syncing
initOfflineSync(queryClient);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: idbPersister,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days retention
        }}
      >
        <App />
        <Analytics />
      </PersistQueryClientProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);

