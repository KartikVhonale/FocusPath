import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Flame,
  User,
  Settings,
  LogOut,
  KeyRound,
  Plus,
  Compass,
  Clock,
  Layers,
  Users,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Search,
  X,
  Target,
  Sun,
  Moon,
  BookOpen,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { hapticFeedback } from '../utils/haptics';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function AppNavigation({ onOpenQuickLog, onOpenSpotlight }) {
  const { user, logout, isTeacher, isManagedStudent, updateUser } = useAuth();
  const { dashboardData, hasPlan, activeExam, quickIncrement } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [copiedCode, setCopiedCode] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoiningClass, setIsJoiningClass] = useState(false);

  // Dark Mode State
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    hapticFeedback.medium();
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
      toast('☀️ Light Mode enabled', { id: 'theme-mode' });
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
      toast('🌙 Dark Mode enabled', { id: 'theme-mode' });
    }
  };

  const handleLogout = () => {
    hapticFeedback.medium();
    logout();
    navigate('/login');
  };

  const handleCopyInviteCode = (e) => {
    e.stopPropagation();
    if (!user?.teacherCode) return;
    navigator.clipboard.writeText(user.teacherCode);
    setCopiedCode(true);
    hapticFeedback.success();
    toast.success(`Teacher Code "${user.teacherCode}" copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error('Please enter a classroom code.');
      return;
    }
    try {
      setIsJoiningClass(true);
      const res = await api.joinClass(joinCode.trim());
      if (res.success) {
        hapticFeedback.success();
        toast.success(res.message || 'Successfully joined classroom!');
        setIsJoinModalOpen(false);
        setJoinCode('');
        try {
          const me = await api.getMe();
          if (me?.user) updateUser?.(me.user);
        } catch {
          // Non-blocking
        }
        window.location.reload();
      }
    } catch (err) {
      console.error('Error joining classroom:', err);
      toast.error(err.response?.data?.message || 'Invalid or expired classroom code.');
    } finally {
      setIsJoiningClass(false);
    }
  };

  const streak = dashboardData?.streak || 0;
  const examName = dashboardData?.examName || activeExam?.name || 'Competitive Exam';
  const daysUntilExam = dashboardData?.daysUntilExam || 0;

  const studentNavItems = [
    { to: '/', label: 'Focus', icon: Target, description: 'Dashboard & Target Ring' },
    { to: '/path', label: 'Path', icon: Compass, description: 'Syllabus Explorer' },
  ];

  const teacherNavItems = [
    { to: '/teacher', label: 'Roster', icon: Users, description: 'Classroom & Students' },
    {
      to: '/teacher/master-plan',
      label: 'Master Plan',
      icon: Layers,
      description: 'Curriculum & Syllabi',
    },
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  return (
    <>
      {/* ============================================================== */}
      {/* 1. DESKTOP PERSISTENT LEFT SIDEBAR NAVIGATION (md: and above)  */}
      {/* ============================================================== */}
      <aside className="hidden md:flex flex-col justify-between fixed left-0 top-0 bottom-0 w-64 z-30 bg-surface-light/85 dark:bg-surface-dark/85 backdrop-blur-2xl border-r border-black/5 dark:border-white/10 p-5 select-none transition-colors duration-300">
        <div className="space-y-6">
          {/* App Branding & Icon */}
          <Link
            to="/"
            className="flex items-center gap-3 px-2 py-1 group transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-text-main dark:text-text-darkMain block">
                FocusPath
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block">
                Adaptive Study OS
              </span>
            </div>
          </Link>

          {/* Active Exam Status Pill */}
          {hasPlan && (
            <div className="px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary truncate">
                  {examName}
                </span>
                {daysUntilExam > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
                    {daysUntilExam}d left
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted dark:text-text-darkMuted">
                <Flame className="w-3.5 h-3.5 text-accent fill-current shrink-0" />
                <span className="font-bold text-text-main dark:text-text-darkMain">
                  {streak} Day Streak
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs tracking-wide font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-apple shadow-primary/30'
                      : 'text-text-muted hover:text-text-main dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'stroke-[2.5]' : ''
                    }`}
                  />
                  <div className="flex flex-col">
                    <span className="leading-tight">{item.label}</span>
                    <span
                      className={`text-[10px] font-normal ${
                        isActive ? 'text-white/80' : 'text-text-muted group-hover:text-text-main'
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </nav>

          {/* Global Quick Action Triggers */}
          <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
            {/* Cmd+K Keyboard Spotlight Trigger */}
            <button
              type="button"
              onClick={onOpenSpotlight}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs tracking-wide font-semibold text-text-muted hover:text-text-main dark:hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span>Search topics...</span>
              </div>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-text-muted">
                ⌘K
              </kbd>
            </button>

            {/* Quick Log Stepper Button */}
            {!isTeacher && onOpenQuickLog && (
              <button
                type="button"
                onClick={onOpenQuickLog}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 text-xs tracking-wide font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Quick Log Topic</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 font-bold">
                  +1
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Dark Mode Toggle & User Profile Dropdown */}
        <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5">
          {/* Dark Mode Toggle Switch */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 text-xs tracking-wide font-semibold text-text-muted hover:text-text-main dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {isDark ? (
                <Moon className="w-4 h-4 text-accent" />
              ) : (
                <Sun className="w-4 h-4 text-accent" />
              )}
              <span>Appearance</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-accent text-white font-bold text-xs tracking-wide flex items-center justify-center shrink-0 shadow-sm">
                    {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain truncate block">
                      {user?.name || user?.username || 'Aspirant'}
                    </span>
                    <span className="text-[10px] text-text-muted dark:text-text-darkMuted uppercase font-bold tracking-wider block">
                      {isTeacher ? 'Teacher' : isManagedStudent ? 'Managed' : 'Self-Study'}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                sideOffset={8}
                className="z-50 min-w-[210px] bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border rounded-3xl p-2 shadow-sm animate-in fade-in zoom-in-95 duration-150 outline-none"
              >
                <div className="px-3 py-2 border-b border-black/5 dark:border-white/5 mb-1">
                  <p className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain truncate">
                    {user?.email || 'Logged In'}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {isTeacher ? 'Instructor Account' : 'Student Account'}
                  </p>
                </div>

                {isTeacher && user?.teacherCode && (
                  <DropdownMenu.Item
                    onSelect={handleCopyInviteCode}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain hover:bg-black/5 dark:hover:bg-white/10 outline-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-accent" />
                      <span>Copy Teacher Code</span>
                    </div>
                    {copiedCode ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <kbd className="text-[9px] font-mono px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">
                        {user.teacherCode}
                      </kbd>
                    )}
                  </DropdownMenu.Item>
                )}

                {!isTeacher && (
                  <DropdownMenu.Item
                    onSelect={() => setIsJoinModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain hover:bg-black/5 dark:hover:bg-white/10 outline-none cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-accent" />
                    <span>Join Classroom</span>
                  </DropdownMenu.Item>
                )}

                <DropdownMenu.Item
                  onSelect={() => navigate('/setup')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain hover:bg-black/5 dark:hover:bg-white/10 outline-none cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-text-muted" />
                  <span>Configure Study Plan</span>
                </DropdownMenu.Item>

                <div className="h-px bg-black/5 dark:bg-white/5 my-1" />

                <DropdownMenu.Item
                  onSelect={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs tracking-wide font-semibold text-[#FF3B30] hover:bg-[#FF3B30]/10 outline-none cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE TOP HEADER (md:hidden)                               */}
      {/* ============================================================== */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface-light/85 dark:bg-surface-dark/85 backdrop-blur-2xl border-b border-black/5 dark:border-white/10 z-40 px-4 flex items-center justify-between select-none">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <span className="text-sm font-black tracking-tight text-text-main dark:text-text-darkMain">
            FocusPath
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Mobile Streak Pill */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
            <Flame className="w-3 h-3 fill-current" />
            <span>{streak}</span>
          </div>

          {/* Search Trigger */}
          <button
            type="button"
            onClick={onOpenSpotlight}
            className="p-2 rounded-xl text-text-muted hover:text-text-main dark:hover:text-white"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-text-muted hover:text-text-main dark:hover:text-white"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Moon className="w-4 h-4 text-accent" />
            ) : (
              <Sun className="w-4 h-4 text-accent" />
            )}
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (md:hidden)                    */}
      {/* ============================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-2xl border-t border-black/5 dark:border-white/10 z-40 flex items-center justify-around px-3 select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-text-muted hover:text-text-main dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Quick Log / Spotlight action button on Mobile */}
        <button
          type="button"
          onClick={onOpenQuickLog || onOpenSpotlight}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl text-secondary hover:text-secondary-hover"
        >
          <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-[10px] font-bold">Log</span>
        </button>

        {/* Settings / Profile link on Mobile */}
        <button
          type="button"
          onClick={() => navigate('/setup')}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl text-text-muted hover:text-text-main"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Setup</span>
        </button>
      </nav>

      {/* Join Classroom Modal for Students */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-background-elevated border-[0.5px] border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-text-main dark:text-text-darkMain">
                Join Teacher's Classroom
              </h3>
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleJoinClass} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="6-LETTER CODE"
                className="w-full text-center text-lg font-mono font-black tracking-widest py-3 px-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none uppercase"
              />
              <button
                type="submit"
                disabled={isJoiningClass || !joinCode.trim()}
                className="w-full py-3 rounded-2xl bg-secondary text-white font-bold text-xs tracking-wide shadow-apple active:scale-95 disabled:opacity-50"
              >
                {isJoiningClass ? 'Connecting...' : 'Join Classroom'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

