import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { queryKeys } from '../utils/queryKeys';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Square,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  RotateCcw,
  PictureInPicture2,
  Check,
  ExternalLink,
  Settings, Smile, Meh, Frown,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Drawer } from 'vaul';
import { useTimerStore } from '../store/useTimerStore';
import { useApp } from '../context/AppContext';
import { hapticFeedback } from '../utils/haptics';
import { scheduleSpacedRepetitionAlert } from '../utils';
import { useIsMobile } from '../hooks/useMediaQuery';
import api from '../services/api';

/**
 * Native Document Picture-in-Picture Mini Player Component
 * Rendered into the tear-out always-on-top system window via React Portal
 */
function PipTimerPortal({
  formattedTime,
  activeTopic,
  isActive,
  onTogglePlayPause,
  onStop,
  onCompleteTopic,
  onClosePip,
  stopShortcutHint = '⌘.',
}) {
  return (
    <div className="h-full w-full bg-[#121212] text-white p-4 flex flex-col justify-between font-sans select-none antialiased border border-white/10">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block truncate">
              {activeTopic?.subjectName || 'Focus Session'}
            </span>
            <span className="text-xs tracking-wide font-black truncate block text-white">
              {activeTopic?.title || 'Active Topic'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClosePip}
          className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
          title="Return to Browser"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Large Digital Clock & Controls */}
      <div className="flex items-center justify-between py-2 border-y border-white/10 my-1">
        <span className="font-mono tabular-nums text-2xl tracking-tight font-black text-white px-2 py-0.5 rounded-xl bg-white/5">
          {formattedTime}
        </span>

        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={onTogglePlayPause}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title={isActive ? 'Pause (Space)' : 'Resume (Space)'}
          >
            {isActive ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
          </button>

          {/* Stop Button */}
          <button
            type="button"
            onClick={onStop}
            className="p-2 rounded-xl bg-[#FF3B30] hover:bg-[#e0342a] text-white transition-all cursor-pointer shadow-sm"
            title={`Stop Focus Session (${stopShortcutHint})`}
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Bottom: Up Next Topic Completion Toggle */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-white/50">Finished this topic?</span>
        <button
          type="button"
          onClick={onCompleteTopic}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4ECDC4] hover:bg-[#45b7af] text-[#121212] font-black text-xs tracking-wide transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Mark Done</span>
        </button>
      </div>
    </div>
  );
}

