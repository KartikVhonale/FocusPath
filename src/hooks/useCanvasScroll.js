import { useState, useEffect } from 'react';

/**
 * useCanvasScroll Hook
 * Attaches scroll listener to the main canvas container (#main-scroll-container) or window.
 * Returns current scrollY offset and boolean isScrolled based on threshold.
 */
export function useCanvasScroll(threshold = 35) {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const container = document.getElementById('main-scroll-container') || window;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const top =
            container === window
              ? window.scrollY || document.documentElement.scrollTop
              : container.scrollTop;
          setScrollY(top);
          setIsScrolled(top > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { scrollY, isScrolled };
}
