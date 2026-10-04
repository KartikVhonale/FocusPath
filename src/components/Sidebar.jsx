import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Timer,
  Settings,
  Sparkles,
  Flame,
  LogOut,
  Globe,
  Plus,
  FolderTree,
  School,
} from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';
import ThemeToggle from './ThemeToggle';
import Tooltip from './Tooltip';

export default function Sidebar({ onOpenQuickLog }) {
  const { dashboardData, hasPlan, activeExam } = useApp();
  const { user, logout, isTeacher, isManagedStudent, isSelfStudy, teacherName } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    hapticFeedback.tap();
    logout();
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ...(isTeacher
      ? [{ to: '/teacher', label: 'Cohort Console', icon: School, badge: 'Teacher' }]
      : []),
    { to: '/syllabus', label: 'Syllabus Tracker', icon: BookOpen },
    { to: '/timer', label: 'Focus Stopwatch', icon: Timer },
    { to: '/builder', label: 'Syllabus Builder', icon: FolderTree, badge: 'Studio' },
    { to: '/setup', label: 'Plan Setup', icon: Settings },
    { to: '/admin', label: 'Ingest Syllabus', icon: Globe, badge: 'New' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 fixed left-0 top-0 bottom-0 z-40 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl border-r border-black/[0.06] dark:border-white/[0.08] p-5 justify-between transition-colors duration-300">
      {/* Top: Branding & Active Plan Status */}
      <div className="space-y-6">
        {/* App Logo */}
        <Link to="/" onClick={() => hapticFeedback.tap()} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary block leading-none">
              Desktop Edition
            </span>
            <span className="text-xl font-black text-text-main dark:text-text-darkMain tracking-tight">
              Aspirant
            </span>
          </div>
        </Link>

        {/* Active Exam Status Card */}
        {hasPlan && dashboardData && (
          <div className="bg-slate-100/70 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs tracking-wide">
              <span className="font-bold text-text-main dark:text-text-darkMain truncate max-w-[130px]">
                {dashboardData.examName || activeExam?.name || 'Exam'}
              </span>
              <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {dashboardData.daysUntilExam}d left
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-label-secondary pt-1 border-t border-border">
              <span className="flex items-center gap-1 text-accent font-bold">
                <Flame className="w-3.5 h-3.5 fill-current text-accent" />
                <span>{dashboardData.streak || 0}d streak</span>
              </span>
              <span className="font-mono">
                {dashboardData.todayCompleted}/{dashboardData.todayTarget} today
              </span>
            </div>
          </div>
        )}

        {/* Quick Log Power Button (Cmd+K) */}
        <button
          type="button"
          onClick={() => {
            hapticFeedback.tap();
            if (onOpenQuickLog) onOpenQuickLog();
          }}
          className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 flex items-center justify-between text-xs tracking-wide font-semibold text-text-muted dark:text-text-darkMuted hover:text-text-main dark:hover:text-text-darkMain transition-all duration-200 group active:scale-98 shadow-sm"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary group-hover:rotate-90 transition-transform duration-200" />
            <span>Quick Log</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px] font-bold text-text-muted group-hover:text-text-main">
            Ctrl + K
          </kbd>
        </button>

        {/* Navigation Links with Desktop Hover Effects */}
        <nav className="space-y-1.5 pt-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => hapticFeedback.tap()}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs tracking-wide font-bold transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 shadow-sm'
                    : 'text-text-muted dark:text-text-darkMuted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text-main dark:hover:text-text-darkMain'
                }`}
              >
                <div className="flex items-center gap-3 transition-transform duration-200 group-hover:translate-x-1">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-main'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] font-bold bg-secondary/15 text-secondary border border-secondary/25 px-1.5 py-0.5 rounded-md uppercase">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Profile & Theme Toggle */}
      <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold text-xs tracking-wide shrink-0">
                {(user.username || user.name || 'A')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain block truncate leading-tight">
                  {user.username || user.name || 'Aspirant'}
                </span>
                <span className="text-[10px] text-text-muted dark:text-text-darkMuted block truncate">
                  {user.email}
                </span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider bg-accent/15 text-accent border border-accent/25">
                    {isTeacher ? 'Instructor' : isManagedStudent ? 'Managed Class' : 'Self-Study'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip content="Toggle theme" position="top">
                <ThemeToggle />
              </Tooltip>

              <Tooltip content="Sign out" position="top">
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-full bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 border border-[#FF3B30]/20 text-[#FF3B30] flex items-center justify-center transition-all active:scale-90"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

