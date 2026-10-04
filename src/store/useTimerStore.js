import { create } from 'zustand';
import { hapticFeedback } from '../utils/haptics';

/**
 * Zustand Store for Global Floating Timer & Granular Subtopic Tracking
 * Supports Deep Work Strict Mode, Smart Defaults & Auto-Break Suggestions
 */
export const useTimerStore = create((set, get) => ({
  isActive: false,
  seconds: 0,
  activeTopic: null, // { id: string, title: string, subjectName?: string, chapterName?: string }
  isBreak: false,
  breakSeconds: 0,
  isFullScreen: false,
  isStrictPomodoro:
    typeof window !== 'undefined' ? localStorage.getItem('strictPomodoro') === 'true' : false,
  pomodoroPreset:
    typeof window !== 'undefined' ? localStorage.getItem('pomodoroPreset') || '50/10' : '50/10',

  setStrictPomodoro: (isStrict, preset = '50/10') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('strictPomodoro', String(isStrict));
      localStorage.setItem('pomodoroPreset', preset);
    }
    set({ isStrictPomodoro: isStrict, pomodoroPreset: preset });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('strict-pomodoro-changed', {
          detail: { isStrict, preset },
        })
      );
    }
  },

  setIsFullScreen: (val) => {
    set({ isFullScreen: val });
  },

  startTimer: (topic) => {
    if (!topic) {
      hapticFeedback.error();
      return;
    }
    const current = get().activeTopic;
    // If switching to a different topic, start fresh
    if (!current || String(current.id) !== String(topic.id)) {
      set({
        activeTopic: topic,
        seconds: 0,
        isBreak: false,
        isActive: true,
      });
    } else {
      // Resume current active topic
      set({ isActive: true, isBreak: false });
    }
  },

  startBreak: (durationSeconds = 600) => {
    hapticFeedback.medium();
    set({
      isBreak: true,
      breakSeconds: durationSeconds,
      isActive: true,
    });
  },

  endBreak: () => {
    hapticFeedback.success();
    set({
      isBreak: false,
      breakSeconds: 0,
      isActive: false,
    });
  },

  tick: () => {
    const { isActive, isBreak, seconds, breakSeconds } = get();
    if (!isActive) return;

    if (isBreak) {
      if (breakSeconds > 1) {
        set({ breakSeconds: breakSeconds - 1 });
      } else {
        hapticFeedback.success();
        set({ isBreak: false, breakSeconds: 0, isActive: false });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pomodoro-break-finished'));
        }
      }
    } else {
      set({ seconds: seconds + 1 });
    }
  },

  pauseTimer: () => {
    set({ isActive: false });
  },

  resumeTimer: () => {
    if (get().activeTopic || get().isBreak) {
      set({ isActive: true });
    } else {
      hapticFeedback.error();
    }
  },

  stopTimer: () => {
    set({ isActive: false });
  },

  resetTimer: () => {
    set({
      isActive: false,
      seconds: 0,
      isBreak: false,
      breakSeconds: 0,
      activeTopic: null,
    });
  },
}));
