import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Award,
  Clock,
  Flame,
  Target,
  Lightbulb,
  Keyboard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../components/BottomSheet';
import { hapticFeedback } from '../utils/haptics';

export default function Timer() {
  const { recordTimerSession, dashboardData, activeExam } = useApp();
  const navigate = useNavigate();

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [topicsFinished, setTopicsFinished] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const intervalRef = useRef(null);

  // Interval timer tracking seconds
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Formatted time string inside useMemo
  const formattedTime = useMemo(() => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }, [seconds]);

  const sessionMinutes = useMemo(() => {
    return Math.max(1, Math.round(seconds / 60));
  }, [seconds]);

  // Handlers
  const handleStartPause = useCallback(() => {
    setIsRunning((prev) => {
      if (!prev) {
        hapticFeedback.light();
      } else {
        hapticFeedback.tap();
      }
      return !prev;
    });
  }, []);

  const handleReset = useCallback(() => {
    hapticFeedback.tap();
    setIsRunning(false);
    setSeconds(0);
  }, []);

  const handleStop = useCallback(() => {
    hapticFeedback.heavy();
    setIsRunning(false);
    setShowBottomSheet(true);
  }, []);

  // Desktop keyboard shortcut: Spacebar to toggle Play/Pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && !showBottomSheet) {
        e.preventDefault();
        handleStartPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStartPause, showBottomSheet]);

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    hapticFeedback.success();
    setIsSubmitting(true);
    try {
      const success = await recordTimerSession(sessionMinutes, Number(topicsFinished) || 0);
      if (success) {
        setShowBottomSheet(false);
        setSeconds(0);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24 md:pb-12">
      {/* Header */}
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
            {activeExam?.name || 'Exam Prep'}
          </span>
          <span className="text-xs tracking-wide text-label-secondary">• Focus Stopwatch</span>
        </div>
        <h1 className="text-2xl tracking-tight sm:text-3xl tracking-tight font-black text-label tracking-tight">
          Deep Work Focus Timer
        </h1>
        <p className="text-xs tracking-wide text-label-secondary">
          Track uninterrupted study sessions. When finished, log your topics to automatically
          advance today's target.
        </p>
      </div>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Big Stopwatch Display & Controls (Desktop: col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative bg-background-elevated border-[0.5px] border-border rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center overflow-hidden transition-all duration-300">
            {isRunning && (
              <div className="absolute inset-0 bg-accent/5 rounded-3xl animate-pulse pointer-events-none"></div>
            )}

            <div className="relative z-10 flex flex-col items-center">
              {/* Status Chip */}
              <div className="mb-4 sm:mb-6">
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs tracking-wide font-bold uppercase tracking-wider border flex items-center gap-2 transition-all duration-300 ${
                    isRunning
                      ? 'bg-success/15 text-success border-success/30 shadow-sm'
                      : seconds > 0
                        ? 'bg-accent/15 text-accent border-accent/25'
                        : 'bg-background-elevated text-label-secondary border-border'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRunning
                        ? 'bg-success animate-ping'
                        : seconds > 0
                          ? 'bg-accent'
                          : 'bg-label-secondary/40'
                    }`}
                  />
                  {isRunning ? 'Recording Focus' : seconds > 0 ? 'Paused' : 'Ready to Focus'}
                </span>
              </div>

              {/* Time digits in HH:MM:SS */}
              <div className="font-mono text-5xl sm:text-7xl font-black text-label tracking-wider my-2 sm:my-4 drop-shadow-sm select-none">
                {formattedTime}
              </div>

              <p className="text-xs tracking-wide sm:text-sm text-label-secondary mt-1">
                {seconds > 0
                  ? `~${sessionMinutes} minute${sessionMinutes === 1 ? '' : 's'} elapsed in this block`
                  : 'Click Start or press Spacebar to begin'}
              </p>
            </div>

            {/* Stopwatch Action Controls */}
            <div className="relative z-10 flex items-center justify-center gap-5 mt-8 sm:mt-10 w-full">
              <button
                type="button"
                onClick={handleReset}
                disabled={seconds === 0}
                title="Reset timer"
                className="w-13 h-13 p-3.5 rounded-2xl bg-background hover:bg-background-elevated border-[0.5px] border-border flex items-center justify-center text-label-secondary disabled:opacity-25 active:scale-95 transition-all shadow-sm"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleStartPause}
                title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
                className="w-18 h-18 p-5 rounded-3xl flex items-center justify-center text-white bg-accent hover:opacity-90 shadow-sm active:scale-95 transition-all duration-200"
              >
                {isRunning ? (
                  <Pause className="w-8 h-8 fill-white" />
                ) : (
                  <Play className="w-8 h-8 fill-white translate-x-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleStop}
                disabled={seconds === 0}
                title="Stop & Log session"
                className="w-13 h-13 p-3.5 rounded-2xl bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 border border-[#FF3B30]/20 flex items-center justify-center text-[#FF3B30] disabled:opacity-25 active:scale-95 transition-all shadow-sm"
              >
                <Square className="w-5 h-5 fill-[#FF3B30]" />
              </button>
            </div>

            {/* Desktop Hint */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-label-secondary mt-6 opacity-75">
              <Keyboard className="w-3.5 h-3.5" />
              <span>
                Tip: Press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px] font-bold">
                  Space
                </kbd>{' '}
                to pause / resume anytime
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Focus Alignment, Target Context & Deep Work Strategy (Desktop: col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Alignment Card */}
          {dashboardData && (
            <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-wide font-bold text-label flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-accent" />
                  <span>Today's Target Alignment</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-label-secondary">
                  Live Sync
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background border-[0.5px] border-border rounded-2xl p-3.5">
                  <span className="text-[10px] uppercase font-bold text-label-secondary block">
                    Target Chapters
                  </span>
                  <span className="text-xl font-black font-mono text-label">
                    {Math.max(0, dashboardData.todayTarget - dashboardData.todayCompleted)} left
                  </span>
                  <span className="text-[10px] text-label-secondary block">
                    of {dashboardData.todayTarget} today
                  </span>
                </div>

                <div className="bg-background border-[0.5px] border-border rounded-2xl p-3.5">
                  <span className="text-[10px] uppercase font-bold text-label-secondary block">
                    Focused Today
                  </span>
                  <span className="text-xl font-black font-mono text-accent">
                    {dashboardData.timeStudiedMinutes || 0}
                  </span>
                  <span className="text-[10px] text-label-secondary block">total minutes</span>
                </div>
              </div>

              {/* Progress Bar of Today's Target */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-semibold text-label-secondary">
                  <span>Daily Target Completed</span>
                  <span className="text-accent font-bold">
                    {dashboardData.todayTarget > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (dashboardData.todayCompleted / dashboardData.todayTarget) * 100
                          )
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{
                      width: `${dashboardData.todayTarget > 0 ? Math.min(100, (dashboardData.todayCompleted / dashboardData.todayTarget) * 100) : (dashboardData.todayCompleted > 0 ? 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Deep Work Tips Card */}
          <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs tracking-wide font-bold text-label">
              <Lightbulb className="w-4 h-4 text-accent" />
              <span>Effective Study Technique</span>
            </div>

            <div className="space-y-2.5 text-xs tracking-wide text-label-secondary leading-relaxed">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-background border-[0.5px] border-border">
                <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="text-label block font-bold">The 50/10 Rule</strong>
                  Aim for 50 minutes of deep, notification-free focus followed by a 10-minute rest
                  away from screens.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-background border-[0.5px] border-border">
                <Flame className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="text-label block font-bold">
                    Active Recall Over Passive Reading
                  </strong>
                  Close your notes after completing a section and test yourself on key formulas and
                  concepts immediately.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sheet Drawer on Mobile / Centered Modal Dialog on Desktop */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title="Session Completed"
      >
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent border border-accent/20 flex items-center justify-center mx-auto shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <p className="text-xs tracking-wide text-label-secondary">
              You studied for{' '}
              <strong className="text-accent font-bold">{sessionMinutes} minutes</strong>!
            </p>
          </div>

          <form onSubmit={handleModalSubmit} className="space-y-4 pt-1">
            <div className="bg-background-elevated border-[0.5px] border-border rounded-2xl p-4 space-y-2">
              <label className="text-xs tracking-wide font-semibold text-label block text-center">
                How many topics did you finish in this session?
              </label>

              {/* Topics Stepper */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback.tap();
                    setTopicsFinished((p) => Math.max(0, p - 1));
                  }}
                  className="w-11 h-11 rounded-xl bg-background hover:bg-background-elevated border-[0.5px] border-border text-label font-bold flex items-center justify-center active:scale-95 transition-all text-lg"
                >
                  -
                </button>

                <input
                  type="number"
                  min="0"
                  max="20"
                  value={topicsFinished}
                  onChange={(e) => setTopicsFinished(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 h-12 text-center text-2xl tracking-tight font-black bg-background border border-accent/40 rounded-xl text-label focus:ring-2 focus:ring-accent focus:outline-none focus:border-transparent shadow-sm transition-all duration-300 ease-in-out"
                />

                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback.tap();
                    setTopicsFinished((p) => p + 1);
                  }}
                  className="w-11 h-11 rounded-xl bg-background hover:bg-background-elevated border-[0.5px] border-border text-label font-bold flex items-center justify-center active:scale-95 transition-all text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.tap();
                  setShowBottomSheet(false);
                }}
                className="flex-1 py-3.5 rounded-xl bg-background-elevated hover:opacity-80 text-label-secondary font-semibold text-xs tracking-wide active:scale-95 transition-all duration-300 ease-in-out border-[0.5px] border-border"
              >
                Discard
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl bg-accent hover:opacity-90 text-white font-bold text-xs tracking-wide shadow-sm active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save & Log'}
              </button>
            </div>
          </form>
        </div>
      </BottomSheet>
    </div>
  );
}


