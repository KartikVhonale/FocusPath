import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Sparkles, ArrowRight, X, Flame, BookOpen } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

export default function YesterdayReviewModal({ isOpen, onClose, yesterdayData }) {
  // Scroll-lock body while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!yesterdayData) return null;

  const completed = yesterdayData.completedTopics || [];
  const missed = yesterdayData.missedTopics || [];
  const timeStudied = yesterdayData.timeStudied || 0;
  const targetCount = yesterdayData.targetForDay || completed.length + missed.length;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Radix Accessible Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out" />

        {/* Radix Accessible Content with Focus Trap */}
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[92vw] max-w-lg rounded-3xl bg-background-elevated border-[0.5px] border-border shadow-sm p-6 sm:p-7 outline-none animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold shadow-sm">
                <Sparkles className="w-5 h-5 fill-accent/20" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-black text-label tracking-tight">
                  Yesterday's Review
                </Dialog.Title>
                <Dialog.Description className="text-xs tracking-wide text-label-secondary mt-0.5">
                  {yesterdayData.date} •{' '}
                  {timeStudied > 0 ? `${timeStudied} mins focused` : 'Daily reflection'}
                </Dialog.Description>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                onClick={() => hapticFeedback.tap()}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body Sections */}
          <div className="py-4 space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {/* SECTION 1: COMPLETED (Green List with Checkmarks) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs tracking-wide font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Completed ({completed.length})</span>
                </h4>
                {targetCount > 0 && (
                  <span className="text-[10px] font-mono font-bold text-text-muted">
                    {Math.round((completed.length / targetCount) * 100)}% of target
                  </span>
                )}
              </div>

              {completed.length > 0 ? (
                <div className="space-y-1.5">
                  {completed.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-success/10 border border-success/20 text-xs tracking-wide font-medium text-label"
                    >
                      <div className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold truncate block">{t.title}</span>
                        {(t.subjectName || t.chapterName) && (
                          <span className="text-[10px] text-label-secondary block truncate">
                            {t.subjectName} {t.chapterName ? `• ${t.chapterName}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-border text-xs tracking-wide text-label-secondary">
                  No topics were marked complete yesterday.
                </div>
              )}
            </div>

            {/* SECTION 2: ROLLED OVER (Accent List with Clock Icons) */}
            {missed.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs tracking-wide font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Rolled Over ({missed.length})</span>
                  </h4>
                  <span className="text-[10px] text-label-secondary">Auto-rescheduled</span>
                </div>

                <div className="space-y-1.5">
                  {missed.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-background-elevated border-[0.5px] border-border text-xs tracking-wide font-medium text-label"
                    >
                      <div className="w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                        <Clock className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold truncate block">{t.title}</span>
                        {(t.subjectName || t.chapterName) && (
                          <span className="text-[10px] text-text-muted block truncate">
                            {t.subjectName} {t.chapterName ? `• ${t.chapterName}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Text & Primary Action Button */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-3">
            <p className="text-[11px] text-text-muted text-center leading-relaxed">
              Your missed topics have been automatically redistributed across your remaining study
              days.
            </p>

            <Dialog.Close asChild>
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.medium();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-primary-hover shadow-apple dark:shadow-apple-dark transition-all cursor-pointer group"
              >
                <span>Start Today</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

