import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Drawer } from 'vaul';
import { CheckCircle2, Clock, Sparkles, ArrowRight, X, Flame } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';
import { useIsMobile } from '../hooks/useMediaQuery';

export default function YesterdayReviewModal({ isOpen, onClose, yesterdayData }) {
  const isMobile = useIsMobile();

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

  const innerContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="w-5 h-5 fill-accent/20" />
          </div>
          <div>
            <h3 className="text-lg font-black text-label tracking-tight">
              Yesterday's Review
            </h3>
            <p className="text-xs tracking-wide text-label-secondary mt-0.5">
              {yesterdayData.date} •{' '}
              {timeStudied > 0 ? `${timeStudied} mins focused` : 'Daily reflection'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            hapticFeedback.tap();
            onClose();
          }}
          className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text-main transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Sections */}
      <div className="py-4 space-y-4 flex-1 overflow-y-auto pr-1">
        {/* SECTION 1: COMPLETED */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs tracking-wide font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Completed ({completed.length})</span>
            </h4>
            <span className="text-[11px] font-mono text-secondary font-bold">
              {Math.round((completed.length / Math.max(1, targetCount)) * 100)}% pace
            </span>
          </div>

          {completed.length === 0 ? (
            <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-xs tracking-wide text-text-muted italic">
              No tasks checked off yesterday.
            </div>
          ) : (
            <div className="space-y-1.5">
              {completed.map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-background-elevated border-[0.5px] border-border text-xs tracking-wide font-medium text-label"
                >
                  <div className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
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
          )}
        </div>

        {/* SECTION 2: MISSED / CARRIED FORWARD */}
        {missed.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs tracking-wide font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Carried Forward ({missed.length})</span>
              </h4>
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
          Your missed topics have been automatically redistributed across your remaining study days.
        </p>

        <button
          type="button"
          onClick={() => {
            hapticFeedback.medium();
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer group shadow-sm active:scale-95"
        >
          <span>Start Today</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </>
  );

  // Mobile Bottom Sheet via vaul with snapPoints={[0.5, 1]}
  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} snapPoints={[0.5, 1]}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[32px] bg-background-elevated/95 backdrop-blur-2xl border-t border-[0.5px] border-border h-full max-h-[100vh] outline-none p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
            {/* Prominent gray pill-shaped drag handle at top */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 shrink-0" />
            <div className="flex-1 overflow-y-auto">{innerContent}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop Centered Modal
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[92vw] max-w-lg rounded-3xl bg-background-elevated border-[0.5px] border-border shadow-sm p-6 sm:p-7 outline-none animate-in fade-in zoom-in-95 duration-200">
          {innerContent}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
