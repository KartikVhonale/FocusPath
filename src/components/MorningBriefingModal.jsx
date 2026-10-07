import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import { Sun, Sparkles, BookOpen, RotateCcw, Clock, ArrowRight } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';
import { useIsMobile } from '../hooks/useMediaQuery';

export default function MorningBriefingModal({ dashboardData, user, onBegin }) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Check condition on mount and whenever dashboardData updates
  useEffect(() => {
    if (!dashboardData) return;

    const currentHour = new Date().getHours();
    const isMorningTime = currentHour >= 4 && currentHour < 10;
    const todayKey = `morning_briefing_${new Date().toISOString().split('T')[0]}`;
    const alreadyDismissed = localStorage.getItem(todayKey) === 'true';

    // Show if within morning window and not yet acknowledged today
    if (isMorningTime && !alreadyDismissed) {
      setIsOpen(true);
    }
  }, [dashboardData]);

  const todayKey = useMemo(() => {
    return `morning_briefing_${new Date().toISOString().split('T')[0]}`;
  }, []);

  // Compute topic counts & estimated time
  const newTopicsCount = dashboardData?.upNextQueue?.length ?? dashboardData?.todayTarget ?? 2;
  const reviewsCount = dashboardData?.reviewQueue?.length ?? 0;

  // Estimated focus time calculation: ~45 min per new topic, ~15 min per review
  const estimatedTime = useMemo(() => {
    const totalMinutes = Math.max(30, newTopicsCount * 45 + reviewsCount * 15);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }, [newTopicsCount, reviewsCount]);

  const handleBegin = () => {
    hapticFeedback.success();
    localStorage.setItem(todayKey, 'true');
    setIsOpen(false);
    if (onBegin) onBegin();
  };

  const handleDismiss = () => {
    hapticFeedback.tap();
    localStorage.setItem(todayKey, 'true');
    setIsOpen(false);
  };

  const username = user?.username ? user.username.split(' ')[0] : 'Scholar';

  const modalContent = (
    <div className="text-center">
      {/* Morning Sun Icon with Soft Halo */}
      <div className="relative inline-flex items-center justify-center mb-4">
        <div className="w-14 h-14 rounded-3xl bg-accent flex items-center justify-center text-white shadow-sm">
          <Sun className="w-8 h-8 stroke-[2]" />
        </div>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent rounded-full animate-ping" />
      </div>

      {/* Pill Header */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 mb-2">
        <Sparkles className="w-3 h-3 text-accent" />
        <span>Morning Briefing</span>
      </div>

      {/* Main Greeting & Minimalist Summary */}
      <h2 className="text-2xl font-black text-label tracking-tight mb-2">
        Good morning, {username}.
      </h2>

      <p className="text-sm text-label-secondary leading-relaxed max-w-md mx-auto mb-5">
        You have{' '}
        <strong className="text-accent font-bold">
          {newTopicsCount} new {newTopicsCount === 1 ? 'topic' : 'topics'}
        </strong>{' '}
        and{' '}
        <strong className="text-accent font-bold">
          {reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'}
        </strong>{' '}
        scheduled today.
        <br />
        Estimated focus time required:{' '}
        <strong className="text-label font-black">{estimatedTime}</strong>.
      </p>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="p-3 rounded-2xl bg-background-elevated border-[0.5px] border-border">
          <BookOpen className="w-4 h-4 text-accent mx-auto mb-1" />
          <span className="text-lg font-black text-label block">{newTopicsCount}</span>
          <span className="text-[10px] font-bold text-label-secondary uppercase">
            New Topics
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-background-elevated border-[0.5px] border-border">
          <RotateCcw className="w-4 h-4 text-accent mx-auto mb-1" />
          <span className="text-lg font-black text-label block">{reviewsCount}</span>
          <span className="text-[10px] font-bold text-label-secondary uppercase">
            SRS Reviews
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-background-elevated border-[0.5px] border-border">
          <Clock className="w-4 h-4 text-accent mx-auto mb-1" />
          <span className="text-lg font-black text-label block">{estimatedTime}</span>
          <span className="text-[10px] font-bold text-label-secondary uppercase">
            Est. Focus
          </span>
        </div>
      </div>

      {/* SINGLE PULSING BUTTON: "Begin." */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleBegin}
          className="relative w-full py-4 px-6 rounded-2xl bg-accent hover:opacity-90 active:scale-95 text-white font-black text-base tracking-wide shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer group"
        >
          <span>Begin.</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs tracking-wide font-semibold text-label-secondary hover:text-label transition-colors cursor-pointer"
        >
          Dismiss for today
        </button>
      </div>
    </div>
  );

  // Mobile Bottom Sheet via vaul with snapPoints={[0.5, 1]}
  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={setIsOpen} snapPoints={[0.5, 1]}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[32px] bg-background-elevated/95 backdrop-blur-2xl border-t border-[0.5px] border-border h-full max-h-[100vh] outline-none p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
            {/* Prominent gray pill-shaped drag handle at top */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 shrink-0" />
            <div className="flex-1 overflow-y-auto">{modalContent}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop Centered Modal
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            className="fixed inset-0 bg-black/65 dark:bg-black/85 backdrop-blur-2xl"
          />

          <div className="fixed top-1/4 -translate-y-1/2 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            className="relative z-10 w-full max-w-lg bg-background-elevated/95 backdrop-blur-3xl border-[0.5px] border-border rounded-3xl p-6 sm:p-8 shadow-sm text-center overflow-hidden"
          >
            {modalContent}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
