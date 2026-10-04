/**
 * IndexedDB Asynchronous Storage Service powered by localforage
 * Prevents main thread blocking and eliminates 5MB LocalStorage quota limits for massive syllabi.
 */
import localforage from 'localforage';

// Configure primary localforage instance for application state
const appStore = localforage.createInstance({
  name: 'StudyTrackerDB',
  storeName: 'app_cache',
  description:
    'Asynchronous IndexedDB cache for Master Syllabus Trees and User Performance History',
});

// Keys
export const STORAGE_KEYS = {
  SYLLABUS_TREE: 'syllabus_tree_cache',
  USER_HISTORY: 'user_history_cache',
  DASHBOARD_STATE: 'dashboard_state_cache',
  APP_PREFERENCES: 'app_preferences_cache',
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
};

export const storageService = {
  /**
   * Asynchronously stores a key-value pair in IndexedDB.
   */
  async setItem(key, value) {
    try {
      return await appStore.setItem(key, value);
    } catch (err) {
      console.error(`[IndexedDB] Error setting item for key "${key}":`, err);
      return null;
    }
  },

  /**
   * Asynchronously retrieves an item from IndexedDB.
   */
  async getItem(key) {
    try {
      return await appStore.getItem(key);
    } catch (err) {
      console.error(`[IndexedDB] Error retrieving key "${key}":`, err);
      return null;
    }
  },

  /**
   * Asynchronously removes an item from IndexedDB.
   */
  async removeItem(key) {
    try {
      await appStore.removeItem(key);
    } catch (err) {
      console.error(`[IndexedDB] Error removing key "${key}":`, err);
    }
  },

  /**
   * Clears the entire IndexedDB store.
   */
  async clear() {
    try {
      await appStore.clear();
    } catch (err) {
      console.error('[IndexedDB] Error clearing store:', err);
    }
  },

  /**
   * Cache the Master Syllabus Tree
   */
  async cacheSyllabusTree(examId, treeData) {
    return this.setItem(`${STORAGE_KEYS.SYLLABUS_TREE}_${examId}`, {
      examId,
      data: treeData,
      cachedAt: Date.now(),
    });
  },

  /**
   * Get cached Master Syllabus Tree
   */
  async getCachedSyllabusTree(examId) {
    const cached = await this.getItem(`${STORAGE_KEYS.SYLLABUS_TREE}_${examId}`);
    return cached?.data || null;
  },

  /**
   * Cache User History
   */
  async cacheUserHistory(userId, historyData) {
    return this.setItem(`${STORAGE_KEYS.USER_HISTORY}_${userId}`, {
      userId,
      data: historyData,
      cachedAt: Date.now(),
    });
  },

  /**
   * Get cached User History
   */
  async getCachedUserHistory(userId) {
    const cached = await this.getItem(`${STORAGE_KEYS.USER_HISTORY}_${userId}`);
    return cached?.data || null;
  },

  /**
   * Persistent IndexedDB Auth Token management
   */
  async setAuthToken(token) {
    if (token) {
      await this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      try {
        localStorage.setItem('token', token);
      } catch {}
    } else {
      await this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      try {
        localStorage.removeItem('token');
      } catch {}
    }
  },

  async getAuthToken() {
    const idbToken = await this.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (idbToken) return idbToken;
    try {
      return localStorage.getItem('token') || null;
    } catch {
      return null;
    }
  },

  async removeAuthToken() {
    await this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    try {
      localStorage.removeItem('token');
    } catch {}
  },

  async setAuthUser(user) {
    if (user) {
      await this.setItem(STORAGE_KEYS.AUTH_USER, user);
      try {
        localStorage.setItem('user', JSON.stringify(user));
      } catch {}
    } else {
      await this.removeItem(STORAGE_KEYS.AUTH_USER);
      try {
        localStorage.removeItem('user');
      } catch {}
    }
  },

  async getAuthUser() {
    const idbUser = await this.getItem(STORAGE_KEYS.AUTH_USER);
    if (idbUser) return idbUser;
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  async removeAuth() {
    await this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await this.removeItem(STORAGE_KEYS.AUTH_USER);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
  },
};

export default storageService;
