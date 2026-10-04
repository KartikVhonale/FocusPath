import { useEffect } from 'react';

/**
 * Custom React hook for listening to global keyboard shortcuts.
 *
 * @param {string|Array<string>} keys - Key or keys to listen for (e.g. 'k', 'Escape', ' ')
 * @param {Function} handler - Callback to invoke when key combo matches
 * @param {Object} options - Options: { ctrlOrCmd: boolean, alt: boolean, shift: boolean, preventDefault: boolean, enableInInputs: boolean }
 */
export function useKeyPress(keys, handler, options = {}) {
  const {
    ctrlOrCmd = false,
    alt = false,
    shift = false,
    preventDefault = true,
    enableInInputs = false,
  } = options;

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger if user is actively typing in a form input, unless explicitly enabled
      if (!enableInInputs) {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        const isEditable = document.activeElement?.isContentEditable;
        if (
          activeTag === 'input' ||
          activeTag === 'textarea' ||
          activeTag === 'select' ||
          isEditable
        ) {
          // Allow Escape to work even inside inputs (e.g. to close modals)
          if (event.key !== 'Escape') {
            return;
          }
        }
      }

      const matchCtrlOrCmd = ctrlOrCmd ? event.metaKey || event.ctrlKey : true;
      const matchAlt = alt ? event.altKey : true;
      const matchShift = shift ? event.shiftKey : true;

      const targetKeys = Array.isArray(keys) ? keys : [keys];
      const matchKey = targetKeys.some(
        (k) =>
          k.toLowerCase() === event.key.toLowerCase() ||
          k.toLowerCase() === event.code.toLowerCase()
      );

      if (matchKey && matchCtrlOrCmd && matchAlt && matchShift) {
        if (preventDefault) {
          event.preventDefault();
        }
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keys, handler, ctrlOrCmd, alt, shift, preventDefault, enableInInputs]);
}

export default useKeyPress;
