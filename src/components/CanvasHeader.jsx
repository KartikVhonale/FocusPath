import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PanelLeft, Search, Flame, Moon, Sun, Plus, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCanvasScroll } from '../hooks/useCanvasScroll';
import { useTheme } from '../hooks/useTheme';
import { hapticFeedback } from '../utils/haptics';
import toast from 'react-hot-toast';

export default function CanvasHeader({
  onToggleSidebar,
  onOpenSpotlight,
  onOpenQuickLog,
  onOpenClassmates,
}) {
  const { dashboardData, activeExam, hasPlan } = useApp();
  const { user, isTeacher } = useAuth();
  const location = useLocation();
  const { isScrolled } = useCanvasScroll(35);
  const { isDark, toggleTheme: toggleDarkMode } = useTheme();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Focus';
      case '/path':
        return 'Path';
      case '/teacher':
        return 'Roster';
      case '/master-plan':
      case '/teacher/master-plan':
        return 'Master Plan';
      case '/setup':
        return 'Plan Setup';
      case '/builder':
        return 'Plan Builder';
      default:
        return 'Overview';
    }
  };

  const pageTitle = getPageTitle(location.pathname);
  const streak = dashboardData?.streak || 0;
  const examName = dashboardData?.examName || activeExam?.name;

  return (
    <header className="sticky top-0 z-20 min-h-14 pt-[env(safe-area-inset-top)] bg-glass backdrop-blur-xl border-b-[0.5px] border-border px-4 sm:px-6 flex items-center justify-between shrink-0 select-none transition-colors duration-300">
      <div className="flex items-center gap-3">
        {/* Native macOS & iOS Sidebar Toggle (Available on Mobile & Desktop) */}
        <button
          type="button"
          onClick={() => {
            hapticFeedback.tap();
            onToggleSidebar?.();
          }}
          aria-label="Toggle Sidebar"
          title="Toggle Sidebar (⌘B)"
          className="flex min-w-[44px] min-h-[44px] p-2 rounded-xl text-label-secondary hover:text-label hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer items-center justify-center"
        >
          <PanelLeft className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        {/* Vertical divider (Desktop only) */}
        <div className="hidden md:block h-4 w-px bg-border" />

        {/* Location Breadcrumb & Active Exam (Desktop only) */}
        <div className="hidden md:flex items-center gap-2 text-xs tracking-wide font-semibold text-label-secondary py-2">
          <span className="text-label font-bold">{pageTitle}</span>
          {hasPlan && examName && (
            <>
              <span className="text-label-secondary/40">•</span>
              <span className="text-[11px] text-label-secondary truncate max-w-[260px]">
                {examName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* PART 1: Mobile Seamless Inline Title (Fades in when scrolling past Large Title) */}
      <motion.div
        animate={{
          opacity: isScrolled ? 1 : 0,
          y: isScrolled ? 0 : 5,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
        className="md:hidden absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center"
      >
        <span className="text-sm font-semibold tracking-tight text-label">{pageTitle}</span>
      </motion.div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Log Action (Desktop Student only) */}
        {!isTeacher && onOpenQuickLog && (
          <button
            type="button"
            onClick={() => {
              hapticFeedback.tap();
              onOpenQuickLog();
            }}
            className="hidden md:flex min-h-[44px] items-center gap-1.5 px-3 py-2 rounded-xl bg-background-elevated hover:bg-black/5 dark:hover:bg-white/5 text-label border-[0.5px] border-border text-xs tracking-wide font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3] text-accent" />
            <span>Log</span>
          </button>
        )}

        {/* Classmates Hub Button (Desktop Student only) */}
        {!isTeacher && onOpenClassmates && (
          <button
            type="button"
            onClick={() => {
              hapticFeedback.tap();
              onOpenClassmates();
            }}
            title="Classmates Radar"
            className="hidden md:flex min-h-[44px] items-center gap-1.5 px-3 py-2 rounded-xl bg-background-elevated hover:bg-black/5 dark:hover:bg-white/5 text-label border-[0.5px] border-border text-xs tracking-wide font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Classmates</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          </button>
        )}

        {/* Quick Spotlight Search (Desktop only) */}
        <button
          type="button"
          onClick={() => {
            hapticFeedback.tap();
            onOpenSpotlight?.();
          }}
          className="hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs tracking-wide font-semibold text-label-secondary hover:text-label transition-all cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/10 dark:bg-white/10">
            ⌘K
          </kbd>
        </button>

        {/* Streak indicator if plan active (Desktop only) */}
        {hasPlan && streak > 0 && (
          <div className="hidden md:flex items-center gap-1.5 text-xs tracking-wide font-bold text-accent bg-accent/10 px-2.5 py-1.5 rounded-xl border border-accent/20">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{streak}d</span>
          </div>
        )}

        {/* Theme Toggle (Desktop only) */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center p-2 rounded-xl text-label-secondary hover:text-label hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Toggle Appearance"
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-accent" />
          ) : (
            <Sun className="w-4 h-4 text-label-secondary" />
          )}
        </button>

        {/* PART 3: Mobile-Only Profile Avatar (Tapping reveals sidebar drawer & profile) */}
        <div className="md:hidden flex items-center shrink-0">
          <button
            type="button"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1"
            title={user?.name || 'Profile & Menu'}
            aria-label="Open Navigation & Profile"
            onClick={() => {
              hapticFeedback.tap();
              onToggleSidebar?.();
            }}
          >
            <div className="w-8 h-8 rounded-full bg-accent text-white font-black text-xs tracking-wide flex items-center justify-center shadow-md ring-2 ring-white/20 select-none cursor-pointer active:scale-95 transition-transform">
              {user?.firstName?.[0] || user?.name?.[0] || 'A'}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}


