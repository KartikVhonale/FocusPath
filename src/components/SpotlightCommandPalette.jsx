import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  Clock,
  Compass,
  CheckCircle2,
  Calendar,
  Layers,
  Users,
  Moon,
  Sun,
  Flame,
  BookOpen,
  ArrowRight,
  Palmtree,
  Plus,
  Check,
  ChevronLeft,
  Download,
  Target,
  CheckSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTimerStore } from '../store/useTimerStore';
import { exportStudyDataToCsv } from '../utils/exportCsv';
import { hapticFeedback } from '../utils/haptics';
import { useTheme } from '../hooks/useTheme';

export default function SpotlightCommandPalette({ isOpen, onClose, onStartTimer, onOpenQuickLog }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dashboardData, activeExam, quickIncrement, fetchDashboard } = useApp();
  const { isTeacher, user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState('root'); // 'root' | 'schedule'
  const { isDark: isDarkMode, toggleTheme } = useTheme();

  // Reset page to root when closing
  useEffect(() => {
    if (!isOpen) {
      setPage('root');
      setSearch('');
    }
  }, [isOpen]);

  // Scroll-lock body while spotlight palette is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K & Escape & Backspace
  useEffect(() => {
    const down = (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          hapticFeedback.light();
          window.dispatchEvent(new CustomEvent('open-spotlight'));
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        if (page !== 'root') {
          setPage('root');
        } else {
          onClose();
        }
      }
      if (e.key === 'Backspace' && search === '' && page !== 'root' && isOpen) {
        e.preventDefault();
        setPage('root');
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose, page, search]);

  // Extract all searchable topics/chapters from activeExam
  const allChapters = useMemo(() => {
    if (!activeExam?.subjects) return [];
    const list = [];
    const completedSet = new Set(dashboardData?.completedChapterIds || []);

    activeExam.subjects.forEach((subject) => {
      (subject.chapters || []).forEach((chap) => {
        list.push({
          id: chap._id || chap.id || `${subject.name}-${chap.title}`,
          title: chap.title,
          subjectName: subject.name,
          estimatedHours: chap.estimatedHours || 1,
          isCompleted: completedSet.has(chap._id || chap.id),
        });
      });
    });
    return list;
  }, [activeExam, dashboardData?.completedChapterIds]);

  const handleSelectTopic = (chap) => {
    hapticFeedback.medium();
    onClose();
    useTimerStore.getState().startTimer(chap);
    toast.success(`Started timer for "${chap.title}"`, { id: 'spotlight-nav' });
    navigate('/');
  };

  const handleAction = (actionKey) => {
    hapticFeedback.tap();
    onClose();

    switch (actionKey) {
      case 'start_focus':
        navigate('/');
        if (onStartTimer) {
          setTimeout(() => onStartTimer(), 100);
        } else {
          window.dispatchEvent(new CustomEvent('start-focus-timer'));
        }
        toast.success('⏱️ Focus session initiated!', { id: 'spotlight-action' });
        break;

      case 'toggle_strict_pomodoro': {
        const current = localStorage.getItem('strictPomodoro') === 'true';
        const nextVal = !current;
        localStorage.setItem('strictPomodoro', String(nextVal));
        window.dispatchEvent(
          new CustomEvent('strict-pomodoro-changed', { detail: { enabled: nextVal } })
        );
        toast.success(nextVal ? 'Strict Pomodoro Mode enabled' : 'Stopwatch Mode restored', {
          id: 'spotlight-pomodoro',
        });
        break;
      }

      case 'mark_next_complete':
        quickIncrement(1);
        toast.success('Marked chapter complete (+1)', { id: 'spotlight-complete' });
        break;

      case 'export_data':
        exportStudyDataToCsv(dashboardData?.dailyLogs, activeExam?.name);
        toast.success('Study data exported as CSV', { id: 'spotlight-export' });
        break;

      case 'go_focus':
        navigate('/');
        break;

      case 'go_path':
        navigate('/path');
        break;

      case 'quick_log':
        if (onOpenQuickLog) {
          onOpenQuickLog();
        } else {
          quickIncrement(1);
        }
        break;

      case 'toggle_theme':
        toggleTheme();
        break;

      case 'setup':
        navigate('/setup');
        break;

      case 'roster':
        navigate('/teacher');
        break;

      case 'master_plan':
        navigate('/master-plan');
        break;

      case 'vacation_mode':
        toast('🏖️ Vacation mode: rest days updated in your plan schedule.', {
          icon: '🌴',
          id: 'spotlight-vacation',
        });
        navigate('/setup');
        break;

      case 'classmates_hub':
        window.dispatchEvent(new CustomEvent('open-classmates'));
        break;

      default:
        break;
    }
  };

  const handleScheduleAction = async (actionType) => {
    hapticFeedback.medium();
    try {
      if (actionType === 'pause_toggle') {
        const res = await api.togglePlanPause();
        toast.success(res.message || 'Plan status updated');
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
        fetchDashboard();
        onClose();
      } else if (actionType === 'recalculate') {
        const res = await api.recalculatePlan();
        toast.success(res.message || 'Adaptive schedule recalculated!');
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
        fetchDashboard();
        onClose();
      } else if (actionType === 'auto_pilot') {
        toast.loading('Running Auto-Pilot Redistribution...', { id: 'autopilot-toast' });
        const res = await api.autoSchedule({ daysOff: ['Sun'] });
        toast.success(res.message || 'Auto-Pilot redistributed 100% of subtopics!', {
          id: 'autopilot-toast',
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
        fetchDashboard();
        onClose();
      }
    } catch (err) {
      console.error('Schedule action error:', err);
      toast.error(err.response?.data?.message || 'Failed to execute schedule action');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Glassmorphic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
          />

          {/* Spotlight Palette Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            className="relative z-10 w-full max-w-2xl bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[75vh]"
          >
            <Command className="w-full flex flex-col overflow-hidden text-label" loop>
              {/* Search Bar Input */}
              <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
                <Search className="w-5 h-5 text-accent shrink-0" />
                {page === 'schedule' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPage('root');
                      setSearch('');
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent/10 text-accent text-xs tracking-wide font-medium hover:bg-accent/20 shrink-0 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Schedule</span>
                  </button>
                )}
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  autoFocus
                  placeholder={
                    page === 'schedule'
                      ? 'Filter schedule commands (e.g. Pause, Recalculate, Redistribute)...'
                      : 'Type a command or search syllabus (e.g. > Start Timer, > Export, Physics)...'
                  }
                  className="w-full bg-transparent text-sm sm:text-base font-medium outline-none placeholder:text-label-secondary text-label"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="p-1 rounded-full text-label-secondary hover:text-label text-xs tracking-wide"
                  >
                    Clear
                  </button>
                )}
                <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-background border-[0.5px] border-border text-[10px] font-mono font-medium text-label-secondary">
                  ESC
                </kbd>
              </div>

              {/* Scrollable Results List */}
              <Command.List className="overflow-y-auto p-2 space-y-1.5 max-h-[58vh]">
                <Command.Empty className="py-12 text-center text-xs tracking-wide text-label-secondary font-medium">
                  <div className="w-10 h-10 rounded-xl bg-background border-[0.5px] border-border flex items-center justify-center mx-auto mb-2 text-label-secondary">
                    <Search className="w-5 h-5" />
                  </div>
                  No matching chapters or commands found for "{search}".
                </Command.Empty>

                {/* RESULTS */}
                {page === 'schedule' ? (
                  <Command.Group
                    heading={
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-label-secondary px-2 py-1 block">
                        🗓️ Auto-Pilot & Schedule Actions
                      </span>
                    }
                  >
                    <Command.Item
                      value=".. Back to Main Menu"
                      onSelect={() => {
                        hapticFeedback.tap();
                        setPage('root');
                        setSearch('');
                      }}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-background border-[0.5px] border-border text-label-secondary flex items-center justify-center shrink-0">
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span>← Back to Commands</span>
                          <span className="block text-[10px] text-label-secondary font-normal">
                            Return to root command palette
                          </span>
                        </div>
                      </div>
                      <kbd className="text-[10px] font-mono text-label-secondary bg-background border-[0.5px] border-border px-1.5 py-0.5 rounded">
                        Esc
                      </kbd>
                    </Command.Item>

                    <Command.Item
                      value="> Pause Resume Study Plan freeze unfreeze daily target schedule"
                      onSelect={() => handleScheduleAction('pause_toggle')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                          {dashboardData?.status === 'paused' ? (
                            <Play className="w-3.5 h-3.5" />
                          ) : (
                            <Pause className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <span>
                            {dashboardData?.status === 'paused' ? '> Resume Plan' : '> Pause Plan'}
                          </span>
                          <span className="block text-[10px] text-label-secondary font-normal">
                            {dashboardData?.status === 'paused'
                              ? 'Resume daily targets and reactivate active study streak'
                              : 'Temporarily freeze daily target calculation without losing streak'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-label-secondary bg-background border-[0.5px] border-border px-1.5 py-0.5 rounded">
                        {dashboardData?.status === 'paused' ? 'Paused' : 'Active'}
                      </span>
                    </Command.Item>

                    <Command.Item
                      value="> Recalculate adaptive target pace schedule"
                      onSelect={() => handleScheduleAction('recalculate')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span>&gt; Recalculate</span>
                          <span className="block text-[10px] text-label-secondary font-normal">
                            Recompute daily math pace: ⌈remaining atomic subtopics ÷ remaining valid
                            days⌉
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-label-secondary" />
                    </Command.Item>

                    <Command.Item
                      value="> Auto-Pilot Redistribute linear subtopics calendar schedule"
                      onSelect={() => handleScheduleAction('auto_pilot')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span>&gt; Auto-Pilot Redistribute</span>
                          <span className="block text-[10px] text-label-secondary font-normal">
                            Evenly map remaining 4-level leaf subtopics across all upcoming calendar
                            days
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-label-secondary" />
                    </Command.Item>
                  </Command.Group>
                ) : (
                  <>
                    {/* ACTION COMMANDS GROUP */}
                    <Command.Group
                      heading={
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-label-secondary px-2 py-1 block">
                          ⚡ Action Commands
                        </span>
                      }
                    >
                      <Command.Item
                        value="> Start Focus Session deep work timer stopwatch"
                        onSelect={() => handleAction('start_focus')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                          <div>
                            <span className="text-label font-medium">&gt; Start Focus Session</span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              Transform progress ring into active stopwatch
                            </span>
                          </div>
                        </div>
                        <kbd className="text-[10px] font-mono text-label-secondary bg-background border-[0.5px] border-border px-1.5 py-0.5 rounded">
                          Enter
                        </kbd>
                      </Command.Item>

                      <Command.Item
                        value="> Strict Pomodoro Mode single tasking deep work focus interval"
                        onSelect={() => handleAction('toggle_strict_pomodoro')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            <Target className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-label font-medium">
                              &gt; Strict Pomodoro Mode
                            </span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              Toggle 50/10 or 25/5 single-tasking deep work distraction shielding
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-label-secondary bg-background border-[0.5px] border-border px-1.5 py-0.5 rounded">
                          {localStorage.getItem('strictPomodoro') === 'true' ? 'Active' : 'Off'}
                        </span>
                      </Command.Item>

                      <Command.Item
                        value="> Export Study Data CSV analytics logs download portability"
                        onSelect={() => handleAction('export_data')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            <Download className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-label font-medium">
                              &gt; Export Study Data (CSV)
                            </span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              Download client-side CSV of all historical study sessions
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-label-secondary" />
                      </Command.Item>

                      <Command.Item
                        value="> Mark Chapter Complete increment progress +1"
                        onSelect={() => handleAction('mark_next_complete')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                            <CheckSquare className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-label font-medium">
                              &gt; Mark Chapter Complete
                            </span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              Increment daily completed subtopics counter by +1
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-label-secondary bg-background border-[0.5px] border-border px-1.5 py-0.5 rounded">
                          +1
                        </span>
                      </Command.Item>

                      <Command.Item
                        value="> Toggle Dark Light Appearance Theme Mode"
                        onSelect={() => handleAction('toggle_theme')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-background border-[0.5px] border-border text-label-secondary flex items-center justify-center shrink-0">
                            {isDarkMode ? (
                              <Sun className="w-3.5 h-3.5" />
                            ) : (
                              <Moon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="text-label font-medium">&gt; Toggle Dark Mode</span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              Switch between light and dark monochrome appearance
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-label-secondary">
                          {isDarkMode ? 'Dark' : 'Light'}
                        </span>
                      </Command.Item>

                      <Command.Item
                        value="> Schedule Auto-Pilot Recalculate Pause Redistribute sub-menu"
                        onSelect={() => {
                          hapticFeedback.tap();
                          setPage('schedule');
                          setSearch('');
                        }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-label font-medium">&gt; Schedule</span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              Pause plan, recalculate, or auto-pilot redistribute
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-label-secondary" />
                      </Command.Item>

                      <Command.Item
                        value="> Path Syllabus Analytics Progress"
                        onSelect={() => handleAction('go_path')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            <Compass className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-label font-medium">&gt; Open Path Tab</span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              View full syllabus tree, radar charts & consistency metrics
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-label-secondary" />
                      </Command.Item>

                      <Command.Item
                        value="> Focus Dashboard Daily Ring"
                        onSelect={() => handleAction('go_focus')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-label font-medium">&gt; Open Focus Tab</span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              Return to primary focus ring & up-next queue
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-label-secondary" />
                      </Command.Item>

                      <Command.Item
                        value="> Quick Log completed chapter progress"
                        onSelect={() => handleAction('quick_log')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-label font-medium">
                              &gt; Quick Log Progress (+1 Chapter)
                            </span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              Instantly increment daily progress counter
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-label-secondary bg-background border-[0.5px] border-border px-1.5 py-0.5 rounded">
                          +1
                        </span>
                      </Command.Item>

                      <Command.Item
                        value="> Vacation Mode Toggle Rest Day break"
                        onSelect={() => handleAction('vacation_mode')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            <Palmtree className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-label font-medium">
                              &gt; Vacation Mode / Rest Days
                            </span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              Configure rest days to protect your daily study streak
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-label-secondary" />
                      </Command.Item>

                      <Command.Item
                        value="> Classmates Radar Hub peer presence focus status"
                        onSelect={() => handleAction('classmates_hub')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-label font-medium">&gt; Classmates Radar</span>
                            <span className="block text-[10px] text-label-secondary font-normal">
                              Live peer focus presence and accountability
                            </span>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      </Command.Item>

                      {isTeacher && (
                        <>
                          <Command.Item
                            value="> Teacher Roster Student Cohort"
                            onSelect={() => handleAction('roster')}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                <Users className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="text-label font-medium">
                                  &gt; Instructor Roster
                                </span>
                                <span className="block text-[10px] text-label-secondary font-normal">
                                  View managed students, streaks, and velocity metrics
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-label-secondary" />
                          </Command.Item>

                          <Command.Item
                            value="> Master Plan Assign Cohort Syllabus"
                            onSelect={() => handleAction('master_plan')}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                <Layers className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="text-label font-medium">
                                  &gt; Master Plan Distributor
                                </span>
                                <span className="block text-[10px] text-label-secondary font-normal">
                                  Push standardized curriculum to linked student cohort
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-label-secondary" />
                          </Command.Item>
                        </>
                      )}
                    </Command.Group>

                    {/* SYLLABUS TOPICS SEARCH GROUP */}
                    {allChapters.length > 0 && (
                      <Command.Group
                        heading={
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-label-secondary px-2 py-1 block">
                            📚 Syllabus Topics ({allChapters.length})
                          </span>
                        }
                      >
                        {allChapters.map((chap) => (
                          <Command.Item
                            key={chap.id}
                            value={`> Start Timer for ${chap.title} ${chap.subjectName}`}
                            onSelect={() => handleSelectTopic(chap)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs tracking-wide font-medium transition-colors aria-selected:bg-accent/10 aria-selected:text-accent data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  chap.isCompleted
                                    ? 'bg-success text-white'
                                    : 'bg-background border-[0.5px] border-border text-label-secondary'
                                }`}
                              >
                                {chap.isCompleted ? (
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                ) : (
                                  <BookOpen className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span
                                  className={`block truncate text-xs tracking-wide font-medium ${
                                    chap.isCompleted
                                      ? 'line-through opacity-60 text-label-secondary'
                                      : 'text-label'
                                  }`}
                                >
                                  &gt; Start Timer for {chap.title}
                                </span>
                                <span className="text-[10px] text-label-secondary block truncate">
                                  {chap.subjectName} • ~{chap.estimatedHours}h focus
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {chap.isCompleted && (
                                <span className="text-[9px] bg-success/15 text-success font-medium px-2 py-0.5 rounded-full">
                                  Completed
                                </span>
                              )}
                              <ArrowRight className="w-3.5 h-3.5 text-label-secondary opacity-60" />
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}
              </Command.List>

              {/* Footer Bar */}
              <div className="px-4 py-2.5 bg-background-elevated border-t border-border flex items-center justify-between text-[11px] text-label-secondary">
                <div className="flex items-center gap-3">
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-background border-[0.5px] border-border font-mono text-[9px] mr-1 text-label-secondary">
                      ↑↓
                    </kbd>
                    Navigate
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-background border-[0.5px] border-border font-mono text-[9px] mr-1 text-label-secondary">
                      ↵
                    </kbd>
                    Select
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-accent" />
                  <span className="font-medium text-label">Spotlight Search</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}