export default function FloatingTimer() {
  const isMobile = useIsMobile();
  const { isActive, seconds, activeTopic, pauseTimer, resumeTimer, stopTimer, resetTimer } =
    useTimerStore();
  const { dashboardData, toggleChapter, quickIncrement } = useApp();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [isStrictPomodoro, setIsStrictPomodoro] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('strictPomodoro') === 'true' : false
  );
  const [pomodoroPreset, setPomodoroPreset] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('pomodoroPreset') || '50/10' : '50/10'
  );

  // Sync Strict Pomodoro state across components & Spotlight
  useEffect(() => {
    const handleStrictChange = (e) => {
      if (typeof e.detail?.isStrict === 'boolean') {
        setIsStrictPomodoro(e.detail.isStrict);
      }
      if (e.detail?.preset) {
        setPomodoroPreset(e.detail.preset);
      }
    };
    window.addEventListener('strict-pomodoro-changed', handleStrictChange);
    return () => window.removeEventListener('strict-pomodoro-changed', handleStrictChange);
  }, []);

  const handleToggleStrictPomodoro = (newStrict, newPreset = pomodoroPreset) => {
    hapticFeedback.tap();
    setIsStrictPomodoro(newStrict);
    setPomodoroPreset(newPreset);
    localStorage.setItem('strictPomodoro', String(newStrict));
    localStorage.setItem('pomodoroPreset', newPreset);
    window.dispatchEvent(
      new CustomEvent('strict-pomodoro-changed', {
        detail: { isStrict: newStrict, preset: newPreset },
      })
    );
    toast.success(
      newStrict
        ? `⚡ Strict Pomodoro Active (${newPreset === '25/5' ? '25m Focus / 5m Break' : '50m Focus / 10m Break'})`
        : '⏱️ Switched to Standard Stopwatch Mode'
    );
  };

  // Scroll-lock body while session completion dialog is open
  useEffect(() => {
    if (isDialogOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isDialogOpen]);

  // Document Picture-in-Picture window reference
  const [pipWindow, setPipWindow] = useState(null);
  const [mood, setMood] = useState('good');
  const isPiPSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  const formattedTime = useMemo(() => {
    if (isStrictPomodoro) {
      const targetSec = (pomodoroPreset === '25/5' ? 25 : 50) * 60;
      const rem = Math.max(0, targetSec - seconds);
      const mins = Math.floor(rem / 60);
      const secs = rem % 60;
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(mins)}:${pad(secs)}`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hours > 0 ? `${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  }, [seconds, isStrictPomodoro, pomodoroPreset]);

  const durationMinutes = useMemo(() => {
    return Math.max(1, Math.round(seconds / 60));
  }, [seconds]);

  // Open Document Picture-in-Picture window
  const openDocumentPiP = async () => {
    if (!isPiPSupported) {
      toast('Document Picture-in-Picture is not supported in this browser.', { icon: 'ℹ️' });
      return;
    }
    if (pipWindow) {
      pipWindow.focus();
      return;
    }

    try {
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 360,
        height: 180,
      });

      // Copy all existing stylesheets into PiP window
      [...document.styleSheets].forEach((sheet) => {
        try {
          if (sheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            pip.document.head.appendChild(link);
          } else if (sheet.cssRules) {
            const style = document.createElement('style');
            [...sheet.cssRules].forEach((rule) => {
              style.appendChild(document.createTextNode(rule.cssText));
            });
            pip.document.head.appendChild(style);
          }
        } catch {
          // Cross-origin CSS ignored safely
        }
      });

      // Styling defaults for PiP window body
      pip.document.body.style.margin = '0';
      pip.document.body.style.padding = '0';
      pip.document.body.style.background = '#121212';
      pip.document.title = `Focus: ${activeTopic?.title || 'Timer'}`;

      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
      toast.success('Mini Player popped out! Always on top.', { id: 'pip-toast' });
    } catch (err) {
      console.error('Failed to open Document PiP:', err);
    }
  };

  // Close PiP window helper
  const closePip = () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    }
  };

  // Strict Focus Protection (Page Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        // Log distraction and pause
        api.client.post('/sessions/distraction', { topicId: activeTopic?.id }).catch(()=>{});
        pauseTimer();
        toast.error('Focus Interrupted. Timer paused.', { icon: '??' });
        
        if (isPiPSupported && !pipWindow) {
          openDocumentPiP();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, isPiPSupported, pipWindow, pauseTimer, activeTopic]);

  const isMac = useMemo(() => {
    return (
      typeof window !== 'undefined' &&
      /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
    );
  }, []);

  const stopShortcutHint = isMac ? '⌘.' : 'Ctrl+.';

  const handleStopClick = useCallback(() => {
    hapticFeedback.heavy();
    stopTimer();
    closePip();
    setIsDialogOpen(true);
  }, [stopTimer]);

  // Zero-Backend MongoDB Change Stream Heartbeat Broadcast
  useEffect(() => {
    if (activeTopic) {
      api.client
        .post('/sessions/heartbeat', {
          status: isActive ? 'focusing' : 'offline',
          topic: activeTopic.title || '',
        })
        .catch((err) => console.warn('Failed to broadcast heartbeat:', err));
    } else {
      api.client.post('/sessions/heartbeat', { status: 'offline' }).catch(() => {});
    }
  }, [isActive, activeTopic]);

  // Strict Pomodoro Auto-completion trigger
  useEffect(() => {
    if (isStrictPomodoro && isActive) {
      const targetSec = (pomodoroPreset === '25/5' ? 25 : 50) * 60;
      if (seconds >= targetSec) {
        hapticFeedback.heavy();
        handleStopClick();
        toast.success(
          `🎉 Pomodoro Focus Block Completed (${pomodoroPreset === '25/5' ? '25 mins' : '50 mins'})!`,
          { id: 'pomodoro-complete-toast', icon: '⏱️' }
        );
      }
    }
  }, [seconds, isStrictPomodoro, isActive, pomodoroPreset, handleStopClick]);

  const handleTogglePlayPause = useCallback(() => {
    if (isActive) {
      hapticFeedback.tap();
      pauseTimer();
    } else {
      hapticFeedback.medium();
      resumeTimer();
    }
  }, [isActive, pauseTimer, resumeTimer]);

  // Global Pro Keyboard Shortcuts: Space to Play/Pause, Cmd+. or Ctrl+. to Stop
  useEffect(() => {
    if (!activeTopic) return;

    const handleKeyDown = (e) => {
      const tag = e.target.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // Cmd + . or Ctrl + . -> Stop active timer & open dialog
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        if (!isDialogOpen) {
          handleStopClick();
        }
        return;
      }

      // Space -> Toggle Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isDialogOpen) {
          handleTogglePlayPause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTopic, isDialogOpen, handleStopClick, handleTogglePlayPause]);

  if (!activeTopic) return null;

  const handleCompleteSession = async (finishedTopic, mood = '') => {
    if (!activeTopic) return;
    setIsSubmitting(true);
    hapticFeedback.success();

    const planId = dashboardData?.studyPlanId;
    const topicId = activeTopic.id;
    const topicTitle = activeTopic.title;

    try {
      // 1. Log granular subtopic time to backend
      await api.logTopicTime({
          studyPlanId: planId,
          topicId,
          durationMinutes,
          topicTitle,
          subjectName: activeTopic.subjectName || 'General',
          chapterName: activeTopic.chapterName || '',
          tag: activeTopic.tag || '#Theory',
          plannedMinutes: activeTopic.plannedMinutes || durationMinutes,
          actualMinutes: durationMinutes,
          mood,
        });

      // 2. If finished, toggle topic completion and schedule SRS (if not standalone quick timer)
      if (finishedTopic && !activeTopic.isQuickTimer) {
          const res = await api.toggleNodeSRS({
            studyPlanId: planId,
            nodeId: topicId,
            isCompleted: true,
            action: 'complete',
          });
          
          if (res?.nextReviewDate) {
            scheduleSpacedRepetitionAlert(topicTitle, res.nextReviewDate);
          }

          if (toggleChapter) {
            toggleChapter(topicId, true);
          }
          quickIncrement?.(1);
          toast.success('Completed ' + topicTitle + ' & logged ' + durationMinutes + ' mins!');
        } else {
        toast(`⏱️ Logged ${durationMinutes} mins for "${topicTitle}". Keep going!`, {
          icon: '⏱️',
        });
      }

      // Invalidate queries for instant UI refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline() });

      setIsDialogOpen(false);
      closePip();
      resetTimer();
    } catch (err) {
      console.error('Failed to log topic time / completion:', err);
      toast.error('Failed to save session to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissDialog = () => {
    setIsDialogOpen(false);
    resumeTimer();
  };

  return (
    <>
      {/* 1. DOCUMENT PICTURE-IN-PICTURE (PiP) PORTAL WINDOW */}
      {pipWindow &&
        createPortal(
          <PipTimerPortal
            formattedTime={formattedTime}
            activeTopic={activeTopic}
            isActive={isActive}
            onTogglePlayPause={handleTogglePlayPause}
            onStop={handleStopClick}
            onCompleteTopic={() => handleCompleteSession(true)}
            onClosePip={closePip}
            stopShortcutHint={stopShortcutHint}
          />,
          pipWindow.document.body
        )}

      {/* 2. STICKY GLASSMORPHIC FLOATING PILL (Shown when PiP is not tearing it out) */}
      <AnimatePresence>
        {activeTopic && !pipWindow && (
          <motion.div
              layoutId="timer-morph"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-4 right-4 mx-auto max-w-[340px] md:bottom-6 md:right-6 md:left-auto md:max-w-none md:mx-0 z-50 flex items-center justify-between md:justify-start gap-2.5 sm:gap-3 px-4 py-2.5 rounded-full backdrop-blur-2xl bg-background-elevated/95 border-[0.5px] border-border shadow-sm select-none"
          >
            {/* Pulsing Dot when Active */}
            <div className="relative flex items-center justify-center shrink-0">
              {isActive && (
                <span className="absolute w-3.5 h-3.5 rounded-full bg-success/40 animate-ping" />
              )}
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                  isActive ? 'bg-success animate-pulse' : 'bg-accent'
                }`}
              />
            </div>

            {/* Topic Title (Truncated) */}
            <div className="flex flex-col min-w-0 max-w-[110px] sm:max-w-[190px]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-label-secondary truncate block">
                {activeTopic.subjectName || (isStrictPomodoro ? 'Pomodoro Focus' : 'Focusing On')}
              </span>
              <span className="text-xs tracking-wide font-bold text-label truncate block">
                {activeTopic.title}
              </span>
            </div>

            {/* Monospace Digital Clock */}
            <span className="font-mono tabular-nums font-black text-xs tracking-wide sm:text-sm text-label px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 shrink-0">
              {formattedTime}
            </span>

            {/* Picture-in-Picture Button */}
            {isPiPSupported && (
              <button
                type="button"
                onClick={openDocumentPiP}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-label-secondary hover:text-label transition-colors cursor-pointer shrink-0"
                title="Tear out to Picture-in-Picture mini player"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>
            )}

            {/* Settings Gear Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSettingsPopover((prev) => !prev)}
                className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full transition-colors cursor-pointer shrink-0 ${
                  isStrictPomodoro
                    ? 'bg-accent/15 text-accent'
                    : 'hover:bg-black/5 dark:hover:bg-white/10 text-label-secondary hover:text-label'
                }`}
                title={isStrictPomodoro ? 'Strict Pomodoro Active' : 'Timer Settings'}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Floating Settings Popover */}
              {showSettingsPopover && (
                <div className="absolute bottom-full right-0 mb-3 w-64 p-3.5 rounded-2xl bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border shadow-sm text-xs tracking-wide space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="font-bold text-label">Timer Mode</span>
                    <button
                      type="button"
                      onClick={() => setShowSettingsPopover(false)}
                      className="text-label-secondary hover:text-label p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleStrictPomodoro(false)}
                      className={`w-full py-2 px-3 rounded-xl text-left font-medium flex items-center justify-between transition-colors ${
                        !isStrictPomodoro
                          ? 'bg-accent text-white font-bold'
                          : 'bg-black/5 dark:bg-white/5 text-label hover:bg-black/10'
                      }`}
                    >
                      <span>Standard Stopwatch</span>
                      {!isStrictPomodoro && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStrictPomodoro(true, pomodoroPreset)}
                      className={`w-full py-2 px-3 rounded-xl text-left font-medium flex items-center justify-between transition-colors ${
                        isStrictPomodoro
                          ? 'bg-accent text-white font-bold'
                          : 'bg-black/5 dark:bg-white/5 text-label hover:bg-black/10'
                      }`}
                    >
                      <span>Strict Pomodoro</span>
                      {isStrictPomodoro && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>

                  {isStrictPomodoro && (
                    <div className="pt-2 border-t border-border space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-label-secondary block">
                        Preset Intervals
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStrictPomodoro(true, '50/10')}
                          className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border-[0.5px] transition-colors ${
                            pomodoroPreset === '50/10'
                              ? 'border-accent bg-accent/15 text-accent'
                              : 'border-border bg-black/5 dark:bg-white/5 text-label-secondary'
                          }`}
                        >
                          50m / 10m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStrictPomodoro(true, '25/5')}
                          className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border-[0.5px] transition-colors ${
                            pomodoroPreset === '25/5'
                              ? 'border-accent bg-accent/15 text-accent'
                              : 'border-border bg-black/5 dark:bg-white/5 text-label-secondary'
                          }`}
                        >
                          25m / 5m
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Play / Pause Toggle Button & Shortcut Badge */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleTogglePlayPause}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-label transition-colors cursor-pointer shrink-0"
                title="Play/Pause (Space)"
              >
                {isActive ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
              <kbd className="hidden sm:inline-block text-[9px] font-mono text-label-secondary bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded border border-border select-none">
                Space
              </kbd>
            </div>

            {/* Stop Button & Shortcut Badge */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleStopClick}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-[#FF3B30] hover:bg-[#e0342a] text-white transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                title={`Stop & Log Focus Session (${stopShortcutHint})`}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
              <kbd className="hidden sm:inline-block text-[9px] font-mono text-label-secondary bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded border border-border select-none">
                {stopShortcutHint}
              </kbd>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. RESPONSIVE SESSION COMPLETION DIALOG / DRAWER */}
      {isMobile ? (
        <Drawer.Root open={isDialogOpen} onOpenChange={(open) => !open && handleDismissDialog()}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out" />
            <Drawer.Content
              aria-describedby="session-ended-desc"
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[28px] bg-background-elevated/95 backdrop-blur-2xl border-t-[0.5px] border-border p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] outline-none overflow-hidden"
            >
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/20 dark:bg-white/20 shrink-0" />
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/10 border-[0.5px] border-accent/20 text-accent flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <Drawer.Title className="text-base font-bold text-label tracking-tight">
                      Session Ended
                    </Drawer.Title>
                    <p id="session-ended-desc" className="text-xs tracking-wide text-label-secondary mt-0.5">
                      {durationMinutes} minute{durationMinutes === 1 ? '' : 's'} recorded
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismissDialog}
                  className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-label-secondary hover:text-label transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Prompt Body */}
                {/* Micro-Journaling Mood Tracker */}
                <div className="my-6">
                  <p className="text-xs tracking-wide font-bold text-label-secondary mb-3 text-center">How did this session feel?</p>
                  <div className="flex items-center justify-center gap-4">
                    <button type="button" onClick={() => setMood('good')} className={"p-3 rounded-2xl transition-all border-[0.5px] " + (mood === 'good' ? "bg-success/10 border-success/30 scale-110" : "bg-black/5 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100")}><Smile className={"w-6 h-6 " + (mood === 'good' ? "text-success" : "text-label-secondary")} /></button>
                    <button type="button" onClick={() => setMood('neutral')} className={"p-3 rounded-2xl transition-all border-[0.5px] " + (mood === 'neutral' ? "bg-accent/10 border-accent/30 scale-110" : "bg-black/5 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100")}><Meh className={"w-6 h-6 " + (mood === 'neutral' ? "text-accent" : "text-label-secondary")} /></button>
                    <button type="button" onClick={() => setMood('exhausted')} className={"p-3 rounded-2xl transition-all border-[0.5px] " + (mood === 'exhausted' ? "bg-warning/10 border-warning/30 scale-110" : "bg-black/5 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100")}><Frown className={"w-6 h-6 " + (mood === 'exhausted' ? "text-warning" : "text-label-secondary")} /></button>
                  </div>
                </div>
              <div className="py-5 space-y-3">
                <p className="text-sm font-medium text-label leading-relaxed">
                  You focused for{' '}
                  <span className="font-bold text-accent">
                    {durationMinutes} minute{durationMinutes === 1 ? '' : 's'}
                  </span>{' '}
                  on{' '}
                  <span className="font-bold underline decoration-accent/40 underline-offset-2">
                    "{activeTopic?.title}"
                  </span>
                  .
                </p>
                <p className="text-xs tracking-wide text-label-secondary">Did you finish this topic?</p>
              </div>

              {/* Action Buttons with 44px min height */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCompleteSession(true, mood)}
                  className="w-full sm:flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-accent hover:opacity-90 active:scale-95 text-white font-medium text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Yes, Completed</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCompleteSession(false, mood)}
                  className="w-full sm:flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-label font-medium text-xs tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Clock className="w-4 h-4 text-label-secondary" />
                  <span>Not Yet (Keep Going)</span>
                </button>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <Dialog.Root open={isDialogOpen} onOpenChange={(open) => !open && handleDismissDialog()}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[92vw] max-w-md rounded-3xl bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border shadow-sm p-6 sm:p-7 outline-none animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/10 border-[0.5px] border-accent/20 text-accent flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <Dialog.Title className="text-base font-bold text-label tracking-tight">
                      Session Ended
                    </Dialog.Title>
                    <Dialog.Description className="text-xs tracking-wide text-label-secondary mt-0.5">
                      {durationMinutes} minute{durationMinutes === 1 ? '' : 's'} recorded
                    </Dialog.Description>
                  </div>
                </div>

                <Dialog.Close asChild>
                  <button
                    type="button"
                    onClick={handleDismissDialog}
                    className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-label-secondary hover:text-label transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Prompt Body */}
                {/* Micro-Journaling Mood Tracker */}
                <div className="my-6">
                  <p className="text-xs tracking-wide font-bold text-label-secondary mb-3 text-center">How did this session feel?</p>
                  <div className="flex items-center justify-center gap-4">
                    <button type="button" onClick={() => setMood('good')} className={"p-3 rounded-2xl transition-all border-[0.5px] " + (mood === 'good' ? "bg-success/10 border-success/30 scale-110" : "bg-black/5 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100")}><Smile className={"w-6 h-6 " + (mood === 'good' ? "text-success" : "text-label-secondary")} /></button>
                    <button type="button" onClick={() => setMood('neutral')} className={"p-3 rounded-2xl transition-all border-[0.5px] " + (mood === 'neutral' ? "bg-accent/10 border-accent/30 scale-110" : "bg-black/5 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100")}><Meh className={"w-6 h-6 " + (mood === 'neutral' ? "text-accent" : "text-label-secondary")} /></button>
                    <button type="button" onClick={() => setMood('exhausted')} className={"p-3 rounded-2xl transition-all border-[0.5px] " + (mood === 'exhausted' ? "bg-warning/10 border-warning/30 scale-110" : "bg-black/5 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100")}><Frown className={"w-6 h-6 " + (mood === 'exhausted' ? "text-warning" : "text-label-secondary")} /></button>
                  </div>
                </div>
              <div className="py-5 space-y-3">
                <p className="text-sm font-medium text-label leading-relaxed">
                  You focused for{' '}
                  <span className="font-bold text-accent">
                    {durationMinutes} minute{durationMinutes === 1 ? '' : 's'}
                  </span>{' '}
                  on{' '}
                  <span className="font-bold underline decoration-accent/40 underline-offset-2">
                    "{activeTopic?.title}"
                  </span>
                  .
                </p>
                <p className="text-xs tracking-wide text-label-secondary">Did you finish this topic?</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCompleteSession(true, mood)}
                  className="w-full sm:flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-accent hover:opacity-90 active:scale-95 text-white font-medium text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Yes, Completed</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCompleteSession(false, mood)}
                  className="w-full sm:flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-label font-medium text-xs tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Clock className="w-4 h-4 text-label-secondary" />
                  <span>Not Yet (Keep Going)</span>
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}


















