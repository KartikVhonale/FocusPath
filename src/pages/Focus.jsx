import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { queryKeys } from '../utils/queryKeys';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  Play,
  Pause,
  Square,
  Sparkles,
  CheckCircle,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Target,
  ArrowRight,
  Award,
  ChevronRight,
  Settings,
  Check,
  X,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTimerStore } from '../store/useTimerStore';
import { useDashboard, useToggleNode, useUndoTask } from '../hooks/useStudyPlan';
import { useEditHistory, useTimeline } from '../hooks/useHistory';
import { getGreeting, isNightShift, hapticFeedback, supportsTriggers } from '../utils';
import { AppleButton } from '../components/ui';
import { Drawer } from 'vaul';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useCanvasScroll } from '../hooks/useCanvasScroll';
import DashboardSkeleton from '../components/DashboardSkeleton';
import SwipeableQueueItem from '../components/SwipeableQueueItem';
import SwipeableCompletedItem from '../components/SwipeableCompletedItem';
import AmbientAudioPlayer from '../components/AmbientAudioPlayer';
import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import QuickTimerSection from '../components/QuickTimerSection';
import AnimatedOdometer from '../components/AnimatedOdometer';
import TimelineFeedSheet from '../components/TimelineFeedSheet';
import api from '../services/api';

/**
 * Focus Component (Apple HIG Ultra-Minimalist Focus Screen)
 *
 * Design Principles:
 * 1. Forward-looking & fluid: Up Next & SRS queues with instant exit and reverse undo animations.
 * 2. Editable Completed Today: Swipe left to undo tasks, Radix popover to adjust logged minutes.
 * 3. Separation of Concerns: Retroactive edits/unchecking belong strictly in the Path Time Machine.
 * 4. Top Center: Massive Circular Timer / Progress Ring with floating Audio Pill.
 * 5. Bottom Half: Distraction-free Up Next and Spaced Repetition (SRS) Review queues.
 * 6. Centralized Hooks & DRY Architecture: TanStack Query logic extracted to src/hooks.
 */
