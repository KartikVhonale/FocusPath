import React, { useMemo, useState } from 'react';
import { Flame, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticFeedback } from '../utils/haptics';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * 6-Month Continuous Heatmap Grid (The GitHub/TrackIt Grid)
 * Each square represents a day across the last 26 weeks (~182 days).
 * The opacity of the --color-system-green fill corresponds to the total hours logged that day.
 */
export default function StudyStreakHeatmap({
  heatmapData = [],
  recentLogs = [],
  currentStreak = 0,
  onSelectDate,
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Compute 182-day grid spanning 26 weeks ending today
  const { weeks, stats } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Map logs by YYYY-MM-DD
    const logMap = new Map();
    (recentLogs || []).forEach((l) => {
      if (l.date) {
        logMap.set(l.date, {
          date: l.date,
          minutes: l.timeStudiedMinutes || 0,
          count: l.topicsCompleted || 0,
        });
      }
    });

    (heatmapData || []).forEach((item) => {
      if (item.date) {
        const existing = logMap.get(item.date) || { minutes: 0, count: 0 };
        logMap.set(item.date, {
          date: item.date,
          minutes: Math.max(existing.minutes, item.minutes || 0),
          count: Math.max(existing.count, item.count || 0),
        });
      }
    });

    // Generate 182 continuous days (26 weeks x 7 days)
    const totalDays = 182;
    const daysList = [];
    let totalMinutes = 0;
    let totalChapters = 0;
    let activeDays = 0;

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const log = logMap.get(dateStr) || { minutes: 0, count: 0 };
      const hours = Math.round((log.minutes / 60) * 10) / 10;

      if (log.minutes > 0 || log.count > 0) {
        activeDays++;
        totalMinutes += log.minutes;
        totalChapters += log.count;
      }

      // Calculate fill opacity based on hours logged
      let opacity = 0;
      if (hours > 0 && hours < 1) {
        opacity = 0.25;
      } else if (hours >= 1 && hours < 2.5) {
        opacity = 0.5;
      } else if (hours >= 2.5 && hours < 4.5) {
        opacity = 0.75;
      } else if (hours >= 4.5) {
        opacity = 1.0;
      }

      daysList.push({
        date: dateStr,
        dayOfWeek: d.getDay(),
        dayNumber: d.getDate(),
        monthName: d.toLocaleString('en-US', { month: 'short' }),
        hours,
        minutes: log.minutes,
        count: log.count,
        opacity,
        isToday: i === 0,
      });
    }

    // Group into 26 weekly columns of 7 days each
    const weekCols = [];
    let currentWeek = [];
    daysList.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === daysList.length - 1) {
        weekCols.push(currentWeek);
        currentWeek = [];
      }
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      weeks: weekCols,
      stats: {
        activeDays,
        totalMinutes,
        totalHours,
        totalChapters,
      },
    };
  }, [heatmapData, recentLogs]);

  return (
    <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-success/15 text-success flex items-center justify-center font-bold">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <h3 className="text-sm font-bold text-label tracking-tight">
              6-Month Consistency Grid
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-success/10 text-success border-[0.5px] border-success/20">
              TrackIt Heatmap
            </span>
          </div>
          <p className="text-xs tracking-wide text-label-secondary">
            Continuous daily focus volume across the past 26 weeks
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1 rounded-xl bg-background border-[0.5px] border-border flex items-center gap-1.5 text-xs tracking-wide font-semibold text-label">
            <Flame className="w-3.5 h-3.5 text-success fill-current" />
            <span>{currentStreak} Day Streak</span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-background border-[0.5px] border-border flex items-center gap-1.5 text-xs tracking-wide font-semibold text-label">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>{stats.totalHours}h Logged</span>
          </div>
        </div>
      </div>

      {/* 6-Month Heatmap Grid Canvas */}
      <div className="relative overflow-x-auto pb-2 pt-1 custom-scrollbar">
        <div className="min-w-[680px]">
          {/* Weekday indicator labels + 26 Columns */}
          <div className="flex gap-1.5 items-start">
            {/* Weekday Y-Axis labels */}
            <div className="flex flex-col gap-1.5 pr-2 pt-1 text-[9px] font-mono font-medium text-label-secondary select-none">
              <span className="h-3 leading-3">Sun</span>
              <span className="h-3 leading-3">Mon</span>
              <span className="h-3 leading-3">Tue</span>
              <span className="h-3 leading-3">Wed</span>
              <span className="h-3 leading-3">Thu</span>
              <span className="h-3 leading-3">Fri</span>
              <span className="h-3 leading-3">Sat</span>
            </div>

            {/* Continuous Week Columns */}
            <div className="flex gap-1.5 flex-1">
              {weeks.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1.5 flex-1">
                  {col.map((day) => {
                    const isHovered = hoveredDay?.date === day.date;
                    const hasActivity = day.hours > 0 || day.count > 0;

                    return (
                      <div
                        key={day.date}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => {
                          hapticFeedback.tap();
                          onSelectDate?.(day.date);
                        }}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] transition-all duration-150 relative cursor-pointer ${
                          day.isToday
                            ? 'ring-1.5 ring-accent ring-offset-1 ring-offset-background'
                            : ''
                        } ${isHovered ? 'scale-125 z-10 shadow-sm' : ''}`}
                        style={{
                          backgroundColor: hasActivity
                            ? 'var(--color-success)'
                            : 'rgba(128, 128, 128, 0.08)',
                          opacity: hasActivity ? day.opacity : 1,
                          border: hasActivity ? 'none' : '0.5px solid var(--color-border)',
                        }}
                        title={`${day.date}: ${day.hours}h (${day.count} chapters)`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Hover Tooltip / Detail Row */}
      <div className="h-5 flex items-center justify-between text-xs tracking-wide text-label-secondary border-t border-[0.5px] border-border pt-2">
        <div>
          {hoveredDay ? (
            <span className="font-medium text-label flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>{hoveredDay.date}:</span>
              <span className="font-mono font-bold text-success">
                {hoveredDay.hours} hrs ({hoveredDay.count} concepts)
              </span>
            </span>
          ) : (
            <span>{stats.activeDays} active focus days recorded in last 6 months</span>
          )}
        </div>

        {/* Apple HIG Opacity Scale Legend */}
        <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-label-secondary">
          <span>0h</span>
          <div className="w-2.5 h-2.5 rounded-[3px] border-[0.5px] border-border bg-black/[0.04] dark:bg-white/[0.06]" />
          <div
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: 'var(--color-success)', opacity: 0.25 }}
          />
          <div
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: 'var(--color-success)', opacity: 0.5 }}
          />
          <div
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: 'var(--color-success)', opacity: 0.75 }}
          />
          <div
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: 'var(--color-success)', opacity: 1.0 }}
          />
          <span>4h+</span>
        </div>
      </div>
    </div>
  );
}

