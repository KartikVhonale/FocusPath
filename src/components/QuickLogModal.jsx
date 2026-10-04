import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Sparkles, X, Check, ArrowRight, CornerDownLeft, Target, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { hapticFeedback } from '../utils/haptics';

export default function QuickLogModal({ isOpen, onClose }) {
  const { updateProgress, dashboardData, activeExam } = useApp();
  const [count, setCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCount(1);
      hapticFeedback.light();
      // Auto-focus input on open
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const num = parseInt(count, 10);
    if (isNaN(num) || num <= 0) {
      toast.error('Please enter at least 1 chapter');
      return;
    }

    setIsSubmitting(true);
    hapticFeedback.medium();
    try {
      await updateProgress(num);
      hapticFeedback.success();
      toast.success(`🎉 Awesome job! Logged ${num} chapter${num > 1 ? 's' : ''}.`);
      onClose();
    } catch (err) {
      toast.error('Failed to log progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
          />

          {/* Command Palette Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            className="relative z-10 w-full max-w-md bg-background-elevated border-[0.5px] border-border rounded-3xl p-6 shadow-sm overflow-hidden text-label"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                    <span>Quick Log Progress</span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[10px] font-mono text-text-muted dark:text-text-darkMuted font-bold">
                      Ctrl + K
                    </span>
                  </h3>
                  <p className="text-[11px] text-text-muted dark:text-text-darkMuted">
                    {activeExam?.name
                      ? `Tracking for ${activeExam.name}`
                      : 'Log completed topics instantly'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-text-muted dark:text-text-darkMuted flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Target Context */}
            {dashboardData && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between text-xs tracking-wide">
                <span className="flex items-center gap-1.5 text-text-muted dark:text-text-darkMuted font-medium">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span>Today's Target:</span>
                  <strong className="text-text-main dark:text-text-darkMain font-bold">
                    {dashboardData.todayCompleted} / {dashboardData.todayTarget} done
                  </strong>
                </span>
                <span className="text-[11px] font-mono text-secondary font-bold">
                  {Math.max(0, dashboardData.todayTarget - dashboardData.todayCompleted)} left
                </span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5 text-center">
                <label className="text-xs tracking-wide font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block">
                  How many chapters completed?
                </label>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback.tap();
                      setCount((c) => Math.max(1, Number(c || 1) - 1));
                    }}
                    className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-lg font-bold flex items-center justify-center active:scale-95 transition-all"
                  >
                    -
                  </button>

                  <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    max="50"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        onClose();
                      }
                    }}
                    className="w-24 h-14 text-center font-mono text-3xl tracking-tight font-black rounded-2xl bg-slate-50 dark:bg-black/40 border-2 border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none text-text-main dark:text-text-darkMain transition-all shadow-inner"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback.tap();
                      setCount((c) => Number(c || 0) + 1);
                    }}
                    className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-lg font-bold flex items-center justify-center active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>

                {/* Quick Selection Pills */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  {[1, 2, 3, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        hapticFeedback.tap();
                        setCount(val);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs tracking-wide font-bold transition-all ${
                        Number(count) === val
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 text-text-muted hover:text-text-main'
                      }`}
                    >
                      +{val} {val === 1 ? 'ch' : 'chs'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit / Keyboard instruction */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs tracking-wide font-semibold text-text-muted dark:text-text-darkMuted transition-all active:scale-95"
                >
                  Cancel (Esc)
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-2xl bg-accent hover:opacity-90 text-white text-xs tracking-wide font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <span>Log Now</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