export default function Focus() {
  const {
    dashboardData: contextDashboardData,
    hasPlan: contextHasPlan,
    loading: contextLoading,
    error: contextError,
    recordTimerSession,
  } = useApp();
  const { user, isManagedStudent, teacherName, cohortNotes } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { scrollY } = useCanvasScroll(35);

  // Centralized Hook: Fetch Dashboard Data
  const { data: queryDashboardRes, isLoading: queryLoading, error: queryError } = useDashboard();

  const dashboardData = queryDashboardRes?.hasPlan ? queryDashboardRes.data : contextDashboardData;
  const hasPlan = queryDashboardRes ? queryDashboardRes.hasPlan : contextHasPlan;
  const loading = queryLoading && !dashboardData && contextLoading;
  const error = queryError?.message || contextError;

  // Local optimistic tracking to ensure items vanish with zero delay
  const [completedTopicIds, setCompletedTopicIds] = useState(new Set());
  const [snoozedTopicIds, setSnoozedTopicIds] = useState(new Set());

  // Completed Today Trophy Case State
  const [completedTodayList, setCompletedTodayList] = useState([]);
  const [sessionTasksConquered, setSessionTasksConquered] = useState(0);

  // Sync initial and query-refreshed todayCompletedTopics from backend
  useEffect(() => {
    if (Array.isArray(dashboardData?.todayCompletedTopics)) {
      setCompletedTodayList(dashboardData.todayCompletedTopics);
    }
  }, [dashboardData?.todayCompletedTopics]);

  // Contextual Time of Day Greeting & Apple Night Shift Lighting from Centralized Utils
  const greeting = useMemo(() => getGreeting(), []);
  const nightShiftActive = useMemo(() => isNightShift(), []);

  const isMac = useMemo(() => {
    return (
      typeof window !== 'undefined' &&
      /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
    );
  }, []);

  const stopShortcutHint = isMac ? '⌘.' : 'Ctrl+.';

  // Focus Timer State & Strict Pomodoro Settings
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);
  const [sessionFinishedFlash, setSessionFinishedFlash] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Strict Pomodoro Mode (50m/10m or 25m/5m)
  const [isStrictPomodoro, setIsStrictPomodoro] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('strictPomodoro') === 'true' : false
  );
  const [pomodoroPreset, setPomodoroPreset] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('pomodoroPreset') || '50/10' : '50/10'
  );

  const isGlobalTimerActive = useTimerStore((s) => s.isActive);

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

  const handleToggleStrict = useCallback(
    (newStrict, newPreset = pomodoroPreset) => {
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
    },
    [pomodoroPreset]
  );

  // Filter visible upNext queue excluding locally completed or snoozed items
  const visibleUpNextQueue = useMemo(
    () =>
      (dashboardData?.upNextQueue || []).filter(
        (item) => !completedTopicIds.has(item.id) && !snoozedTopicIds.has(item.id)
      ),
    [dashboardData?.upNextQueue, completedTopicIds, snoozedTopicIds]
  );

  // Filter visible review queue (SRS) excluding locally completed or snoozed items
  const visibleReviewQueue = useMemo(
    () =>
      (dashboardData?.reviewQueue || []).filter(
        (item) => !completedTopicIds.has(item.id) && !snoozedTopicIds.has(item.id)
      ),
    [dashboardData?.reviewQueue, completedTopicIds, snoozedTopicIds]
  );

  // Smart Defaults: Auto-Queue the #1 most urgent subtopic (SRS Review Due has priority, followed by Up Next)
  const autoQueuedTopic = useMemo(
    () => visibleReviewQueue[0] || visibleUpNextQueue[0] || null,
    [visibleReviewQueue, visibleUpNextQueue]
  );
  const [customFocusTopic, setCustomFocusTopic] = useState(null);
  const [isTimelineFeedOpen, setIsTimelineFeedOpen] = useState(false);
  const [hasCelebratedQuota, setHasCelebratedQuota] = useState(false);

  const quotaTodayTarget = dashboardData?.todayTarget || 0;
  const quotaTodayCompleted = dashboardData?.todayCompleted || 0;
  const quotaDailyTargetHours = dashboardData?.dailyTargetHours || 4;
  const quotaTimeStudiedMinutes = dashboardData?.timeStudiedMinutes || 0;
  const quotaDailyTargetMinutes = (Number(quotaDailyTargetHours) || 4) * 60;

  const isDailyQuotaComplete = Boolean(
    (quotaTodayTarget > 0 && quotaTodayCompleted >= quotaTodayTarget) ||
    (quotaDailyTargetMinutes > 0 && quotaTimeStudiedMinutes >= quotaDailyTargetMinutes)
  );

  useEffect(() => {
    if (isDailyQuotaComplete && !hasCelebratedQuota) {
      hapticFeedback.success();
      setHasCelebratedQuota(true);
    }
  }, [isDailyQuotaComplete, hasCelebratedQuota]);

  const { data: timelineRes } = useTimeline(30);
  const timelineData = timelineRes?.timeline || [];

  const currentUpNext = customFocusTopic || autoQueuedTopic;

  const timerIntervalRef = useRef(null);

  // Auto-Break Suggestions & Rest Interval State
  const [isBreakMode, setIsBreakMode] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState(600);
  const [isBreakRunning, setIsBreakRunning] = useState(false);
  const breakIntervalRef = useRef(null);

  const isZenDimmed = isTimerRunning || isBreakRunning || isGlobalTimerActive;

  const breakTargetSeconds = useMemo(() => {
    return (pomodoroPreset === '25/5' ? 5 : 10) * 60;
  }, [pomodoroPreset]);

  const formattedBreakTime = useMemo(() => {
    const mins = Math.floor(breakSeconds / 60);
    const secs = breakSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [breakSeconds]);

  const breakProgressValue = useMemo(() => {
    if (breakTargetSeconds <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, ((breakTargetSeconds - breakSeconds) / breakTargetSeconds) * 100)
    );
  }, [breakTargetSeconds, breakSeconds]);

  // One-Tap Quick Timers (Standalone Category Session)
  const handleStartQuickTimer = useCallback((quickTask) => {
    hapticFeedback.tap();
    setCustomFocusTopic(quickTask);
    useTimerStore.getState().startTimer(quickTask);
    setIsTimerMode(true);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setIsAutoPaused(false);
    setIsBreakMode(false);
    setIsBreakRunning(false);
  }, []);

  // One-Tap Focus: Starts 50-minute block on the auto-queued subtopic with zero friction
  const handleStartTimer = useCallback(() => {
    hapticFeedback.medium();
    const topicToStart = currentUpNext;
    if (topicToStart) {
      useTimerStore.getState().startTimer({
        id: topicToStart.id,
        title: topicToStart.title,
        subjectName: topicToStart.subjectName,
        chapterName: topicToStart.chapterName,
        tag: topicToStart.tag || '#Theory',
      });
    }
    // Default to strict 50m block for zero-friction deep work
    if (!localStorage.getItem('strictPomodoro')) {
      handleToggleStrict(true, '50/10');
    }
    setIsTimerMode(true);
    setIsTimerRunning(true);
    setIsAutoPaused(false);
    setIsBreakMode(false);
    setIsBreakRunning(false);
  }, [currentUpNext, handleToggleStrict]);

  const handleStopTimer = useCallback(() => {
    hapticFeedback.heavy();
    setIsTimerRunning(false);
    setIsBreakMode(false);
    setIsBreakRunning(false);
    setSessionFinishedFlash(true);
    setIsCompletionModalOpen(true);
    setTimeout(() => setSessionFinishedFlash(false), 2500);
  }, []);

  const handleCancelTimer = useCallback(() => {
    hapticFeedback.tap();
    setIsTimerRunning(false);
    setIsTimerMode(false);
    setTimerSeconds(0);
    setIsAutoPaused(false);
    setIsBreakMode(false);
    setIsBreakRunning(false);
    setCustomFocusTopic(null);
  }, []);

  const handleStartBreak = useCallback(() => {
    hapticFeedback.medium();
    setIsBreakRunning(true);
  }, []);

  const handleSkipBreak = useCallback(() => {
    hapticFeedback.tap();
    setIsBreakMode(false);
    setIsBreakRunning(false);
    handleStopTimer();
  }, [handleStopTimer]);

  const togglePlayPause = useCallback(() => {
    setIsAutoPaused(false);
    setIsTimerRunning((prev) => {
      if (!prev) hapticFeedback.light();
      else hapticFeedback.tap();
      return !prev;
    });
  }, []);

  // Global event listener: start focus timer from Spotlight
  useEffect(() => {
    const handleStartFocusEvent = () => {
      handleStartTimer();
    };
    window.addEventListener('start-focus-timer', handleStartFocusEvent);
    return () => window.removeEventListener('start-focus-timer', handleStartFocusEvent);
  }, [handleStartTimer]);

  // Timer Tick Interval
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  // Break Tick Interval
  useEffect(() => {
    if (isBreakMode && isBreakRunning) {
      breakIntervalRef.current = setInterval(() => {
        setBreakSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(breakIntervalRef.current);
            setIsBreakRunning(false);
            setIsBreakMode(false);
            hapticFeedback.success();
            toast.success('Break complete! Mind is recharged.', { icon: '✨' });
            handleStopTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
    }
    return () => {
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    };
  }, [isBreakMode, isBreakRunning, handleStopTimer]);

  // Pomodoro Target Seconds Calculation
  const pomodoroTargetSeconds = useMemo(() => {
    return (pomodoroPreset === '25/5' ? 25 : 50) * 60;
  }, [pomodoroPreset]);

  // Auto-complete trigger when strict pomodoro countdown reaches limit: Transition to Auto-Break Suggestion
  useEffect(() => {
    if (isStrictPomodoro && isTimerRunning && timerSeconds >= pomodoroTargetSeconds) {
      hapticFeedback.heavy();
      setIsTimerRunning(false);
      setIsBreakMode(true);
      const breakMins = pomodoroPreset === '25/5' ? 5 : 10;
      setBreakSeconds(breakMins * 60);
      setIsBreakRunning(false);
      toast.success(`🎉 Focus Block Conquered! Ready for a ${breakMins}m rest break.`, {
        icon: '☕',
        duration: 5000,
      });
    }
  }, [isStrictPomodoro, isTimerRunning, timerSeconds, pomodoroTargetSeconds, pomodoroPreset]);

  // Page Visibility API Auto-Pause: Pauses stopwatch when switching tabs/apps
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTimerRunning) {
        setIsTimerRunning(false);
        setIsAutoPaused(true);
        toast('⏸️ Focus session auto-paused while away.', {
          id: 'auto-pause-toast',
          icon: '⏸️',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTimerRunning]);

  const formattedTimer = useMemo(() => {
    if (isStrictPomodoro) {
      const rem = Math.max(0, pomodoroTargetSeconds - timerSeconds);
      const minutes = Math.floor(rem / 60);
      const secs = rem % 60;
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(minutes)}:${pad(secs)}`;
    }
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const secs = timerSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
      : `${pad(minutes)}:${pad(secs)}`;
  }, [timerSeconds, isStrictPomodoro, pomodoroTargetSeconds]);

  const timerProgressValue = useMemo(() => {
    if (isStrictPomodoro) {
      return Math.min(100, (timerSeconds / pomodoroTargetSeconds) * 100);
    }
    return ((timerSeconds % 60) / 60) * 100 || (isTimerRunning ? 100 : 0);
  }, [isStrictPomodoro, timerSeconds, pomodoroTargetSeconds, isTimerRunning]);

  const sessionMinutes = useMemo(() => {
    return Math.max(1, Math.round(timerSeconds / 60));
  }, [timerSeconds]);

  // Apple HIG Minimalist Timer Ring Colors:
  // - Paused or Idle: var(--color-accent)
  // - Running or Session Finished: var(--color-success)
  const timerRingColor = useMemo(() => {
    if (sessionFinishedFlash || isCompletionModalOpen || isTimerRunning) {
      return 'var(--color-success)';
    }
    return 'var(--color-accent)';
  }, [sessionFinishedFlash, isCompletionModalOpen, isTimerRunning]);

  const isCompletedToday = useMemo(() => {
    const target = dashboardData?.todayTarget || 0;
    const completed = dashboardData?.todayCompleted || 0;
    return target > 0 && completed >= target;
  }, [dashboardData?.todayTarget, dashboardData?.todayCompleted]);

  const idleRingColor = useMemo(() => {
    if (sessionFinishedFlash || isCompletedToday) {
      return 'var(--color-success)';
    }
    return 'var(--color-accent)';
  }, [sessionFinishedFlash, isCompletedToday]);

  // PART 4: End-of-Session Dopamine Card Dismiss Handler
  const handleDismissDopamineCard = useCallback(async () => {
    hapticFeedback.success();
    setIsSubmittingSession(true);
    try {
      const tasksCount = sessionTasksConquered > 0 ? sessionTasksConquered : 1;
      await recordTimerSession(sessionMinutes, tasksCount);
      setIsCompletionModalOpen(false);
      setIsTimerMode(false);
      setTimerSeconds(0);
      setIsAutoPaused(false);
      setSessionTasksConquered(0);
      setSessionFinishedFlash(true);
      setTimeout(() => setSessionFinishedFlash(false), 2500);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline() });
      toast.success('Focus session recorded. Streak maintained 🔥', {
        duration: 2500,
        position: 'top-center',
      });
    } catch (err) {
      console.error('Failed to record timer session:', err);
      toast.error('Failed to save session to server.');
    } finally {
      setIsSubmittingSession(false);
    }
  }, [sessionTasksConquered, recordTimerSession, sessionMinutes, queryClient]);

  // Spacebar & Cmd+. / Ctrl+. Pro Desktop Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // Enter key to dismiss Dopamine Card when modal is open
      if (isCompletionModalOpen && e.key === 'Enter') {
        e.preventDefault();
        handleDismissDopamineCard();
        return;
      }

      // Cmd + . or Ctrl + . -> Stop active timer & open summary modal
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        if (isTimerMode && !isCompletionModalOpen) {
          handleStopTimer();
        }
        return;
      }

      // Spacebar -> Toggle Play/Pause or Start Timer / Break
      if (e.code === 'Space') {
        e.preventDefault();
        if (isBreakMode) {
          setIsBreakRunning((prev) => !prev);
        } else if (!isTimerMode) {
          handleStartTimer();
        } else if (!isCompletionModalOpen) {
          togglePlayPause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isTimerMode,
    isCompletionModalOpen,
    isTimerRunning,
    isBreakMode,
    togglePlayPause,
    handleDismissDopamineCard,
    handleStartTimer,
    handleStopTimer,
  ]);

  // Centralized Hooks: Mutations
  const toggleNodeMutation = useToggleNode();
  const undoTaskMutation = useUndoTask();
  const editHistoryMutation = useEditHistory();

  // PART 1: Fluid Undo Action with Reverse Shared Layout Animation
  const handleUndoComplete = useCallback(
    async (item) => {
      if (!item?.id) return;
      hapticFeedback.medium();

      // Instantly detach from Completed Today and reinstate into active queue
      setCompletedTopicIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      setCompletedTodayList((prev) => prev.filter((t) => String(t.id) !== String(item.id)));
      setSessionTasksConquered((prev) => Math.max(0, prev - 1));

      toast.success('Task restored to queue', {
        duration: 2500,
        position: 'top-center',
        id: `undo-${item.id}`,
      });

      try {
        await undoTaskMutation.mutateAsync({
          studyPlanId: dashboardData?.studyPlanId,
          nodeId: item.id,
          task: item,
        });
      } catch (err) {
        console.error('Failed to undo completed topic:', err);
        setCompletedTopicIds((prev) => new Set(prev).add(item.id));
        setCompletedTodayList((prev) => [item, ...prev]);
        setSessionTasksConquered((prev) => prev + 1);
      }
    },
    [dashboardData, undoTaskMutation]
  );

  // Quick Edit Popover: update logged minutes via PATCH /api/history/edit-log
  const handleUpdateMinutes = useCallback(
    async (item, newMinutes) => {
      const todayStr = new Date().toISOString().split('T')[0];
      setCompletedTodayList((prev) =>
        prev.map((t) =>
          String(t.id) === String(item.id)
            ? { ...t, durationMinutes: newMinutes, timeSpentMinutes: newMinutes }
            : t
        )
      );

      await editHistoryMutation.mutateAsync({
        date: todayStr,
        overrideTotalMinutes: newMinutes,
      });
    },
    [editHistoryMutation]
  );

  // PART 2 & 3: Complete Topic with Micro-Interaction Confirmation
  const handleCompleteOrReview = async (item, isReview = false) => {
    if (!item?.id || completedTopicIds.has(item.id)) return;
    hapticFeedback.success();

    // 1. Mark completed locally for instant exit animation trigger & trophy addition
    setCompletedTopicIds((prev) => new Set(prev).add(item.id));
    setCompletedTodayList((prev) => {
      if (prev.some((t) => String(t.id) === String(item.id))) return prev;
      return [{ ...item, completedAt: Date.now() }, ...prev];
    });
    setSessionTasksConquered((prev) => prev + 1);

    // 2. Optimistically bump progress counter if new topic

    // 3. Native-feeling Toast at top of screen without action button (auto-dismiss 2.5s)
    toast.success('Subtopic Complete. Great work.', {
      duration: 2500,
      position: 'top-center',
      id: `task-complete-${item.id}`,
    });

    try {
      await toggleNodeMutation.mutateAsync({
        studyPlanId: dashboardData?.studyPlanId,
        nodeId: item.id,
        isCompleted: true,
        action: 'complete',
      });
    } catch (err) {
      console.error('Failed to complete/review queue item:', err);
      setCompletedTopicIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      setCompletedTodayList((prev) => prev.filter((t) => String(t.id) !== String(item.id)));
      setSessionTasksConquered((prev) => Math.max(0, prev - 1));
    }
  };

  // Snooze Action via Swipe Left
  const handleSnooze = async (item, _isReview = false) => {
    if (!item?.id || snoozedTopicIds.has(item.id)) return;
    hapticFeedback.medium();

    // Optimistically hide from today's active queues
    setSnoozedTopicIds((prev) => new Set(prev).add(item.id));

    try {
      await api.toggleNodeSRS({
        studyPlanId: dashboardData?.studyPlanId,
        nodeId: item.id,
        action: 'snooze',
      });
      toast.success('Topic snoozed to tomorrow.', {
        duration: 2500,
        position: 'top-center',
        id: `snooze-${item.id}`,
      });
    } catch (err) {
      console.error('Failed to snooze queue item:', err);
      setSnoozedTopicIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      toast.error('Failed to snooze topic');
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center text-[#FF3B30] mb-4 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-label mb-2">Unable to Load Study Plan</h2>
        <p className="text-label-secondary text-sm mb-6 max-w-sm">{error}</p>
        <AppleButton variant="primary" onClick={() => window.location.reload()}>
          Retry Connection
        </AppleButton>
      </div>
    );
  }

  // Empty State if no active StudyPlan
  if (!hasPlan || !dashboardData) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center max-w-xl mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-apple dark:shadow-apple-dark mx-auto mb-6">
          <Calendar className="w-10 h-10 stroke-[1.75]" />
        </div>

        <h2 className="text-2xl tracking-tight sm:text-3xl tracking-tight font-black text-text-main dark:text-text-darkMain tracking-tight mb-3">
          Initialize Your Focus Plan
        </h2>
        <p className="text-text-muted dark:text-text-darkMuted text-sm mb-8 leading-relaxed max-w-md">
          Pick your target competitive exam, choose your exam date, and let our adaptive engine
          auto-calculate your daily targets.
        </p>

        <Link
          to="/setup"
          onClick={() => hapticFeedback.tap()}
          className="px-8 py-4 bg-primary hover:bg-[#ff5252] rounded-2xl text-white font-black text-sm shadow-apple hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Generate Optimal Plan</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const {
    todayTarget = 0,
    todayCompleted = 0,
    isStudyDay = true,
    yesterdayMissedCount = 0,
    dailyTargetHours = 4,
    timeStudiedMinutes = 0,
    isSafeModeExceeded = false,
    safeModeWarning = '',
  } = dashboardData;

  let displayPercentage = 0;
  let isBonusWork = false;
  if (todayTarget === 0 && todayCompleted > 0) {
    displayPercentage = 100;
    isBonusWork = true;
  } else if (todayTarget > 0) {
    displayPercentage = Math.min(Math.round((todayCompleted / todayTarget) * 100), 100);
  }
  const cappedVisualProgress = displayPercentage;

  const dailyTargetMinutes = (Number(dailyTargetHours) || 4) * 60;
  const timeStudiedHoursFormatted = (timeStudiedMinutes / 60).toFixed(1);
  const rawTimeProgress =
    dailyTargetMinutes > 0 ? (timeStudiedMinutes / dailyTargetMinutes) * 100 : 0;
  const cappedTimeProgress = Math.min(100, Math.round(rawTimeProgress));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-4 pb-20 px-4 sm:px-6">
      {/* Managed Student Banner */}
      {isManagedStudent && (!isStrictPomodoro || !isTimerMode) && (
        <div
          className={`bg-secondary/10 border border-secondary/25 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-sm transition-all duration-500 ${
            isZenDimmed ? 'opacity-30 filter grayscale pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs tracking-wide font-bold text-secondary block">
                Classroom Cohort Active
              </span>
              <span className="text-[11px] text-label-secondary">
                Instructor {teacherName ? `"${teacherName}"` : ''} manages your pace & curriculum.
              </span>
            </div>
          </div>
          {cohortNotes && (
            <span className="text-[10px] bg-secondary/20 text-secondary font-bold px-2.5 py-1 rounded-full shrink-0">
              Notice: {cohortNotes}
            </span>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 1: THE iOS SCROLLING HEADER (Large Title on Mobile < 768px)          */}
      {/* ========================================================================= */}
      <div
        className={`block md:hidden mt-2 mb-2 transition-all duration-500 ${
          isZenDimmed ? 'opacity-30 filter grayscale' : 'opacity-100'
        }`}
      >
        <motion.h1
          style={{
            opacity: Math.max(0, 1 - scrollY / 50),
            y: -Math.min(15, scrollY * 0.25),
          }}
          className="text-4xl tracking-tight font-extrabold tracking-tight text-label"
        >
          Focus
        </motion.h1>
      </div>

      {/* ========================================================================= */}
      {/* PART 3: CONTEXTUAL TIME-OF-DAY HEADER & GREETING (Zen Mode Peripheral)    */}
      {/* ========================================================================= */}
      <div
        className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 transition-all duration-500 ${
          isZenDimmed ? 'opacity-30 filter grayscale pointer-events-none' : 'opacity-100'
        }`}
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl tracking-tight sm:text-3xl tracking-tight font-bold tracking-tight text-label">
              {greeting} {user?.firstName || user?.name?.split(' ')[0] || 'Aspirant'}.
            </h2>
            {/* Subtle Streak Counter */}
            {dashboardData?.streak > 0 && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-milestones'))}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background-elevated border-[0.5px] border-border shadow-sm cursor-pointer transition-transform active:scale-95"
                title="Current Study Streak"
              >
                <Flame
                  className={`w-4 h-4 ${
                    dashboardData?.streak > 0 ? 'text-warning fill-warning/20' : 'text-label-tertiary'
                  }`}
                />
                <span className="text-xs tracking-wide tabular-nums font-bold text-label">{dashboardData?.streak}</span>
              </button>
            )}
          </div>
          <p className="text-xs tracking-wide text-label-secondary mt-1">
            {nightShiftActive
              ? '🌙 Night Shift active — warm ambient glow easing eye strain.'
              : 'Keep pushing forward. One atomic concept at a time.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {nightShiftActive && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs tracking-wide font-semibold bg-background-elevated text-label-secondary border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>Night Shift</span>
            </span>
          )}

          {/* Progressive Disclosure Timeline Feed Trigger */}
          <button
            type="button"
            onClick={() => {
              hapticFeedback.tap();
              setIsTimelineFeedOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs tracking-wide font-semibold bg-background-elevated hover:bg-black/5 dark:hover:bg-white/10 text-label border border-border cursor-pointer transition-colors shadow-sm active:scale-95"
          >
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>Timeline Feed</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SAFE MODE OVERRIDE (Planner DNA)                                          */}
      {/* ========================================================================= */}
      {isSafeModeExceeded && !isTimerMode && (
        <div className="p-4 rounded-3xl bg-orange-500/10 border-[0.5px] border-orange-500/30 text-orange-600 dark:text-orange-400 space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-orange-500" />
            <div className="space-y-1">
              <h4 className="text-xs tracking-wide font-bold uppercase tracking-wider">
                ⚠️ Safe Mode: Realistic Limit Exceeded
              </h4>
              <p className="text-xs tracking-wide opacity-90 leading-relaxed">
                {safeModeWarning ||
                  'Daily study workload exceeds realistic human limits (>12 hrs/day). Consider extending your exam date or pruning low-weight chapters.'}
              </p>
              <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                <Link
                  to="/setup"
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-orange-500 text-white hover:opacity-90 transition-opacity"
                >
                  Extend Exam Date
                </Link>
                <Link
                  to="/path"
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors"
                >
                  Prune Chapters
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RUTHLESS ROLLOVER NOTICE (Automatic Absorbing of Uncompleted Work)         */}
      {/* ========================================================================= */}
      {yesterdayMissedCount > 0 && !isTimerMode && (
        <div className="px-4 py-2.5 rounded-2xl bg-background-elevated border-[0.5px] border-border flex items-center justify-between text-xs tracking-wide text-label-secondary">
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>
              <strong>Ruthless Rollover:</strong> {yesterdayMissedCount} missed topic
              {yesterdayMissedCount > 1 ? 's' : ''} absorbed into your remaining schedule
              automatically.
            </span>
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 3: DUAL-PROGRESS VISUALS (Side-by-Side Tasks & Time Progress Bars)   */}
      {/* ========================================================================= */}
      {!isTimerMode && (
        <motion.div
          animate={isDailyQuotaComplete ? { scale: [1, 1.02, 1] } : {}}
          transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
          className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-500 ${
            isZenDimmed ? 'opacity-30 filter grayscale pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Bar 1: Tasks - Uses --color-system-blue */}
          <div className="bg-background-elevated border-[0.5px] border-border rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs tracking-wide">
              <span className="font-semibold text-label flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                <span>Task Quota</span>
              </span>
              <span className={`font-mono font-medium flex items-center gap-1 ${isBonusWork ? 'text-success' : 'text-label-secondary'}`}>
                {todayCompleted} / {todayTarget} {dashboardData.goalUnit || 'Topics'} ({displayPercentage}%)
                {isBonusWork && <span className="text-[10px] tracking-wide font-bold ml-1">Bonus Work ??</span>}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cappedVisualProgress}%` }}
                transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--color-system-blue)' }}
              />
            </div>
          </div>

          {/* Bar 2: Time - Uses --color-system-green */}
          <div className="bg-background-elevated border-[0.5px] border-border rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs tracking-wide">
              <span className="font-semibold text-label flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-success" />
                <span>Time Goal</span>
              </span>
              <span className="font-mono text-label-secondary font-medium">
                {timeStudiedHoursFormatted}h / {dailyTargetHours}h ({cappedTimeProgress}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cappedTimeProgress}%` }}
                transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--color-system-green)' }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* PART 3: TOP CENTER FOCUS HERO (Massive Circular Timer & Audio Pill)        */}
      {/* ========================================================================= */}
      <WidgetErrorBoundary title="Focus Engine">
        <AnimatePresence mode="wait">
          {isBreakMode ? (
            /* STATE 3: Rest & Recharge Break Mode (Auto-Break Suggestion) */
            <motion.div
              key="break-ring"
              layoutId="focus-ring"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
              className="relative p-6 sm:p-10 flex flex-col items-center text-center overflow-hidden mb-8"
            >
              {/* Rest Mode Status Pill */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs tracking-wide font-semibold bg-success/15 text-success border-[0.5px] border-success/30">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>Rest & Recharge ({pomodoroPreset === '25/5' ? '5m' : '10m'})</span>
                </span>
              </div>

              {/* Title & Guidance */}
              <h3 className="text-2xl tracking-tight font-semibold tracking-tight text-label mb-1">
                Take a Deep Breath
              </h3>
              <p className="text-base font-normal text-label-secondary mb-6 max-w-sm">
                Step away from the screen, hydrate, and let the concepts consolidate.
              </p>

              {/* Circular Break Ring */}
              <div className="w-60 h-60 sm:w-68 sm:h-68 relative my-2 text-success">
                <CircularProgressbar
                  value={breakProgressValue}
                  strokeWidth={8}
                  styles={buildStyles({
                    strokeLinecap: 'round',
                    pathTransition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
                    pathColor: 'var(--color-success)',
                    trailColor: 'currentColor',
                  })}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-4xl tracking-tight sm:text-5xl font-mono font-black text-label tracking-tight">
                    {formattedBreakTime}
                  </span>
                  <span className="block text-xs tracking-wide font-normal text-label-secondary mt-1">
                    {isBreakRunning ? 'Rest timer active' : 'Ready to rest'}
                  </span>
                </div>
              </div>

              {/* Rest Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full max-w-xs">
                {!isBreakRunning ? (
                  <button
                    type="button"
                    onClick={handleStartBreak}
                    className="w-full py-3.5 px-6 rounded-2xl bg-success text-white font-medium text-base shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>Start Break ({pomodoroPreset === '25/5' ? '5m' : '10m'})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsBreakRunning(false)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#FF9500] text-white font-medium text-base shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Pause className="w-5 h-5 fill-white" />
                    <span>Pause Break</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSkipBreak}
                  className="w-full py-2.5 px-4 text-xs tracking-wide font-medium text-label-secondary hover:text-label transition-colors cursor-pointer"
                >
                  Skip Break & Log Session
                </button>
              </div>
            </motion.div>
          ) : !isTimerMode ? (
            /* STATE 1: Large Circular Progress Ring */
            <motion.div
              key="ring"
              layoutId="focus-ring"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
              className="relative p-6 sm:p-10 flex flex-col items-center text-center overflow-hidden mb-8"
            >
              {/* Subtle radial aura */}
              <div
                className={`absolute -top-16 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
                  sessionFinishedFlash || isCompletedToday ? 'bg-success/20' : 'bg-accent/15'
                }`}
              />

              {/* Status Header Pill */}
              <div className="mb-4">
                {!isStudyDay ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs tracking-wide font-semibold bg-background-elevated text-label-secondary border-[0.5px] border-border">
                    <span>☀️ Scheduled Rest Day</span>
                  </span>
                ) : isCompletedToday ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs tracking-wide font-semibold bg-success/15 text-success border-[0.5px] border-success/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Daily Goal Achieved!</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs tracking-wide font-semibold bg-black/5 dark:bg-white/5 text-label-secondary border-[0.5px] border-border">
                    <Target className="w-3.5 h-3.5 text-accent" />
                    <span>Today's Target: {todayTarget} Chapters</span>
                  </span>
                )}
              </div>

              {/* Massive Circular Progress Bar */}
              <div
                className={`w-60 h-60 sm:w-68 sm:h-68 relative my-2 transition-colors duration-500 ${
                  sessionFinishedFlash || isCompletedToday ? 'text-success' : 'text-accent'
                }`}
              >
                <CircularProgressbar
                  value={cappedVisualProgress}
                  strokeWidth={8}
                  styles={buildStyles({
                    strokeLinecap: 'round',
                    pathTransition:
                      'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
                    pathColor: idleRingColor,
                    trailColor: 'currentColor',
                  })}
                />

                {/* Central Dynamic Counter */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-5xl sm:text-6xl font-black text-label tracking-tight">
                    {todayCompleted}
                    <span className="text-2xl tracking-tight text-label-secondary font-semibold">
                      {' '}
                      / {todayTarget}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accent mt-1">
                    {dashboardData.goalUnit || 'Topics'} Done
                  </span>
                  <span className={`text-xs tracking-wide font-semibold mt-0.5 ${isBonusWork ? "text-success" : "text-label-secondary"}`}>
                    {isBonusWork ? "Bonus Work 🚀" : `${displayPercentage}% of daily goal`}
                  </span>
                </div>
              </div>

              {/* Part 2: Smart Defaults - Auto-Queued #1 Topic */}
              {autoQueuedTopic && (
                <div className="mt-4 mb-2 text-center max-w-md mx-auto">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-accent block mb-0.5">
                    Auto-Queued Focus Topic
                  </span>
                  <h3 className="text-xl sm:text-2xl tracking-tight font-semibold tracking-tight text-label">
                    {autoQueuedTopic.title}
                  </h3>
                  {(autoQueuedTopic.chapterName || autoQueuedTopic.subjectName) && (
                    <p className="text-sm font-normal text-label-secondary mt-0.5">
                      {autoQueuedTopic.chapterName || autoQueuedTopic.subjectName}
                    </p>
                  )}
                </div>
              )}

              {/* One-Tap Focus Session, Settings Toggle & Ambient Audio */}
              <div className="w-full max-w-sm flex items-center justify-center gap-2.5 mt-4">
                <AppleButton
                  variant="primary"
                  size="lg"
                  onClick={handleStartTimer}
                  className="flex-1 shadow-sm bg-accent hover:opacity-90 active:scale-95 text-white"
                  icon={Play}
                >
                  <span>Start Focus Session (50m)</span>
                  <kbd className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/20 text-white/90 ml-1">
                    Space
                  </kbd>
                </AppleButton>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className={`p-3 rounded-2xl border-[0.5px] transition-all cursor-pointer shrink-0 ${
                    isStrictPomodoro
                      ? 'bg-accent/15 text-accent border-accent/30'
                      : 'bg-background-elevated text-label-secondary border-border hover:text-label'
                  }`}
                  title={
                    isStrictPomodoro ? `Strict Pomodoro (${pomodoroPreset})` : 'Timer Settings'
                  }
                >
                  <Settings className="w-5 h-5" />
                </button>
                <AmbientAudioPlayer />
              </div>
            </motion.div>
          ) : (
            /* STATE 2: Active Stopwatch / Countdown Timer */
            <motion.div
              key="timer"
              layoutId="focus-ring"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
              className="relative p-6 sm:p-10 flex flex-col items-center text-center overflow-hidden mb-8"
            >
              {/* Ambient Pulsing Glow when running */}
              {sessionFinishedFlash ? (
                <div className="absolute inset-0 rounded-3xl animate-pulse pointer-events-none bg-success/15 transition-opacity duration-500" />
              ) : isTimerRunning ? (
                <div className="absolute inset-0 rounded-3xl animate-pulse pointer-events-none bg-accent/10" />
              ) : null}

              {/* Timer Status / Auto-paused Badge */}
              <div className="mb-3">
                {isAutoPaused ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs tracking-wide font-semibold bg-background-elevated text-label-secondary border-[0.5px] border-border animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    <span>Auto-paused while away</span>
                  </span>
                ) : isTimerRunning ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs tracking-wide font-semibold bg-success/15 text-success border-[0.5px] border-success/30">
                    <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                    <span>
                      {isStrictPomodoro
                        ? `Strict Pomodoro (${pomodoroPreset})`
                        : 'Deep Work In Progress'}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs tracking-wide font-semibold bg-accent/10 text-accent border-[0.5px] border-accent/20">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    <span>Paused (Press Space to resume)</span>
                  </span>
                )}
              </div>

              {/* Active Topic Banner - 100% opacity and full color */}
              {currentUpNext && (
                <div className="max-w-xs sm:max-w-md w-full mx-auto mb-2 text-center min-w-0">
                  <span className="text-xs tracking-wide uppercase tracking-wider font-semibold text-accent block mb-0.5">
                    Focusing on
                  </span>
                  <h3 className="text-xl sm:text-2xl tracking-tight font-semibold tracking-tight text-label truncate">
                    {currentUpNext.title}
                  </h3>
                  {(currentUpNext.chapterName || currentUpNext.subjectName) && (
                    <p className="text-sm font-normal text-label-secondary mt-0.5">
                      {currentUpNext.chapterName || currentUpNext.subjectName}
                    </p>
                  )}
                </div>
              )}

              {/* Massive Circular Timer Ring */}
              <div
                className={`w-60 h-60 sm:w-68 sm:h-68 relative my-2 transition-colors duration-500 ${
                  sessionFinishedFlash || isCompletionModalOpen || isTimerRunning
                    ? 'text-success'
                    : 'text-accent'
                }`}
              >
                <CircularProgressbar
                  value={timerProgressValue}
                  strokeWidth={8}
                  styles={buildStyles({
                    strokeLinecap: 'round',
                    pathTransition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
                    pathColor: timerRingColor,
                    trailColor: 'currentColor',
                  })}
                />

                {/* Central Digital Monospace Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-4xl tracking-tight sm:text-5xl font-mono font-black text-label tracking-tight">
                    {formattedTimer}
                  </span>
                  <span className="block text-xs tracking-wide font-semibold text-label-secondary mt-1">
                    {isStrictPomodoro
                      ? `Pomodoro Focus (${sessionMinutes}m elapsed)`
                      : `${sessionMinutes} minute${sessionMinutes === 1 ? '' : 's'} recorded`}
                  </span>
                </div>
              </div>

              {/* Primary Timer Controls */}
              <div className="flex items-center gap-4 sm:gap-6 my-2">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-sm active:scale-95 hover:opacity-90 transition-all cursor-pointer ${
                      isTimerRunning ? 'bg-[#FF9500]' : 'bg-accent'
                    }`}
                    title={isTimerRunning ? 'Pause (Space)' : 'Resume (Space)'}
                  >
                    {isTimerRunning ? (
                      <Pause className="w-7 h-7 fill-white" />
                    ) : (
                      <Play className="w-7 h-7 fill-white ml-1" />
                    )}
                  </button>
                  <kbd className="text-[10px] font-mono text-label-secondary bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded border-[0.5px] border-border select-none">
                    Space
                  </kbd>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleStopTimer}
                    className="w-16 h-16 rounded-full bg-[#FF3B30] hover:opacity-90 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
                    title={`Stop and record session (${stopShortcutHint})`}
                  >
                    <Square className="w-6 h-6 fill-white" />
                  </button>
                  <kbd className="text-[10px] font-mono text-label-secondary bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded border-[0.5px] border-border select-none">
                    {stopShortcutHint}
                  </kbd>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(true)}
                    className={`w-12 h-12 rounded-2xl border-[0.5px] flex items-center justify-center transition-all cursor-pointer ${
                      isStrictPomodoro
                        ? 'bg-accent/15 text-accent border-accent/30'
                        : 'bg-black/5 dark:bg-white/5 border-border text-label-secondary hover:text-label'
                    }`}
                    title="Strict Pomodoro Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <span className="text-[10px] font-mono text-label-secondary">Mode</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-16 flex items-center">
                    <AmbientAudioPlayer />
                  </div>
                  <span className="text-[10px] font-mono text-transparent select-none">Audio</span>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleCancelTimer}
                className="mt-6 text-xs tracking-wide font-bold text-label-secondary hover:text-[#FF3B30] transition-colors cursor-pointer"
              >
                Exit without saving
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </WidgetErrorBoundary>

      {/* ========================================================================= */}
      {/* PART 3: BOTTOM HALF (Distraction-Free Queues or Strict Mode Enforced View) */}
      {/* ========================================================================= */}
      {isStrictPomodoro && isTimerMode ? (
        <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-8 text-center space-y-4 shadow-sm max-w-lg mx-auto my-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-label">Deep Work Strict Mode Active</h3>
            <p className="text-xs tracking-wide text-label-secondary max-w-sm mx-auto leading-relaxed">
              Peripheral queues and trophy cases are hidden to eliminate multitasking. Focus 100% of
              your cognitive energy on your active concept.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleToggleStrict(false)}
              className="px-4 py-2 rounded-xl text-xs tracking-wide font-semibold text-label-secondary hover:text-label bg-black/5 dark:bg-white/5 border-[0.5px] border-border transition-colors cursor-pointer"
            >
              Exit Strict Mode
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`space-y-12 transition-all duration-500 ${
            isZenDimmed ? 'opacity-30 filter grayscale' : 'opacity-100'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* QUEUE 1: UP NEXT QUEUE */}
            <WidgetErrorBoundary title="Up Next Queue">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <h3 className="text-2xl tracking-tight font-semibold tracking-tight text-label">Up Next</h3>
                    <span className="text-sm font-normal text-label-secondary">
                      Upcoming atomic concepts
                    </span>
                  </div>
                  <Link
                    to="/path"
                    className="text-xs tracking-wide font-medium text-accent hover:underline flex items-center gap-1"
                  >
                    <span>Full Path</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {visibleUpNextQueue.length === 0 ? (
                  <div className="py-8 text-center space-y-1.5">
                    <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                    <p className="text-sm font-medium text-label">No upcoming tasks in queue.</p>
                    <p className="text-xs tracking-wide font-normal text-label-secondary">
                      All current scheduled topics completed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* PART 2: THE VANISHING ANIMATION WITH FRAMER MOTION */}
                    <AnimatePresence mode="popLayout">
                      {visibleUpNextQueue.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          layout
                          layoutId={`task-${item.id}`}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                          className="overflow-hidden"
                        >
                          <SwipeableQueueItem
                            item={item}
                            isReview={false}
                            badge={`#${idx + 1}`}
                            onComplete={(it) => handleCompleteOrReview(it, false)}
                            onSnooze={(it) => handleSnooze(it, false)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </WidgetErrorBoundary>

            {/* QUEUE 2: SPACED REPETITION (SRS) REVIEW QUEUE */}
            <WidgetErrorBoundary title="SRS Review Queue">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <h3 className="text-2xl tracking-tight font-semibold tracking-tight text-label">
                      Due for Review
                    </h3>
                    <span className="text-sm font-normal text-label-secondary">
                      Spaced repetition intervals ({visibleReviewQueue.length})
                    </span>
                  </div>
                </div>

                {visibleReviewQueue.length === 0 ? (
                  <div className="py-8 text-center space-y-1.5">
                    <CheckCircle2 className="w-5 h-5 text-accent mx-auto" />
                    <p className="text-sm font-medium text-label">No reviews due today.</p>
                    <p className="text-xs tracking-wide font-normal text-label-secondary">
                      Memory retention schedule is on track.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* PART 2: THE VANISHING ANIMATION WITH FRAMER MOTION */}
                    <AnimatePresence mode="popLayout">
                      {visibleReviewQueue.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          layoutId={`task-${item.id}`}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                          className="overflow-hidden"
                        >
                          <SwipeableQueueItem
                            item={item}
                            isReview={true}
                            onComplete={(it) => handleCompleteOrReview(it, true)}
                            onSnooze={(it) => handleSnooze(it, true)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </WidgetErrorBoundary>
          </div>

          {/* ONE-TAP QUICK TIMERS (TrackIt DNA) */}
          <WidgetErrorBoundary title="Quick Timer">
            <QuickTimerSection
              subjects={
                dashboardData.selectedSubjects?.length
                  ? dashboardData.selectedSubjects
                  : dashboardData.subjects
              }
              onStartQuickTimer={handleStartQuickTimer}
              isTimerRunning={isTimerRunning}
            />
          </WidgetErrorBoundary>

          {/* PART 1: THE "COMPLETED TODAY" DROP-ZONE (Trophy Case) */}
          <WidgetErrorBoundary title="Completed Today Trophy Case">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-2xl tracking-tight font-semibold tracking-tight text-label">
                    Completed Today
                  </h3>
                  <span className="text-sm font-normal text-label-secondary">
                    {completedTodayList.length} concept{completedTodayList.length === 1 ? '' : 's'}{' '}
                    conquered
                  </span>
                </div>
                <span className="text-xs tracking-wide font-normal text-label-secondary hidden sm:inline-block">
                  Swipe left to undo · Hover to edit minutes
                </span>
              </div>

              {completedTodayList.length === 0 ? (
                <div className="py-6 text-center space-y-1.5">
                  <p className="text-sm font-medium text-label-secondary">
                    No topics completed yet today.
                  </p>
                  <p className="text-xs tracking-wide font-normal text-label-tertiary">
                    Knock out concepts from Up Next to build your daily momentum.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {completedTodayList.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        layoutId={`task-${item.id}`}
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1, height: 'auto' }}
                        exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                        className="overflow-hidden"
                      >
                        <SwipeableCompletedItem
                          item={item}
                          onUndo={handleUndoComplete}
                          onUpdateMinutes={handleUpdateMinutes}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </WidgetErrorBoundary>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 3: MOBILE TIMER FAB (Docked slightly above Bottom Nav in Thumb Zone) */}
      {/* ========================================================================= */}
      {isMobile && !isTimerMode && (
        <div className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
          <button
            type="button"
            onClick={handleStartTimer}
            className="w-[90%] max-w-[360px] h-14 rounded-full shadow-sm bg-accent hover:opacity-90 active:scale-95 text-white font-medium text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer pointer-events-auto"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
            <span>Start Focus</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 4: END-OF-SESSION DOPAMINE CARD (Apple HIG Responsive Modal/Drawer)   */}
      {/* ========================================================================= */}
      {isMobile ? (
        <Drawer.Root
          open={isCompletionModalOpen}
          onOpenChange={(open) => !open && handleDismissDopamineCard()}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out" />
            <Drawer.Content
              aria-describedby="dopamine-desc"
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[28px] bg-background-elevated/95 backdrop-blur-2xl border-t-[0.5px] border-border outline-none p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-5 text-center relative overflow-hidden"
            >
              {/* Grab handle indicator */}
              <div className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-black/20 dark:bg-white/20 shrink-0" />
              {/* Subtle top ambient glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-success/15 rounded-full blur-3xl pointer-events-none" />

              {/* Hero Icon */}
              <div className="w-16 h-16 rounded-3xl bg-accent/15 border-[0.5px] border-accent/25 text-accent flex items-center justify-center mx-auto text-3xl tracking-tight">
                🔥
              </div>

              <div className="space-y-1.5">
                <Drawer.Title className="text-2xl tracking-tight font-black text-label-primary tracking-tight">
                  Session Complete!
                </Drawer.Title>
                <p id="dopamine-desc" className="text-xs tracking-wide text-label-secondary max-w-xs mx-auto">
                  Outstanding deep work. Your daily consistency is compounding towards your goal.
                </p>
              </div>

              {/* 3 Metric Glassmorphic Tiles */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {/* Metric 1: Time Focused */}
                <div className="bg-background-elevated/70 border-[0.5px] border-border rounded-2xl p-3 flex flex-col items-center">
                  <Clock className="w-4 h-4 text-accent mb-1" />
                  <span className="text-lg sm:text-xl font-black tabular-nums text-label font-mono">
                    {sessionMinutes}m
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-label-secondary mt-0.5">
                    Time Focused
                  </span>
                </div>

                {/* Metric 2: Tasks Conquered */}
                <div className="bg-background-elevated/70 border-[0.5px] border-border rounded-2xl p-3 flex flex-col items-center">
                  <CheckCircle className="w-4 h-4 text-success mb-1" />
                  <span className="text-lg sm:text-xl font-black tabular-nums text-label font-mono">
                    <AnimatedOdometer value={sessionTasksConquered > 0 ? sessionTasksConquered : todayCompleted} />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-label-secondary mt-0.5">
                    Tasks Conquered
                  </span>
                </div>

                {/* Metric 3: Streak Maintained 🔥 */}
                <div className="bg-background-elevated/70 border-[0.5px] border-border rounded-2xl p-3 flex flex-col items-center">
                  <Flame className="w-4 h-4 text-accent mb-1" />
                  <span className="text-lg sm:text-xl font-black tabular-nums text-label font-mono">
                    {Math.max(1, dashboardData?.streak || 1)}d
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-label-secondary mt-0.5">
                    Streak 🔥
                  </span>
                </div>
              </div>

              {/* Single Apple HIG "Done" Button */}
              <div className="pt-2">
                <AppleButton
                  variant="primary"
                  size="lg"
                  className="w-full min-h-[44px]"
                  disabled={isSubmittingSession}
                  onClick={handleDismissDopamineCard}
                >
                  {isSubmittingSession ? 'Saving Session...' : 'Done'}
                </AppleButton>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        isCompletionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
              className="w-full max-w-sm sm:max-w-md bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-center relative overflow-hidden"
            >
              {/* Subtle top ambient glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

              {/* Hero Icon */}
              <div className="w-16 h-16 rounded-3xl bg-accent/15 border-[0.5px] border-accent/25 text-accent flex items-center justify-center mx-auto text-3xl tracking-tight">
                🔥
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl tracking-tight font-black text-label tracking-tight">Session Complete!</h3>
                <p className="text-xs tracking-wide text-label-secondary max-w-xs mx-auto">
                  Outstanding deep work. Your daily consistency is compounding towards your goal.
                </p>
              </div>

              {/* 3 Metric Glassmorphic Tiles */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {/* Metric 1: Time Focused */}
                <div className="bg-background-elevated/70 border-[0.5px] border-border rounded-2xl p-3 flex flex-col items-center">
                  <Clock className="w-4 h-4 text-accent mb-1" />
                  <span className="text-lg sm:text-xl font-black tabular-nums text-label font-mono">
                    {sessionMinutes}m
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-label-secondary mt-0.5">
                    Time Focused
                  </span>
                </div>

                {/* Metric 2: Tasks Conquered */}
                <div className="bg-background-elevated/70 border-[0.5px] border-border rounded-2xl p-3 flex flex-col items-center">
                  <CheckCircle className="w-4 h-4 text-success mb-1" />
                  <span className="text-lg sm:text-xl font-black tabular-nums text-label font-mono">
                    <AnimatedOdometer value={sessionTasksConquered > 0 ? sessionTasksConquered : todayCompleted} />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-label-secondary mt-0.5">
                    Tasks Conquered
                  </span>
                </div>

                {/* Metric 3: Streak Maintained 🔥 */}
                <div className="bg-background-elevated/70 border-[0.5px] border-border rounded-2xl p-3 flex flex-col items-center">
                  <Flame className="w-4 h-4 text-accent mb-1" />
                  <span className="text-lg sm:text-xl font-black tabular-nums text-label font-mono">
                    {Math.max(1, dashboardData?.streak || 1)}d
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-label-secondary mt-0.5">
                    Streak 🔥
                  </span>
                </div>
              </div>

              {/* Single Apple HIG "Done" Button */}
              <div className="pt-2">
                <AppleButton
                  variant="primary"
                  size="lg"
                  className="w-full min-h-[44px]"
                  disabled={isSubmittingSession}
                  onClick={handleDismissDopamineCard}
                >
                  {isSubmittingSession ? 'Saving Session...' : 'Done'}
                </AppleButton>
              </div>
            </motion.div>
          </div>
        )
      )}

      {/* Strict Pomodoro Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-background-elevated border-[0.5px] border-border shadow-sm p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-label">Focus Timer Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-xl text-label-secondary hover:text-label cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleToggleStrict(false);
                  setShowSettingsModal(false);
                }}
                className={`w-full py-3 px-4 rounded-2xl text-left font-medium text-xs tracking-wide flex items-center justify-between transition-colors border-[0.5px] ${
                  !isStrictPomodoro
                    ? 'bg-accent text-white border-accent font-bold shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 border-border text-label hover:bg-black/10'
                }`}
              >
                <div>
                  <span className="block font-bold">Standard Stopwatch</span>
                  <span
                    className={`text-[10px] ${!isStrictPomodoro ? 'text-white/80' : 'text-label-secondary'}`}
                  >
                    Count up freely with no time pressure
                  </span>
                </div>
                {!isStrictPomodoro && <Check className="w-4 h-4 stroke-[2.5]" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleToggleStrict(true, pomodoroPreset);
                  setShowSettingsModal(false);
                }}
                className={`w-full py-3 px-4 rounded-2xl text-left font-medium text-xs tracking-wide flex items-center justify-between transition-colors border-[0.5px] ${
                  isStrictPomodoro
                    ? 'bg-accent text-white border-accent font-bold shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 border-border text-label hover:bg-black/10'
                }`}
              >
                <div>
                  <span className="block font-bold">Strict Pomodoro</span>
                  <span
                    className={`text-[10px] ${isStrictPomodoro ? 'text-white/80' : 'text-label-secondary'}`}
                  >
                    Hides all peripheral queues to enforce single-tasking
                  </span>
                </div>
                {isStrictPomodoro && <Check className="w-4 h-4 stroke-[2.5]" />}
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-[10px] uppercase font-bold tracking-wider text-label-secondary block">
                Preset Pomodoro Interval
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStrict(true, '50/10')}
                  className={`py-2 px-3 rounded-xl text-center font-bold text-xs tracking-wide border-[0.5px] transition-colors ${
                    pomodoroPreset === '50/10'
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-black/5 dark:bg-white/5 text-label-secondary'
                  }`}
                >
                  50m Focus / 10m Break
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStrict(true, '25/5')}
                  className={`py-2 px-3 rounded-xl text-center font-bold text-xs tracking-wide border-[0.5px] transition-colors ${
                    pomodoroPreset === '25/5'
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-black/5 dark:bg-white/5 text-label-secondary'
                  }`}
                >
                  25m Focus / 5m Break
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swipeable vaul Bottom Sheet: Timeline Feed */}
      <TimelineFeedSheet
        isOpen={isTimelineFeedOpen}
        onClose={() => setIsTimelineFeedOpen(false)}
        sessions={dashboardData?.todaySessions}
        timeline={timelineData}
      />
      {!supportsTriggers && (
        <div className="mt-4 text-center pb-4">
          <span className="text-[10px] text-label-tertiary">
            Note: Keep this app open in the background to receive scheduled alerts.
          </span>
        </div>
      )}
    </div>
  );
}














