import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Crown, Users, RefreshCw } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CohortLeaderboard() {
  const { user } = useAuth();

  const {
    data: leaderboard = [],
    isLoading: loading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['cohortLeaderboard'],
    queryFn: async () => {
      const res = await api.getCohortLeaderboard();
      return res?.leaderboard || [];
    },
    staleTime: 60 * 1000,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } },
  };

  return (
    <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-6 flex flex-col max-h-[460px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-sm">
            <Trophy className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-label tracking-tight">
                Cohort Activity Standings
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                Classroom Peers
              </span>
            </div>
            <p className="text-[11px] text-label-secondary">
              Apple Activity inspired peer benchmarks. Keep your streak alive to climb!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-xl text-label-secondary hover:text-label hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
          title="Refresh Standings"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-label-secondary flex-1">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-wide font-medium">Gathering peer progress...</span>
        </div>
      ) : leaderboard.length === 0 ? (
        /* Empty State */
        <div className="py-10 flex flex-col items-center justify-center gap-2 text-label-secondary flex-1 text-center px-4">
          <Users className="w-8 h-8 opacity-40 mb-1" />
          <p className="text-xs tracking-wide font-medium max-w-sm">
            No cohort standings available yet. Complete a study session to initialize peer rankings.
          </p>
        </div>
      ) : (
        /* Staggered Leaderboard List with Independent Custom Scrollbar */
        <ErrorBoundary
          fallbackRender={({ resetErrorBoundary }) => (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-label-secondary text-center flex-1">
              <span className="w-2.5 h-2.5 rounded-full bg-label-secondary/30 mb-1" />
              <span className="text-xs tracking-wide font-semibold">Cohort telemetry temporarily offline</span>
              <button
                type="button"
                onClick={() => {
                  resetErrorBoundary();
                  refetch();
                }}
                className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          )}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 pt-1"
          >
            {leaderboard.map((student, idx) => {
              const rank = idx + 1;
              const isTop1 = rank === 1;
              const isTop2 = rank === 2;
              const isTop3 = rank === 3;
              const isActive = student.currentStreak > 0 || student.isCurrentUser;

              // Apple Monochrome + One Accent Badges
              const rankBadgeStyle = isTop1
                ? 'bg-accent text-white shadow-sm shadow-accent/20'
                : isTop2
                  ? 'bg-black/10 dark:bg-white/10 text-label font-bold'
                  : isTop3
                    ? 'bg-black/5 dark:bg-white/5 text-label-secondary font-bold'
                    : 'bg-transparent text-label-secondary';

              return (
                <motion.div
                  key={`${student.firstName}-${idx}`}
                  variants={itemVariants}
                  className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                    student.isCurrentUser
                      ? 'bg-accent/10 border-2 border-accent/40 shadow-sm'
                      : 'bg-background border-[0.5px] border-border hover:border-accent/30'
                  }`}
                >
                  {/* Left: Rank, Avatar & Name */}
                  <div className="flex items-center gap-3">
                    {/* Rank Number / Podium Badge */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs tracking-wide shrink-0 ${rankBadgeStyle}`}
                    >
                      {isTop1 ? <Crown className="w-3.5 h-3.5 fill-current" /> : rank}
                    </div>

                    {/* Circular Avatar with Presence Status Dot (Zero Layout Shift) */}
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 text-label flex items-center justify-center font-bold text-xs tracking-wide">
                        {(student.firstName?.[0] || 'A').toUpperCase()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background transition-colors ${
                          isActive ? 'bg-success' : 'bg-black/20 dark:bg-white/20'
                        }`}
                        title={isActive ? 'Active' : 'Offline'}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs tracking-wide ${
                            student.isCurrentUser
                              ? 'font-black text-accent'
                              : 'font-bold text-label'
                          }`}
                        >
                          {student.firstName}
                        </span>
                        {student.isCurrentUser && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-accent/20 text-accent px-1.5 py-0.2 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-label-secondary block">
                        {student.completionPercentage}% of syllabus mastered
                      </span>
                    </div>
                  </div>

                  {/* Right: Streak & Miniature Circular Progress Ring */}
                  <div className="flex items-center gap-4">
                    {/* Current Streak */}
                    <div className="flex items-center gap-1 text-accent font-bold text-xs tracking-wide bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{student.currentStreak}d</span>
                    </div>

                    {/* Miniature Circular Progress Ring */}
                    <div className="w-8 h-8 relative shrink-0">
                      <CircularProgressbar
                        value={student.completionPercentage}
                        strokeWidth={12}
                        styles={buildStyles({
                          strokeLinecap: 'round',
                          pathColor: 'var(--color-accent)',
                          trailColor: 'currentColor',
                        })}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-label">
                        {student.completionPercentage}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </ErrorBoundary>
      )}
    </div>
  );
}

