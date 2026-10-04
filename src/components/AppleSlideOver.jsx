import React, { useEffect, useCallback, memo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

/**
 * AppleSlideOver Component (iPadOS / macOS Style)
 *
 * Implements Apple Spatial Design principles:
 * - True glassmorphism (ultra-thick blur, subtle specular ring)
 * - Spring physics: { type: "spring", damping: 25, stiffness: 200 }
 * - Scroll-locking & focus trap via Radix UI Dialog
 * - Floating panel with 16px desktop & mobile inset
 * - Independent scroll container with sticky header
 */
export const AppleSlideOver = memo(function AppleSlideOver({
  isOpen,
  onClose,
  title,
  subtitle,
  headerExtra,
  children,
  footer,
  maxWidth = 'max-w-md',
  className = '',
}) {
  // Fallback explicit scroll lock for ultimate guarantee across mobile Safari & Chrome
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    hapticFeedback.tap();
    onClose?.();
  }, [onClose]);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <Dialog.Portal forceMount>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* PART 1: THE SPATIAL OVERLAY BACKDROP */}
              <Dialog.Overlay asChild forceMount key="apple-slide-over-overlay">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                  onClick={handleClose}
                  className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out"
                />
              </Dialog.Overlay>

              {/* PART 2: THE PANEL DESIGN (iPadOS Style Floating Glass Window) */}
              <Dialog.Content
                asChild
                forceMount
                key="apple-slide-over-content"
                aria-describedby={undefined}
              >
                <motion.div
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '120%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                  className={`fixed top-4 bottom-4 right-4 left-4 sm:left-auto z-50 w-auto sm:w-full ${maxWidth} max-w-[calc(100vw-2rem)] flex flex-col bg-background-elevated/95 backdrop-blur-3xl shadow-sm border-[0.5px] border-border rounded-3xl overflow-hidden ${className}`}
                >
                  {/* Screen-reader accessible description */}
                  <Dialog.Description className="sr-only">
                    {typeof title === 'string' ? title : 'Slide over panel'}
                  </Dialog.Description>

                  {/* PART 3: STICKY HEADER WITH THICKER GLASS EFFECT */}
                  <div className="sticky top-0 z-10 bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="min-w-0 flex-1 pr-3">
                      <Dialog.Title className="text-lg font-semibold tracking-tight text-text-main dark:text-text-darkMain truncate">
                        {title}
                      </Dialog.Title>
                      {subtitle && (
                        <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted truncate mt-0.5">
                          {subtitle}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {headerExtra}

                      {/* Circular Close Button */}
                      <Dialog.Close asChild>
                        <button
                          type="button"
                          onClick={handleClose}
                          aria-label="Close dialog"
                          className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-text-main dark:text-text-darkMain flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>

                  {/* SCROLLABLE CONTENT AREA */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">{children}</div>

                  {/* OPTIONAL STICKY FOOTER */}
                  {footer && (
                    <div className="sticky bottom-0 z-10 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border-t border-black/5 dark:border-white/5 px-6 py-3 shrink-0">
                      {footer}
                    </div>
                  )}
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
});

export default AppleSlideOver;


