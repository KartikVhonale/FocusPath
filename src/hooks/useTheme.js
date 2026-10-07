import { useState, useEffect, useCallback } from 'react';
import { hapticFeedback } from '../utils/haptics';
import toast from 'react-hot-toast';

export const THEME_STORAGE_KEY = 'theme';
export const THEME_CHANGE_EVENT = 'theme-change';

/**
 * Gets the persisted theme from localStorage or falls back to system preference.
 * @returns {'dark' | 'light'}
 */
export function getSavedTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {
    console.warn('Error reading theme from localStorage:', e);
  }
  return 'light';
}

/**
 * Applies the theme class to documentElement and syncs meta theme-color.
 * @param {'dark' | 'light'} theme
 */
export function applyThemeToDOM(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Synchronize mobile browser address bar / notch area color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#000000' : '#FFFFFF');
  }
}

/**
 * useTheme Hook
 * Provides synchronized dark / light mode state across all components and browser tabs.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const initialTheme = getSavedTheme();
    applyThemeToDOM(initialTheme);
    return initialTheme;
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    // Initial DOM guarantee
    applyThemeToDOM(theme);

    // Cross-component listener (same window)
    const handleThemeChange = (e) => {
      const nextTheme = e.detail?.theme || getSavedTheme();
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);
    };

    // Cross-tab storage listener
    const handleStorageChange = (e) => {
      if (e.key === THEME_STORAGE_KEY) {
        const nextTheme = e.newValue === 'dark' ? 'dark' : 'light';
        setThemeState(nextTheme);
        applyThemeToDOM(nextTheme);
      }
    };

    // System OS preference change listener
    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const handleSystemChange = (e) => {
      // Only follow OS system preference if user hasn't explicitly set a custom theme in localStorage
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        const systemTheme = e.matches ? 'dark' : 'light';
        setThemeState(systemTheme);
        applyThemeToDOM(systemTheme);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener('storage', handleStorageChange);
    if (mediaQuery && mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    }

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
      if (mediaQuery && mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      }
    };
  }, [theme]);

  /**
   * Persists the selected theme to localStorage and broadcasts the update.
   */
  const setTheme = useCallback((newTheme, notify = false) => {
    const validatedTheme = newTheme === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, validatedTheme);
    } catch (e) {
      console.warn('Failed to save theme in localStorage:', e);
    }

    applyThemeToDOM(validatedTheme);
    setThemeState(validatedTheme);

    // Broadcast event to synchronize all active components immediately
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: validatedTheme } })
    );

    if (notify) {
      if (validatedTheme === 'dark') {
        toast('🌙 Dark Mode enabled', { id: 'theme-mode' });
      } else {
        toast('☀️ Light Mode enabled', { id: 'theme-mode' });
      }
    }
  }, []);

  /**
   * Toggles between dark and light modes with haptics and toast feedback.
   */
  const toggleTheme = useCallback(() => {
    hapticFeedback.medium();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme, true);
  }, [theme, setTheme]);

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
}

export default useTheme;
