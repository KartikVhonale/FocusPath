import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Trophy,
  Clock,
  Target,
  Coffee,
} from 'lucide-react';
import api from '../services/api';
import Tooltip from './Tooltip';
import { hapticFeedback } from '../utils/haptics';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAME_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_STUDY_DAYS = Object.freeze(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

export default function StreakCalendar({ currentPlan, onSelectDate }) {
  const today = useMemo(() => new Date(), []);
  const todayDateString = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [calendarData, setCalendarData] = useState(null);
  const [_loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'heatmap'
  const [selectedDateStr, setSelectedDateStr] = useState(todayDateString);

  // Fetch calendar & streak logs
  const fetchCalendar = async (year, month) => {
    try {
      setLoading(true);
      const res = await api.get(`/study-logs/calendar?year=${year}&month=${month}`);
      if (res.data?.success) {
        setCalendarData(res.data);
      }
    } catch (err) {
      console.error('Failed to load streak calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    hapticFeedback.tap();
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    hapticFeedback.tap();
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Jump to today
  const handleJumpToToday = () => {
    hapticFeedback.medium();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDateStr(todayDateString);
  };

  const scheduledStudyDays = useMemo(() => {
    return calendarData?.studyDays || currentPlan?.studyDays || DEFAULT_STUDY_DAYS;
  }, [calendarData?.studyDays, currentPlan?.studyDays]);

  // Map logs by date string for O(1) lookup
  const logsMap = useMemo(() => {
    const map = new Map();
    if (calendarData?.logs) {
      calendarData.logs.forEach((log) => {
        map.set(log.date, log);
      });
    }
    return map;
  }, [calendarData?.logs]);

  // Generate calendar days for current month (Monday start)
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sun, 1 is Mon...
    // Convert to Monday = 0, ..., Sunday = 6
    const startOffset = (firstDayIndex + 6) % 7;

    const cells = [];

    // Prefix empty/prev month padding
    for (let i = 0; i < startOffset; i++) {
      cells.push({ isPadding: true, key: `pad-${i}` });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const monthPadded = String(currentMonth).padStart(2, '0');
      const dayPadded = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthPadded}-${dayPadded}`;

      const cellDate = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeekName = DAY_NAME_MAP[cellDate.getDay()];
      const isScheduledStudyDay = scheduledStudyDays.includes(dayOfWeekName);

      const isToday = dateStr === todayDateString;
      const isFuture = dateStr > todayDateString;

      const log = logsMap.get(dateStr);
      const chapters = log?.topicsCompleted || 0;
      const minutes = log?.timeStudiedMinutes || 0;
      const target = log?.targetForDay || 0;

      const hadActivity = chapters > 0 || minutes >= 10;
      const targetMet = (target > 0 && chapters >= target) || (target === 0 && chapters > 0);
      const isRestDay = !isScheduledStudyDay && !hadActivity;

      cells.push({
        isPadding: false,
        key: dateStr,
        day,
        dateStr,
        dayOfWeekName,
        isToday,
        isFuture,
        isScheduledStudyDay,
        isRestDay,
        hadActivity,
        targetMet,
        chapters,
        minutes,
        target,
        log,
      });
    }

    return cells;
  }, [currentYear, currentMonth, logsMap, scheduledStudyDays, todayDateString]);

  // Selected Day Details
  const selectedDayInfo = useMemo(() => {
    if (!selectedDateStr) return null;
    const log = logsMap.get(selectedDateStr);
    const d = new Date(selectedDateStr + 'T00:00:00');
    const dayOfWeekName = DAY_NAME_MAP[d.getDay()];
    const isScheduledStudyDay = scheduledStudyDays.includes(dayOfWeekName);
    const chapters = log?.topicsCompleted || 0;
    const minutes = log?.timeStudiedMinutes || 0;
    const target = log?.targetForDay || 0;
    const isToday = selectedDateStr === todayDateString;
    const isFuture = selectedDateStr > todayDateString;

    const hadActivity = chapters > 0 || minutes > 0;
    const targetMet = target > 0 ? chapters >= target : chapters > 0;
    const isRestDay = !isScheduledStudyDay && !hadActivity;

    return {
      dateStr: selectedDateStr,
      formattedDate: d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
      isToday,
      isFuture,
      isRestDay,
      hadActivity,
      targetMet,
      chapters,
      minutes,
      target,
    };
  }, [selectedDateStr, logsMap, scheduledStudyDays, todayDateString]);

  // Stats
  const stats = calendarData?.stats || {
    currentStreak: 0,
    longestStreak: 0,
    totalMonthlyChapters: 0,
    totalMonthlyMinutes: 0,
    activeDaysCount: 0,
    completionRate: 0,
  };

  const isCurrentMonthView =
    currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1;

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-5 sm:p-6 shadow-apple dark:shadow-apple-dark space-y-6 transition-all duration-300">
      {/* Header: Title, Streak Badge, Navigation & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-sm shrink-0">
            <Flame className="w-5 h-5 fill-current animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-label tracking-tight">
                Study Streak & Consistency
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-accent text-[10px] font-bold">
                {stats.currentStreak} Day{stats.currentStreak === 1 ? '' : 's'} Active
              </span>
            </div>
            <p className="text-xs tracking-wide text-label-secondary mt-0.5">
              Scheduled rest days shield your streak from breaking.
            </p>
          </div>
        </div>

        {/* Month Navigation & View Segmented Switch */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-xl flex items-center gap-1 border border-black/5 dark:border-white/5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                hapticFeedback.tap();
                setViewMode('grid');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-surface-light dark:bg-surface-dark text-text-main dark:text-text-darkMain shadow-sm'
                  : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
              }`}
            >
              Month Grid
            </button>
            <button
              type="button"
              onClick={() => {
                hapticFeedback.tap();
                setViewMode('heatmap');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-surface-light dark:bg-surface-dark text-text-main dark:text-text-darkMain shadow-sm'
                  : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
              }`}
            >
              Activity Strip
            </button>
          </div>

          {/* Month Steppers */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5">
            <Tooltip content="Previous Month" position="top">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-text-muted dark:text-text-darkMuted hover:text-text-main dark:hover:text-text-darkMain transition-colors active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </Tooltip>

            <span className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain px-2 min-w-[96px] text-center font-mono">
              {MONTH_NAMES[currentMonth - 1].slice(0, 3)} {currentYear}
            </span>

            <Tooltip content="Next Month" position="top">
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-text-muted dark:text-text-darkMuted hover:text-text-main dark:hover:text-text-darkMain transition-colors active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>

          {!isCurrentMonthView && (
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs tracking-wide font-bold transition-all active:scale-95"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Streak & Consistency Metrics Bar (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-background-elevated border-[0.5px] border-border rounded-2xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-label-secondary block leading-none mb-1">
              Current Streak
            </span>
            <span className="text-sm font-black text-label font-mono">
              {stats.currentStreak} Days
            </span>
          </div>
        </div>

        <div className="bg-background-elevated border-[0.5px] border-border rounded-2xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-label-secondary block leading-none mb-1">
              Longest Streak
            </span>
            <span className="text-sm font-black text-label font-mono">
              {stats.longestStreak} Days
            </span>
          </div>
        </div>

        <div className="bg-background-elevated border-[0.5px] border-border rounded-2xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-label-secondary block leading-none mb-1">
              Monthly Focus
            </span>
            <span className="text-sm font-black text-label font-mono">
              {stats.totalMonthlyMinutes >= 60
                ? `${(stats.totalMonthlyMinutes / 60).toFixed(1)} hrs`
                : `${stats.totalMonthlyMinutes} mins`}
            </span>
          </div>
        </div>

        <div className="bg-background-elevated border-[0.5px] border-border rounded-2xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-label-secondary block leading-none mb-1">
              Target Hit Rate
            </span>
            <span className="text-sm font-black text-label font-mono">{stats.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Main View Area: Calendar Grid vs Activity Strip */}
      {viewMode === 'grid' ? (
        <div className="space-y-3">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {DAY_LABELS.map((dayLabel, idx) => {
              const isWeekend = idx >= 5;
              return (
                <div
                  key={dayLabel}
                  className={`text-[11px] font-bold uppercase tracking-wider py-1 ${
                    isWeekend
                      ? 'text-text-muted/60 dark:text-text-darkMuted/60'
                      : 'text-text-muted dark:text-text-darkMuted'
                  }`}
                >
                  {dayLabel}
                </div>
              );
            })}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell) => {
              if (cell.isPadding) {
                return (
                  <div
                    key={cell.key}
                    className="min-h-[44px] sm:min-h-[56px] rounded-2xl bg-transparent"
                  />
                );
              }

              const isSelected = selectedDateStr === cell.dateStr;

              // Cell Background & Border Stylings
              let bgStyle =
                'bg-slate-50/50 dark:bg-white/[0.02] border-black/5 dark:border-white/5';

              if (cell.isFuture) {
                bgStyle = 'opacity-35 bg-transparent border-transparent';
              } else if (cell.targetMet) {
                bgStyle = 'bg-success/15 border-success/30 text-success font-bold';
              } else if (cell.hadActivity) {
                bgStyle = 'bg-accent/15 border-accent/30 text-accent font-bold';
              } else if (cell.isRestDay) {
                bgStyle =
                  'bg-black/5 dark:bg-white/5 border-dashed border-border text-label-secondary';
              } else if (cell.isScheduledStudyDay) {
                bgStyle = 'bg-black/[0.03] dark:bg-white/[0.03] border-border text-label-secondary';
              }

              return (
                <motion.div
                  key={cell.key}
                  whileHover={!cell.isFuture ? { scale: 1.05 } : {}}
                  whileTap={!cell.isFuture ? { scale: 0.95 } : {}}
                  onClick={() => {
                    if (!cell.isFuture) {
                      hapticFeedback.tap();
                      setSelectedDateStr(cell.dateStr);
                      if (onSelectDate) onSelectDate(cell.dateStr);
                    }
                  }}
                  className={`relative min-h-[44px] sm:min-h-[56px] p-1.5 sm:p-2 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer select-none ${bgStyle} ${
                    cell.isToday
                      ? 'ring-2 ring-accent ring-offset-2 ring-offset-background shadow-sm'
                      : ''
                  } ${
                    isSelected
                      ? 'border-accent shadow-apple dark:shadow-apple-dark font-extrabold scale-[1.02]'
                      : ''
                  }`}
                >
                  {/* Top: Day Number & Today indicator */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs tracking-wide sm:text-sm font-mono ${
                        cell.isToday
                          ? 'text-accent font-black'
                          : cell.targetMet
                            ? 'text-success font-bold'
                            : cell.hadActivity
                              ? 'text-accent font-bold'
                              : 'text-label'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {cell.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    )}
                  </div>

                  {/* Bottom: Activity Status Badge / Icon */}
                  <div className="flex items-center justify-end mt-1">
                    {cell.targetMet ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-mono text-success">
                        <Flame className="w-3 h-3 fill-current text-success" />
                        <span className="hidden sm:inline">{cell.chapters}</span>
                      </span>
                    ) : cell.hadActivity ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-mono text-accent">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="hidden sm:inline">{cell.chapters}</span>
                      </span>
                    ) : cell.isRestDay ? (
                      <Coffee className="w-3 h-3 text-label-secondary" />
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Alternative View: 30-Day Activity Strip / Heatmap */
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain">
              Recent 30-Day Activity Intensity
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted dark:text-text-darkMuted font-mono">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5" />
              <div className="w-2.5 h-2.5 rounded bg-primary/25" />
              <div className="w-2.5 h-2.5 rounded bg-primary/50" />
              <div className="w-2.5 h-2.5 rounded bg-primary/75" />
              <div className="w-2.5 h-2.5 rounded bg-primary" />
              <span>More</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {calendarCells
              .filter((c) => !c.isPadding && !c.isFuture)
              .map((cell) => {
                let heatColor =
                  'bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5';
                const chapters = cell.chapters || 0;
                const minutes = cell.minutes || 0;

                if (chapters >= 4 || minutes >= 120) {
                  heatColor = 'bg-primary text-white shadow-sm shadow-primary/30';
                } else if (chapters >= 3 || minutes >= 60) {
                  heatColor = 'bg-primary/75 text-white';
                } else if (chapters >= 2 || minutes >= 30) {
                  heatColor = 'bg-primary/50 text-white';
                } else if (chapters >= 1 || minutes >= 10) {
                  heatColor = 'bg-primary/25';
                }

                const isSelected = selectedDateStr === cell.dateStr;

                return (
                  <Tooltip
                    key={cell.key}
                    content={`${cell.dateStr}: ${chapters} chs, ${minutes}m focus`}
                    position="top"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback.tap();
                        setSelectedDateStr(cell.dateStr);
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold transition-all active:scale-95 ${heatColor} ${
                        isSelected ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''
                      }`}
                    >
                      {cell.day}
                    </button>
                  </Tooltip>
                );
              })}
          </div>
        </div>
      )}

      {/* Selected Day Inspector Card */}
      {selectedDayInfo && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDayInfo.dateStr}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            className="bg-slate-50/80 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            {/* Left: Day Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <h4 className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain">
                  {selectedDayInfo.formattedDate}
                </h4>
                {selectedDayInfo.isToday && (
                  <span className="px-2 py-0.2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
                    Today
                  </span>
                )}
              </div>

              <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
                {selectedDayInfo.isRestDay
                  ? 'Scheduled Rest Day — Streak protected!'
                  : selectedDayInfo.targetMet
                    ? `Goal smashed! Completed ${selectedDayInfo.chapters} chapters.`
                    : selectedDayInfo.hadActivity
                      ? `Studied ${selectedDayInfo.chapters} chapters (${selectedDayInfo.minutes} mins).`
                      : selectedDayInfo.isFuture
                        ? 'Upcoming scheduled date.'
                        : 'No study logs recorded on this date.'}
              </p>
            </div>

            {/* Right: Chapter & Focus Metrics */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-semibold text-text-muted dark:text-text-darkMuted block">
                  Chapters
                </span>
                <span className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain font-mono">
                  {selectedDayInfo.chapters}
                  {selectedDayInfo.target > 0 && (
                    <span className="text-text-muted font-normal"> / {selectedDayInfo.target}</span>
                  )}
                </span>
              </div>

              <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-semibold text-text-muted dark:text-text-darkMuted block">
                  Focus
                </span>
                <span className="text-xs tracking-wide font-bold text-secondary font-mono">
                  {selectedDayInfo.minutes}m
                </span>
              </div>

              <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-semibold text-text-muted dark:text-text-darkMuted block">
                  Status
                </span>
                <span
                  className={`text-[11px] font-bold ${
                    selectedDayInfo.targetMet
                      ? 'text-success'
                      : selectedDayInfo.hadActivity
                        ? 'text-accent'
                        : selectedDayInfo.isRestDay
                          ? 'text-label-secondary'
                          : 'text-label-secondary'
                  }`}
                >
                  {selectedDayInfo.targetMet
                    ? 'Achieved'
                    : selectedDayInfo.hadActivity
                      ? 'In Progress'
                      : selectedDayInfo.isRestDay
                        ? 'Rest'
                        : 'Pending'}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}


