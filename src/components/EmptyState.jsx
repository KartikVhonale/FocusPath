import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

/**
 * Apple-Styled Contextual Empty State Component
 * Features soft muted SVG illustrations, clean typography, and guided primary call-to-action buttons
 * Eliminates dead ends across all views.
 */
export default function EmptyState({
  icon: Icon = Sparkles,
  title = 'No items found',
  description = 'Everything is caught up or no items match your current filter.',
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  badge = 'All Caught Up',
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
      className={`relative overflow-hidden rounded-3xl border-[0.5px] border-border bg-background-elevated p-8 sm:p-10 flex flex-col items-center text-center shadow-sm ${className}`}
    >
      {/* Illustrated Icon Vessel */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-3xl bg-black/5 dark:bg-white/5 border-[0.5px] border-border text-label-secondary flex items-center justify-center">
          <Icon className="w-8 h-8 stroke-[1.8]" />
        </div>
        {badge && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent border-[0.5px] border-accent/25 whitespace-nowrap shadow-sm">
            {badge}
          </span>
        )}
      </div>

      {/* Typography */}
      <div className="space-y-1.5 max-w-sm z-10 mt-1">
        <h3 className="text-base font-black text-text-main dark:text-text-darkMain tracking-tight">
          {title}
        </h3>
        <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Buttons */}
      {(actionText || secondaryActionText) && (
        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-6 z-10">
          {actionText && onAction && (
            <button
              type="button"
              onClick={() => {
                hapticFeedback.medium();
                onAction();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs tracking-wide shadow-apple shadow-primary/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              onClick={() => {
                hapticFeedback.tap();
                onSecondaryAction();
              }}
              className="px-4 py-2 rounded-2xl text-xs tracking-wide font-semibold text-text-muted hover:text-text-main dark:hover:text-white transition-colors cursor-pointer"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}


