import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Target, Compass, Plus, Users } from 'lucide-react';
import { queryKeys } from '../utils/queryKeys';
import { hapticFeedback } from '../utils/haptics';
import api from '../services/api';

/**
 * BottomNav Component (Apple HIG Native Mobile Tab Bar)
 *
 * Requirements:
 * - Hidden on desktop / tablet (md:hidden)
 * - Fixed to the bottom with safe area padding: pb-[env(safe-area-inset-bottom)]
 * - Ultra-clear Apple HIG styling: bg-background/70 backdrop-blur-2xl border-t border-border/50
 * - 4 flat lucide-react icons with >= 44px touch targets: Focus, Path, Log, Hub
 * - Prefetching on touch/hover for instant zero-latency transitions
 */
export default function BottomNav({ onOpenClassmates, onOpenQuickLog }) {
  const location = useLocation();
  const queryClient = useQueryClient();

  /** Prefetch Focus tab data (dashboard + up-next queue) */
  const handlePrefetchFocus = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard(),
      queryFn: api.getDashboard,
      staleTime: 5 * 60 * 1000,
    });
  };

  /** Prefetch Path tab data (timeline, trends, distribution, leaderboard) */
  const handlePrefetchPath = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.timeline(30),
      queryFn: () => api.getTimelineHistory(30),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.trends(),
      queryFn: api.getTrendsReport,
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.distribution(),
      queryFn: api.getSubjectDistribution,
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.leaderboard(),
      queryFn: api.getCohortLeaderboard,
      staleTime: 5 * 60 * 1000,
    });
  };

  /** Prefetch Hub data so modal opens instantaneously */
  const handlePrefetchHub = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.leaderboard(),
      queryFn: api.getCohortLeaderboard,
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleOpenHub = () => {
    hapticFeedback.tap();
    if (onOpenClassmates) {
      onOpenClassmates();
    } else {
      window.dispatchEvent(new CustomEvent('open-classmates'));
    }
  };

  const handleOpenLog = () => {
    hapticFeedback.tap();
    if (onOpenQuickLog) {
      onOpenQuickLog();
    } else {
      window.dispatchEvent(new CustomEvent('open-quick-log'));
    }
  };

  const isFocusActive = location.pathname === '/' || location.pathname === '/focus';
  const isPathActive = location.pathname === '/path';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-background/70 backdrop-blur-2xl border-t border-border/50 pb-[env(safe-area-inset-bottom)] z-50 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {/* TAB 1: FOCUS */}
        <NavLink
          to="/"
          onTouchStart={handlePrefetchFocus}
          onMouseEnter={handlePrefetchFocus}
          onClick={() => hapticFeedback.tap()}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
            isFocusActive ? 'text-accent font-semibold' : 'text-label-secondary hover:text-label'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Target className={`w-5 h-5 ${isFocusActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            {isFocusActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
            )}
          </div>
          <span className="text-[11px] leading-none tracking-tight">Focus</span>
        </NavLink>

        {/* TAB 2: PATH */}
        <NavLink
          to="/path"
          onTouchStart={handlePrefetchPath}
          onMouseEnter={handlePrefetchPath}
          onClick={() => hapticFeedback.tap()}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
            isPathActive ? 'text-accent font-semibold' : 'text-label-secondary hover:text-label'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Compass className={`w-5 h-5 ${isPathActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            {isPathActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
            )}
          </div>
          <span className="text-[11px] leading-none tracking-tight">Path</span>
        </NavLink>

        {/* TAB 3: QUICK LOG */}
        <button
          type="button"
          onClick={handleOpenLog}
          className="flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer text-label-secondary hover:text-accent"
        >
          <div className="relative flex items-center justify-center">
            <Plus className="w-5 h-5 stroke-[2.25]" />
          </div>
          <span className="text-[11px] leading-none tracking-tight">Log</span>
        </button>

        {/* TAB 4: HUB */}
        <button
          type="button"
          onMouseEnter={handlePrefetchHub}
          onTouchStart={handlePrefetchHub}
          onClick={handleOpenHub}
          className="flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer text-label-secondary hover:text-label"
        >
          <div className="relative flex items-center justify-center">
            <Users className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className="text-[11px] leading-none tracking-tight">Hub</span>
        </button>
      </div>
    </nav>
  );
}
