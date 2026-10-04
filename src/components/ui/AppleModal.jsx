import React, { useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

/**
 * Apple HIG Responsive Modal Primitive
 * - Desktop (md: and above): Centered glassmorphic modal with spring physics
 * - Mobile (< 768px): Native iOS/Android Vaul Bottom Sheet that snaps to the bottom with thumb-drag handle
 */
export const AppleModal = memo(function AppleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-md',
  className = '',
  showClose = true,
}) {
  const isMobile = useIsMobile();

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Mobile Implementation: vaul Bottom Sheet
  if (isMobile) {
    return (
      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose?.();
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out" />
          <Drawer.Content
            aria-describedby={description ? 'vaul-drawer-desc' : undefined}
            className={`fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] flex flex-col rounded-t-[32px] bg-background-elevated border-t border-[0.5px] border-border outline-none pb-[env(safe-area-inset-bottom)] shadow-sm ${className}`}
          >
            {/* iOS Thumb Drag Handle Pill */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-black/20 dark:bg-white/20 mt-3 mb-2" />

            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-6 py-2 border-b border-border shrink-0">
                <div className="min-w-0 pr-2">
                  {title && (
                    <Drawer.Title className="text-base font-semibold text-label tracking-tight truncate">
                      {title}
                    </Drawer.Title>
                  )}
                  {description && (
                    <Drawer.Description
                      id="vaul-drawer-desc"
                      className="text-xs tracking-wide text-label-secondary mt-0.5 truncate"
                    >
                      {description}
                    </Drawer.Description>
                  )}
                </div>
                {showClose && (
                  <Drawer.Close asChild>
                    <button
                      type="button"
                      onClick={onClose}
                      className="min-h-[44px] min-w-[44px] p-2 rounded-xl flex items-center justify-center text-label-secondary hover:text-label transition-colors cursor-pointer shrink-0"
                      aria-label="Close sheet"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Drawer.Close>
                )}
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">{children}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop Implementation: Centered Mac Dialog
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            className={`w-full ${maxWidth} bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden ${className}`}
          >
            {/* Top Bar with Title and Close Button */}
            {(title || showClose) && (
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
                <div>
                  {title && (
                    <h3 className="text-base sm:text-lg font-semibold text-label tracking-tight">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs tracking-wide text-label-secondary mt-0.5">{description}</p>
                  )}
                </div>
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] min-w-[44px] p-2 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text-main dark:hover:text-white transition-colors cursor-pointer shrink-0"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

export default AppleModal;


