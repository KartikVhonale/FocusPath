import React, { memo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { TrendingUp, PieChart } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * Memoized Trends Area Chart
 * Renders 14-day study velocity and target vs actual completion with flat Apple HIG styling
 */
export const TrendsAreaChart = memo(function TrendsAreaChart({ data = [], loading = false }) {
  const isMobile = useIsMobile();
  if (loading) {
    return (
      <div className="h-[280px] min-h-[250px] min-w-0 w-full flex items-center justify-center p-4">
        <div className="w-full h-full bg-background-elevated animate-pulse rounded-2xl border-[0.5px] border-border" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[280px] min-h-[250px] min-w-0 w-full flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-background-elevated border-[0.5px] border-border">
        <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
          <TrendingUp className="w-12 h-12 text-label-tertiary" strokeWidth={1} />
        </div>
        <p className="text-xs tracking-wide font-semibold text-label-secondary max-w-sm">
          No trends data recorded yet. Complete chapters from your Up Next queue to visualize your
          14-day momentum.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[280px] min-h-[250px] min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: isMobile ? 5 : 10, left: isMobile ? -30 : -20, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={isMobile ? 9 : 11}
            tickLine={false}
            axisLine={false}
            interval={isMobile ? 'preserveStartEnd' : 0}
          />
          <YAxis
            stroke="#888888"
            fontSize={isMobile ? 9 : 11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={isMobile ? 25 : 35}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg-elevated)',
              color: 'var(--color-label-primary)',
              borderRadius: '0.75rem',
              border: '0.5px solid var(--color-border)',
              boxShadow: 'none',
              fontSize: '11px',
              fontWeight: 600,
            }}
          />
          <Area
            type="monotone"
            dataKey="plannedTopics"
            name="Target Topics"
            stroke="var(--color-label-secondary)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="var(--color-label-secondary)"
            fillOpacity={0.05}
          />
          <Area
            type="monotone"
            dataKey="completedTopics"
            name="Completed Topics"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="var(--color-accent)"
            fillOpacity={0.12}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

/**
 * Memoized Subject Effort Radar Chart
 * Renders subject allocation breakdown and radar polygon with flat solid fills
 */
export const DistributionRadarChart = memo(function DistributionRadarChart({
  data = [],
  loading = false,
}) {
  const isMobile = useIsMobile();
  if (loading) {
    return (
      <div className="h-[280px] min-h-[250px] min-w-0 w-full flex items-center justify-center p-4">
        <div className="w-[200px] h-[200px] bg-background-elevated animate-pulse rounded-full border-[0.5px] border-border" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[280px] min-h-[250px] min-w-0 w-full flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-background-elevated border-[0.5px] border-border">
        <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
          <PieChart className="w-12 h-12 text-label-tertiary" strokeWidth={1} />
        </div>
        <p className="text-xs tracking-wide font-semibold text-label-secondary max-w-sm">
          No data available yet. Complete a focus session to generate this chart.
        </p>
      </div>
    );
  }

  // Normalize data with numeric plannedHours and actualHours
  const normalizedData = data.map((d) => {
    const plannedMins = d.plannedMinutes ?? (d.total ? d.total * 60 : 60);
    const actualMins = d.actualMinutes ?? d.timeSpentMinutes ?? d.minutes ?? 0;
    const plannedHrs = d.plannedHours ?? Math.round((plannedMins / 60) * 10) / 10;
    const actualHrs = d.actualHours ?? Math.round((actualMins / 60) * 10) / 10;
    const gapHrs = Math.round((actualHrs - plannedHrs) * 10) / 10;

    return {
      ...d,
      subjectName: d.subjectName || d.subject || 'Subject',
      plannedHours: plannedHrs,
      actualHours: actualHrs,
      efficiencyGapHours: gapHrs,
      plannedMinutes: plannedMins,
      actualMinutes: actualMins,
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      {/* Radar Chart Display */}
      <div className="md:col-span-7 w-full h-[280px] min-h-[250px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius={isMobile ? '68%' : '75%'}
            data={normalizedData}
          >
            <PolarGrid stroke="#888888" strokeOpacity={0.2} />
            <PolarAngleAxis
              dataKey="subjectName"
              tick={{ fill: '#888888', fontSize: isMobile ? 9 : 11, fontWeight: 700 }}
            />
            <PolarRadiusAxis
              angle={30}
              stroke="#888888"
              strokeOpacity={0.2}
              tick={{ fontSize: isMobile ? 8 : 10 }}
            />
            {/* Target Planned Time Mapping */}
            <Radar
              name="Planned Target (hrs)"
              dataKey="plannedHours"
              stroke="var(--color-label-secondary)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              fill="var(--color-label-secondary)"
              fillOpacity={0.08}
            />
            {/* Actual Time Focused */}
            <Radar
              name="Actual Focused (hrs)"
              dataKey="actualHours"
              stroke="var(--color-accent)"
              strokeWidth={2}
              fill="var(--color-accent)"
              fillOpacity={0.2}
            />
            {/* Chapters Finished */}
            <Radar
              name="Chapters Done"
              dataKey="completed"
              stroke="var(--color-success)"
              strokeWidth={1.5}
              fill="var(--color-success)"
              fillOpacity={0.15}
            />
            <Legend
              wrapperStyle={{
                fontSize: isMobile ? '10px' : '11px',
                fontWeight: 600,
                paddingTop: '10px',
              }}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-label-primary)',
                borderRadius: '0.75rem',
                border: '0.5px solid var(--color-border)',
                boxShadow: 'none',
                fontSize: '11px',
                fontWeight: 600,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Target vs Actual Efficiency Gap Badges */}
      <div className="md:col-span-5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-label-secondary block">
            Target vs Actual Allocation
          </span>
          <span className="text-[10px] text-label-secondary font-mono">Planned vs Actual</span>
        </div>
        <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
          {normalizedData.map((d) => {
            const isOverPace = d.efficiencyGapHours > 0;
            const isUnderPace = d.efficiencyGapHours < 0;

            return (
              <div
                key={d.subjectName}
                className="p-3 rounded-2xl bg-background-elevated border-[0.5px] border-border flex items-center justify-between text-xs tracking-wide"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-label block truncate">{d.subjectName}</span>
                    {isOverPace && (
                      <span className="text-[9px] font-bold text-apple-orange bg-apple-orange/10 px-1.5 py-0.2 rounded shrink-0">
                        +{d.efficiencyGapHours}h gap
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-label-secondary block">
                    {d.completed} of {d.total} chs ({d.completionRate}%)
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <span className="text-label-secondary" title="Planned Hours">
                      {d.plannedHours}h plan
                    </span>
                    <span className="text-label-secondary">/</span>
                    <span className="font-bold text-accent" title="Actual Hours">
                      {d.actualHours}h act
                    </span>
                  </div>
                  <span className="text-[9px] text-label-secondary font-mono block">
                    {d.actualMinutes}m logged
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});




