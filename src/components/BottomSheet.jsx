import React, { useEffect } from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

/**
 * BottomSheet Component (Native Apple HIG vaul Sheet)
 * Snaps to 50% and 100% of the screen height, with a prominent gray pill-shaped drag handle.
 */
export default function BottomSheet({ isOpen, onClose, title, children, showClose = true }) {
  useEffect(() => {
    if (isOpen) {
      hapticFeedback.light();
    }
  }, [isOpen]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} snapPoints={[0.5, 1]}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out" />
        <Drawer.Content
          aria-describedby="bottom-sheet-content"
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[32px] bg-background-elevated/95 backdrop-blur-2xl border-t border-[0.5px] border-border h-full max-h-[100vh] outline-none px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.12)] max-w-lg mx-auto"
        >
          {/* Prominent gray pill-shaped drag handle at the top */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            {title ? (
              <Drawer.Title className="text-base font-bold text-label tracking-tight">
                {title}
              </Drawer.Title>
            ) : (
              <div />
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-label-secondary flex items-center justify-center transition-all ml-auto active:scale-90 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sheet Content */}
          <div id="bottom-sheet-content" className="flex-1 overflow-y-auto space-y-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
