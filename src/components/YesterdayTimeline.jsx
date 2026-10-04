import React from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Calendar,
} from 'lucide-react';

export default function YesterdayTimeline({ yesterdayReview, onOpenYesterdayModal }) {
  if (!yesterdayReview) return null;

  const {
    date,
    targetForDay = 0,
    topicsCompleted = 0,
    timeStudiedMinutes = 0,
    missedCount = 0,
    isFullyCompleted = false,
  } = yesterdayReview;

  // Format date display (e.g. "Yesterday, Sep 28")
  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : 'Yesterday';

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-5 shadow-apple dark:shadow-apple-dark space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center font-bold">
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs tracking-wide font-black uppercase tracking-wider text-text-main dark:text-text-darkMain">
              Yesterday's Review
            </h3>
            <span className="text-[10px] text-text-muted dark:text-text-darkMuted">
              {formattedDate} Activity Summary
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {isFullyCompleted ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/15 px-2 py-0.5 rounded-full border border-success/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Target Met</span>
          </span>
        ) : missedCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-full border border-accent/20">
            <AlertCircle className="w-3 h-3" />
            <span>{missedCount} Rolled Over</span>
          </span>
        ) : (
          <span className="text-[10px] font-bold text-label-secondary bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
            Logged
          </span>
        )}
      </div>

      {/* Target vs Completed Comparison */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-3 rounded-2xl bg-background-elevated border-[0.5px] border-border">
          <span className="text-[10px] uppercase font-bold text-label-secondary block">
            Completed
          </span>
          <span className="text-lg font-black text-label">
            {topicsCompleted}{' '}
            <span className="text-xs tracking-wide text-label-secondary font-medium">
              / {targetForDay || '—'}
            </span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-background-elevated border-[0.5px] border-border">
          <span className="text-[10px] uppercase font-bold text-label-secondary block">
            Focus Time
          </span>
          <span className="text-lg font-black text-label">
            {timeStudiedMinutes}{' '}
            <span className="text-xs tracking-wide text-label-secondary font-medium">mins</span>
          </span>
        </div>
      </div>

      {/* Adaptive Rollover Notice */}
      {missedCount > 0 ? (
        <div className="p-3 rounded-2xl bg-background-elevated border-[0.5px] border-border flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-xs tracking-wide font-bold text-label block">Adaptive Rollover Active</span>
            <p className="text-[11px] text-label-secondary leading-tight">
              {missedCount} missed task{missedCount === 1 ? '' : 's'} automatically redistributed
              into today's adaptive target.
            </p>
          </div>
        </div>
      ) : isFullyCompleted ? (
        <div className="p-3 rounded-2xl bg-success/10 border border-success/20 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-xs tracking-wide font-bold text-success block">
              Yesterday's Target Achieved
            </span>
            <p className="text-[11px] text-label-secondary leading-tight">
              Streak maintained! Today's schedule remains optimized and on track.
            </p>
          </div>
        </div>
      ) : null}

      {/* Full Reflection Modal Trigger */}
      {onOpenYesterdayModal && (
        <button
          type="button"
          onClick={onOpenYesterdayModal}
          className="w-full py-2 px-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs tracking-wide font-semibold text-text-muted hover:text-text-main dark:hover:text-white flex items-center justify-between transition-colors cursor-pointer"
        >
          <span>View Detailed Yesterday Reflection</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

