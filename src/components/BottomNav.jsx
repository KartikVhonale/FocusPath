import React from 'react';
import { queryKeys } from '../utils/queryKeys';
import { NavLink, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Target, Compass, Users } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';
import api from '../services/api';

/**
 * BottomNav Component (Apple HIG Native Mobile Tab Bar)
 *
 * Requirements:
 * - Visible on screens < 768px (md:hidden)
 * - Fixed to the bottom with safe area padding: pb-[env(safe-area-inset-bottom)]
 * - 3 large, evenly spaced 44px+ touch targets: Focus, Path, Hub
 * - Hover/touch-start prefetching on EVERY tab for zero-latency transitions
 */
export default function BottomNav({ onOpenClassmates }) {
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

  /** Prefetch Hub data (classmates, cohort leaderboard) so modal opens instantly */
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

  const isFocusActive = location.pathname === '/';
  const isPathActive = location.pathname === '/path';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 w-full bg-background/60 backdrop-blur-2xl saturate-150 border-t border-border/50 pb-[env(safe-area-inset-bottom)] z-50 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {/* TAB 1: FOCUS — prefetches dashboard on hover/touch */}
        <NavLink
          to="/"
          onTouchStart={handlePrefetchFocus}
          onMouseEnter={handlePrefetchFocus}
          onClick={() => hapticFeedback.tap()}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
            isFocusActive ? 'text-accent font-bold' : 'text-label-secondary hover:text-label'
          }`}
        >
          <div className="relative">
            <Target className={`w-5 h-5 ${isFocusActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            {isFocusActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
            )}
          </div>
          <span className="text-[11px] leading-none tracking-tight">Focus</span>
        </NavLink>

        {/* TAB 2: PATH — prefetches timeline + radar data on hover/touch */}
        <NavLink
          to="/path"
          onTouchStart={handlePrefetchPath}
          onMouseEnter={handlePrefetchPath}
          onClick={() => hapticFeedback.tap()}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
            isPathActive ? 'text-accent font-bold' : 'text-label-secondary hover:text-label'
          }`}
        >
          <div className="relative">
            <Compass className={`w-5 h-5 ${isPathActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            {isPathActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
            )}
          </div>
          <span className="text-[11px] leading-none tracking-tight">Path</span>
        </NavLink>

        {/* TAB 3: HUB — prefetches classmate leaderboard on hover/touch */}
        <button
          type="button"
          onMouseEnter={handlePrefetchHub}
          onTouchStart={handlePrefetchHub}
          onClick={handleOpenHub}
          className="flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer text-label-secondary hover:text-label"
        >
          <div className="relative">
            <Users className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className="text-[11px] leading-none tracking-tight">Hub</span>
        </button>
      </div>
    </nav>
  );
}



