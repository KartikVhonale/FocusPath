import React, { useState } from 'react';

/**
 * Lightweight, accessible Tooltip component for desktop mouse hover.
 * Displays explanatory text and optional keyboard shortcut badges.
 */
export default function Tooltip({
  children,
  content,
  shortcut,
  position = 'bottom',
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);

  if (!content) return children;

  const positionClasses =
    {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    }[position] || 'top-full left-1/2 -translate-x-1/2 mt-2';

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`hidden md:flex absolute z-50 pointer-events-none items-center gap-1.5 whitespace-nowrap bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-900 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm backdrop-blur-sm border-[0.5px] border-border animate-in fade-in zoom-in-95 duration-150 ${positionClasses}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/15 font-mono text-[9px] font-bold">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
