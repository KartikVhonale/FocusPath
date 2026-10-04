import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Tooltip from './Tooltip';
import { hapticFeedback } from '../utils/haptics';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function TopNav({ onOpenQuickLog, onOpenSpotlight }) {
  const { user, logout, isTeacher, isManagedStudent, updateUser } = useAuth();
  const { dashboardData, hasPlan } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    hapticFeedback.medium();
    setIsDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const handleCopyInviteCode = (e) => {
    e.stopPropagation();
    if (!user?.teacherCode) return;
    navigator.clipboard.writeText(user.teacherCode);
    setCopiedCode(true);
    hapticFeedback.success();
    toast.success(`Invite Code ${user.teacherCode} copied!`);
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
      toast.error(err.response?.data?.message || 'Failed to join classroom. Check code.');
    } finally {
      setIsJoiningClass(false);
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const userInitial = (user?.username || user?.email || 'A')[0].toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full bg-background/60 backdrop-blur-2xl saturate-150 border-b border-border/50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity & Active Exam Tag */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            onClick={() => hapticFeedback.tap()}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300 shadow-sm">
              <Sparkles className="w-4 h-4 fill-primary/20" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-black text-text-main dark:text-text-darkMain tracking-tight">
                FocusPath
              </span>
              <span className="block text-[10px] font-semibold text-text-muted dark:text-text-darkMuted leading-none">
                {formattedDate}
              </span>
            </div>
          </Link>

          {hasPlan && dashboardData?.examName && (
            <div className="hidden md:flex items-center gap-1.5 ml-2 pl-3 border-l border-black/10 dark:border-white/10">
              <span className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span>{dashboardData.examName}</span>
                <span className="text-text-muted dark:text-text-darkMuted font-normal">
                  ({dashboardData.daysUntilExam}d)
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Center: EXACTLY TWO Primary Navigation Tabs */}
        <nav className="flex items-center p-1 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 shadow-inner">
          {isTeacher ? (
            <>
              {/* Teacher Tab 1: Roster */}
              <NavLink
                to="/teacher"
                end
                onClick={() => hapticFeedback.tap()}
                className={({ isActive }) =>
                  `px-5 py-1.5 rounded-full text-xs tracking-wide font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white dark:bg-white/15 text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-main dark:text-text-darkMuted dark:hover:text-text-darkMain'
                  }`
                }
              >
                <Users className="w-3.5 h-3.5" />
                <span>Roster</span>
              </NavLink>

              {/* Teacher Tab 2: Master Plan */}
              <NavLink
                to="/master-plan"
                onClick={() => hapticFeedback.tap()}
                className={({ isActive }) =>
                  `px-5 py-1.5 rounded-full text-xs tracking-wide font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white dark:bg-white/15 text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-main dark:text-text-darkMuted dark:hover:text-text-darkMain'
                  }`
                }
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Master Plan</span>
              </NavLink>
            </>
          ) : (
            <>
              {/* Student Tab 1: Focus */}
              <NavLink
                to="/"
                end
                onClick={() => hapticFeedback.tap()}
                className={({ isActive }) =>
                  `px-5 py-1.5 rounded-full text-xs tracking-wide font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white dark:bg-white/15 text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-main dark:text-text-darkMuted dark:hover:text-text-darkMain'
                  }`
                }
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Focus</span>
              </NavLink>

              {/* Student Tab 2: Path */}
              <NavLink
                to="/path"
                onClick={() => hapticFeedback.tap()}
                className={({ isActive }) =>
                  `px-5 py-1.5 rounded-full text-xs tracking-wide font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white dark:bg-white/15 text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-main dark:text-text-darkMuted dark:hover:text-text-darkMain'
                  }`
                }
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Path</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Right: Quick Action, Streak & Profile Avatar Dropdown */}
        <div className="flex items-center gap-3">
          {/* Streak Flame Pill (Students with active plan) */}
          {!isTeacher && hasPlan && dashboardData && (
            <Tooltip
              content={`${dashboardData.streak || 0} consecutive study days!`}
              position="bottom"
            >
              <Link
                to="/path"
                onClick={() => hapticFeedback.tap()}
                className="flex items-center gap-1.5 bg-accent/10 hover:bg-accent/15 border border-accent/20 text-accent px-3 py-1.5 rounded-full text-xs tracking-wide font-bold shadow-sm transition-all"
              >
                <Flame className="w-3.5 h-3.5 fill-current text-accent" />
                <span>{dashboardData.streak || 0}d</span>
              </Link>
            </Tooltip>
          )}

          {/* Spotlight Palette Shortcut Button */}
          <Tooltip content="Spotlight Search & Commands" shortcut="⌘K" position="bottom">
            <button
              type="button"
              onClick={() => {
                hapticFeedback.tap();
                if (onOpenSpotlight) onOpenSpotlight();
                else if (onOpenQuickLog) onOpenQuickLog();
              }}
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-main dark:text-text-darkMain border border-black/5 dark:border-white/5 text-xs tracking-wide font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-primary" />
              <span>Search</span>
              <kbd className="px-1 py-0.2 bg-black/5 dark:bg-white/10 rounded text-[9px] font-mono">
                ⌘K
              </kbd>
            </button>
          </Tooltip>

          {/* User Profile Avatar with Apple-style Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                hapticFeedback.tap();
                setIsDropdownOpen((prev) => !prev);
              }}
              aria-label="User profile menu"
              className="w-9 h-9 rounded-full bg-[#E5E5EA] dark:bg-[#38383A] text-label flex items-center justify-center font-medium text-xs tracking-wide border-[0.5px] border-border hover:opacity-90 active:scale-95 transition-all cursor-pointer ring-2 ring-accent/30"
            >
              {userInitial}
            </button>

            {/* Glassmorphic Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border shadow-sm p-2 animate-in fade-in zoom-in-95 duration-150 z-50">
                {/* User Identity Header */}
                <div className="px-3.5 py-3 border-b border-black/5 dark:border-white/5 mb-1">
                  <span className="font-bold text-xs tracking-wide text-text-main dark:text-text-darkMain block truncate">
                    {user?.username || 'Aspirant'}
                  </span>
                  <span className="text-[11px] text-text-muted dark:text-text-darkMuted block truncate">
                    {user?.email || 'aspirant@example.com'}
                  </span>
                  <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {isTeacher
                      ? 'Cohort Instructor'
                      : isManagedStudent
                        ? 'Managed Student'
                        : 'Self-Study Aspirant'}
                  </span>
                </div>

                {/* Teacher Specific: Quick Invite Code Display */}
                {isTeacher && user?.teacherCode && (
                  <div className="px-3.5 py-2.5 bg-black/5 dark:bg-white/5 rounded-2xl mx-1 my-1 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block">
                        Invite Code
                      </span>
                      <span className="text-xs tracking-wide font-mono font-black text-primary">
                        {user.teacherCode}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyInviteCode}
                      className="p-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 text-text-main dark:text-text-darkMain transition-all cursor-pointer"
                      title="Copy code"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-secondary" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Menu Action Items */}
                <div className="space-y-0.5">
                  <Link
                    to="/setup"
                    onClick={() => {
                      hapticFeedback.tap();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-text-muted" />
                    <span>Plan Settings</span>
                  </Link>

                  {/* Student: Join Classroom Action */}
                  {!isTeacher && (
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback.tap();
                        setIsDropdownOpen(false);
                        setIsJoinModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                    >
                      <Users className="w-4 h-4 text-primary" />
                      <span>Join Classroom</span>
                    </button>
                  )}

                  {/* Theme Switcher Row */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-2xl text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain hover:bg-slate-100 dark:hover:bg-white/5">
                    <span>Appearance</span>
                    <ThemeToggle />
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-1 mt-1 border-t border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs tracking-wide font-semibold text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-[#FF3B30]" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join Classroom Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-background-elevated border-[0.5px] border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-black text-label">Join a Classroom</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text-main cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleJoinClass} className="space-y-3">
              <div>
                <label className="block text-xs tracking-wide font-semibold text-text-muted mb-1">
                  Classroom Invite Code (6 characters)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. HR5AMX"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full text-center font-mono font-black text-lg tracking-widest uppercase px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-primary outline-none text-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main text-xs tracking-wide font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoiningClass || !joinCode.trim()}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs tracking-wide font-bold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isJoiningClass ? 'Joining...' : 'Join Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}


