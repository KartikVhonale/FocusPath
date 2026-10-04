import { useState, useEffect } from 'react';

/**
 * useMediaQuery Hook
 * Listens to CSS media queries reactively.
 *
 * @param {string} query - CSS media query string, e.g. '(max-width: 767px)'
 * @returns {boolean} Whether the media query currently matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);

    // Initial sync
    setMatches(media.matches);

    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

/**
 * useIsMobile Hook
 * Returns true if viewport is narrower than md (768px).
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}
