import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { TrendingUp, Sparkles, BarChart2 } from 'lucide-react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeeklyProgressChart({ recentLogs = [], todayCompleted = 0 }) {
  // Format past 7 days data
  const { chartData, hasActivity, totalWeekChapters } = useMemo(() => {
    const data = [];
    const now = new Date();
    let totalChapters = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const dayName = DAY_NAMES[d.getDay()];
      const isToday = i === 0;

      // Find matching log from backend
      const foundLog = recentLogs?.find((l) => l.date === dateString);

      // If it's today, merge optimistic todayCompleted
      const chapters = isToday
        ? Math.max(foundLog?.topicsCompleted || 0, todayCompleted)
        : foundLog?.topicsCompleted || 0;

      totalChapters += chapters;

      data.push({
        date: dateString,
        day: isToday ? 'Today' : dayName,
        shortDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        chapters,
        isToday,
      });
    }

    return {
      chartData: data,
      hasActivity: totalChapters > 0,
      totalWeekChapters: totalChapters,
    };
  }, [recentLogs, todayCompleted]);

  // Placeholder data for empty state
  const placeholderData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((d, index) => ({
      day: d,
      chapters: [2, 3, 1, 4, 2, 3, 2][index],
      isPlaceholder: true,
    }));
  }, []);

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-5 shadow-apple dark:shadow-apple-dark relative overflow-hidden transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-main dark:text-text-darkMain">
              Weekly Progress
            </h3>
            <span className="text-[10px] text-text-muted dark:text-text-darkMuted block">
              Last 7 days study consistency
            </span>
          </div>
        </div>

        {hasActivity && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/10 border border-secondary/20 rounded-full text-secondary text-xs tracking-wide font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{totalWeekChapters} this week</span>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-48 relative">
        {!hasActivity ? (
          /* Empty State Placeholder Chart */
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Ghost Bars */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={placeholderData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    stroke="#A4B0BE"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#A4B0BE" fontSize={10} tickLine={false} axisLine={false} />
                  <Bar dataKey="chapters" fill="#A4B0BE" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Empty State Banner Overlay */}
            <div className="relative z-10 bg-background-elevated/95 backdrop-blur-md border-[0.5px] border-border rounded-2xl p-4 text-center max-w-[260px] shadow-sm animate-in fade-in zoom-in-95 duration-300">
              <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs tracking-wide font-bold text-label">No activity logged yet</p>
              <p className="text-[11px] text-label-secondary mt-1">
                Start studying today to build your streak!
              </p>
            </div>
          </div>
        ) : (
          /* Active Recharts Bar Chart */
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
              {/* Subtle Grid Lines */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-slate-200/60 dark:stroke-white/5"
              />

              {/* X Axis */}
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fontWeight: 600 }}
                className="fill-text-muted dark:fill-text-darkMuted"
              />

              {/* Y Axis */}
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                className="fill-text-muted dark:fill-text-darkMuted"
              />

              {/* Custom Tooltip */}
              <Tooltip
                cursor={{ fill: 'rgba(255, 107, 107, 0.06)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-background-elevated border-[0.5px] border-border shadow-sm rounded-xl p-2.5 text-xs tracking-wide">
                        <span className="font-bold text-label block">
                          {item.day} ({item.shortDate})
                        </span>
                        <span className="text-accent font-bold mt-0.5 block">
                          {item.chapters} {item.chapters === 1 ? 'chapter' : 'chapters'} completed
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Primary Coral Bars (#FF6B6B) with rounded top corners */}
              <Bar dataKey="chapters" radius={[6, 6, 0, 0]} maxBarSize={32}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? '#FF6B6B' : '#FF6B6B'}
                    opacity={entry.chapters > 0 ? (entry.isToday ? 1 : 0.85) : 0.2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-text-muted dark:text-text-darkMuted">
        <span>Y-Axis: Chapters Completed</span>
        <span>X-Axis: Days of Week</span>
      </div>
    </div>
  );
}

