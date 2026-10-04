import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

export default function BottomSheet({ isOpen, onClose, title, children, showClose = true }) {
  useEffect(() => {
    if (isOpen) {
      hapticFeedback.light();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          />

          {/* iOS Bottom Sheet Drawer (Mobile) / Centered Dialog (Desktop) */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 400) {
                hapticFeedback.tap();
                onClose();
              }
            }}
            className="relative z-10 w-full max-w-md bg-background-elevated border-t md:border border-[0.5px] border-border rounded-t-[32px] md:rounded-3xl px-6 pt-3 md:pt-6 pb-8 shadow-sm max-h-[85vh] overflow-y-auto text-label"
          >
            {/* Grab Handle (Mobile Only) */}
            <div className="md:hidden w-12 h-1.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/30 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing transition-colors" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              {title && (
                <h3 className="text-base font-bold text-text-main dark:text-text-darkMain tracking-tight">
                  {title}
                </h3>
              )}
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-text-muted dark:text-text-darkMuted flex items-center justify-center transition-all ml-auto active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sheet Content */}
            <div className="space-y-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

