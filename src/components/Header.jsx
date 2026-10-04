import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Flame, LogOut, Sparkles, Plus, Calendar, Command } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';
import ThemeToggle from './ThemeToggle';
import Tooltip from './Tooltip';

export default function Header({ onOpenQuickLog }) {
  const { dashboardData, hasPlan } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const handleLogout = () => {
    hapticFeedback.tap();
    logout();
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 py-2.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Mobile Brand & Desktop Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* Mobile Only Logo */}
          <Link
            to="/"
            onClick={() => hapticFeedback.tap()}
            className="flex items-center gap-2.5 md:hidden"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block leading-none">
                {formattedDate}
              </span>
              <span className="text-base font-black text-text-main dark:text-text-darkMain tracking-tight">
                Aspirant
              </span>
            </div>
          </Link>

          {/* Desktop Breadcrumb Date & Active Exam */}
          <div className="hidden md:flex items-center gap-2.5">
            <span className="text-xs tracking-wide font-semibold text-text-muted dark:text-text-darkMuted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{formattedDate}</span>
            </span>

            {hasPlan && dashboardData?.examName && (
              <>
                <span className="text-text-muted/40">•</span>
                <span className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  <span>{dashboardData.examName}</span>
                  <span className="text-text-muted font-normal">
                    ({dashboardData.daysUntilExam}d remaining)
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Quick Action, Streak, Theme & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Quick Log Command Button (Desktop & Mobile) */}
          <Tooltip content="Quick Log Chapters" shortcut="Ctrl+K" position="bottom">
            <button
              type="button"
              onClick={() => {
                hapticFeedback.tap();
                if (onOpenQuickLog) onOpenQuickLog();
              }}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs tracking-wide font-bold transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Quick Log</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 bg-white/40 dark:bg-black/20 rounded text-[9px] font-mono">
                ⌘K
              </kbd>
            </button>
          </Tooltip>

          {/* Study Streak Pill (Click to view Streak Calendar) */}
          {hasPlan && dashboardData && (
            <Tooltip
              content={`${dashboardData.streak || 0} consecutive study days! Click to inspect Streak Calendar`}
              position="bottom"
            >
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.medium();
                  window.dispatchEvent(new CustomEvent('open-streak-calendar'));
                }}
                className="flex items-center gap-1.5 bg-accent/10 hover:bg-accent/15 active:scale-95 border border-accent/20 text-accent px-3 py-1.5 rounded-full text-xs tracking-wide font-bold shadow-sm transition-all cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 fill-current text-accent" />
                <span>{dashboardData.streak || 0}d</span>
              </button>
            </Tooltip>
          )}

          {/* Theme Toggle (Mobile view; on desktop also in sidebar) */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>

          {/* Mobile Sign out */}
          {user && (
            <div className="flex items-center md:hidden">
              <button
                onClick={handleLogout}
                title={`Sign out (${user.email})`}
                className="w-8 h-8 rounded-full bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 border border-[#FF3B30]/20 text-[#FF3B30] flex items-center justify-center transition-all active:scale-90"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

