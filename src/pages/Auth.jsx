import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Zap,
  BookOpen,
  Clock,
  BarChart3,
  CheckCircle2,
  Compass,
  GraduationCap,
  KeyRound,
  School,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hapticFeedback } from '../utils/haptics';
import ThemeToggle from '../components/ThemeToggle';

export default function Auth() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(false);
  const [loginRole, setLoginRole] = useState('student'); // 'student' | 'teacher'
  const [accountMode, setAccountMode] = useState('self_study');
  const [teacherCode, setTeacherCode] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const destination = location.state?.from?.pathname;
  const targetPath =
    !destination || destination === '/login' || destination === '/register' ? '/' : destination;

  // If already authenticated, redirect to target immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, navigate, targetPath]);

  const validate = () => {
    const errs = {};
    if (isRegister && !username.trim()) {
      errs.username = 'Please enter your name.';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (isRegister && accountMode === 'managed') {
      if (!teacherCode.trim()) {
        errs.teacherCode = 'Teacher Invite Code is required to join a class.';
      } else if (teacherCode.trim().length !== 6) {
        errs.teacherCode = 'Teacher code must be exactly 6 characters.';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    hapticFeedback.tap();

    if (!validate()) {
      hapticFeedback.heavy();
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isRegister) {
        const cleanCode = teacherCode.trim().toUpperCase();
        result = await register(
          username || 'Aspirant',
          email,
          password,
          accountMode,
          accountMode === 'managed' ? cleanCode : ''
        );
      } else {
        result = await login(email, password);
      }

      if (result.success) {
        hapticFeedback.success();
        const isTeacherAccount =
          result.user?.accountMode === 'teacher' ||
          (isRegister && accountMode === 'teacher') ||
          loginRole === 'teacher';

        toast.success(
          isTeacherAccount
            ? '👨‍🏫 Welcome to the Instructor Console!'
            : isRegister && accountMode === 'managed'
              ? '🎓 Enrolled in class successfully! Your syllabus is synchronized.'
              : '👋 Welcome back!'
        );

        if (isTeacherAccount) {
          navigate('/teacher', { replace: true });
        } else {
          navigate(targetPath, { replace: true });
        }
      } else {
        hapticFeedback.warning();
        setErrorMessage(result.message || 'Authentication failed. Please check your credentials.');
        toast.error(result.message || 'Authentication failed');
      }
    } catch (err) {
      hapticFeedback.warning();
      const msg =
        err.response?.data?.message || err.message || 'Could not connect to authentication server.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role = 'student') => {
    hapticFeedback.medium();
    const demoEmail = role === 'teacher' ? 'teacher@studytracker.app' : 'aspirant@studytracker.app';
    const demoPass = 'password123';

    setEmail(demoEmail);
    setPassword(demoPass);
    setFieldErrors({});
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await login(demoEmail, demoPass);
      if (res.success) {
        hapticFeedback.success();
        if (role === 'teacher' || res.user?.accountMode === 'teacher') {
          toast.success('👨‍🏫 Signed in as Demo Instructor!');
          navigate('/teacher', { replace: true });
        } else {
          toast.success('⚡ Signed in as Demo Aspirant!');
          navigate(targetPath, { replace: true });
        }
      } else {
        setErrorMessage(res.message || 'Demo credentials invalid.');
        toast.error(res.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to sign in demo user';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 relative transition-colors duration-300">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Subtle radial background accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
        className="w-full max-w-md lg:max-w-4xl bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl shadow-apple dark:shadow-apple-dark overflow-hidden relative z-10 transition-all duration-300"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Desktop Left Showcase Side (Hidden on mobile) */}
          <div className="hidden lg:flex lg:col-span-6 bg-slate-50/70 dark:bg-black/25 p-10 flex-col justify-between border-r border-black/5 dark:border-white/5">
            <div className="space-y-6">
              {/* App Emblem & Title */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl tracking-tight font-black text-text-main dark:text-text-darkMain tracking-tight">
                    Aspirant
                  </h1>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Adaptive Study Tracker
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-black text-text-main dark:text-text-darkMain tracking-tight leading-snug">
                  Smart study management engineered for Indian competitive exams.
                </h2>
                <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted leading-relaxed">
                  Never suffer from backlog overwhelm again. Our adaptive engine dynamically
                  recalculates your daily pace based on real progress.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain">
                      Dynamic Recalculation Engine
                    </h3>
                    <p className="text-[11px] text-text-muted dark:text-text-darkMuted leading-tight">
                      Missed yesterday? Daily targets adjust automatically each morning so you stay
                      on schedule.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain">
                      Official Syllabi Pre-loaded
                    </h3>
                    <p className="text-[11px] text-text-muted dark:text-text-darkMuted leading-tight">
                      Instant chapter-by-chapter tracking for GATE, JEE Mains, NEET, CA, and SSC
                      CGL.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain">
                      Integrated Focus Stopwatch
                    </h3>
                    <p className="text-[11px] text-text-muted dark:text-text-darkMuted leading-tight">
                      Log deep work sessions and completed topics directly into your daily target.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain">
                      Weekly Velocity Analytics
                    </h3>
                    <p className="text-[11px] text-text-muted dark:text-text-darkMuted leading-tight">
                      Visualize 7-day progress with responsive Recharts metrics and streak tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tagline */}
            <div className="pt-6 border-t border-black/5 dark:border-white/5 flex items-center gap-2 text-[11px] text-text-muted dark:text-text-darkMuted">
              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
              <span>Free, private, and tailored for serious aspirants</span>
            </div>
          </div>

          {/* Right Form Side (Mobile & Desktop) */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-center space-y-6">
            {/* Mobile Branding (Hidden on desktop) */}
            <div className="text-center space-y-1.5 lg:hidden">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mx-auto shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-text-main dark:text-text-darkMain tracking-tight">
                Aspirant
              </h1>
              <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
                Adaptive Study Tracker for Indian Competitive Exams
              </p>
            </div>

            {/* Desktop Form Title */}
            <div className="hidden lg:block space-y-1">
              <h2 className="text-xl font-black text-text-main dark:text-text-darkMain tracking-tight">
                {isRegister ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
                {isRegister
                  ? 'Start your personalized adaptive preparation journey today.'
                  : 'Enter your credentials to access your study dashboard.'}
              </p>
            </div>

            {/* Tab Switcher (iOS Segmented Control for Sign In / Create Account) */}
            <div className="bg-slate-200/80 dark:bg-white/10 p-1 rounded-2xl flex relative backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMessage('');
                  setFieldErrors({});
                  hapticFeedback.tap();
                }}
                className={`flex-1 py-2.5 text-xs tracking-wide font-bold rounded-xl transition-all duration-300 ease-in-out relative z-10 cursor-pointer ${
                  !isRegister
                    ? 'text-text-main dark:text-text-darkMain'
                    : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMessage('');
                  setFieldErrors({});
                  hapticFeedback.tap();
                }}
                className={`flex-1 py-2.5 text-xs tracking-wide font-bold rounded-xl transition-all duration-300 ease-in-out relative z-10 cursor-pointer ${
                  isRegister
                    ? 'text-text-main dark:text-text-darkMain'
                    : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                }`}
              >
                Create Account
              </button>

              {/* Sliding Tab Pill */}
              <motion.div
                layout
                transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface-light dark:bg-surface-dark shadow-sm rounded-xl ${
                  isRegister ? 'left-[calc(50%+2px)]' : 'left-1'
                }`}
              />
            </div>

            {/* Sign In Role Switch (Aspirant vs Instructor) */}
            {!isRegister && (
              <div className="space-y-2">
                <div className="bg-slate-200/80 dark:bg-white/10 p-1 rounded-2xl flex relative backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginRole('student');
                      setEmail('aspirant@studytracker.app');
                      hapticFeedback.tap();
                    }}
                    className={`flex-1 py-2 text-xs tracking-wide font-bold rounded-xl transition-all duration-300 relative z-10 flex items-center justify-center gap-1.5 cursor-pointer ${
                      loginRole === 'student'
                        ? 'text-primary'
                        : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Aspirant Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginRole('teacher');
                      setEmail('teacher@studytracker.app');
                      hapticFeedback.tap();
                    }}
                    className={`flex-1 py-2 text-xs tracking-wide font-bold rounded-xl transition-all duration-300 relative z-10 flex items-center justify-center gap-1.5 cursor-pointer ${
                      loginRole === 'teacher'
                        ? 'text-primary'
                        : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                    }`}
                  >
                    <School className="w-3.5 h-3.5" />
                    <span>Teacher Login</span>
                  </button>

                  <motion.div
                    layout
                    transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface-light dark:bg-surface-dark shadow-sm rounded-xl ${
                      loginRole === 'teacher' ? 'left-[calc(50%+2px)]' : 'left-1'
                    }`}
                  />
                </div>

                {loginRole === 'teacher' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-[11px] text-primary font-bold"
                  >
                    <School className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Instructor Portal: Manage student cohorts & distribute master plans.
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Apple-style Segmented Control for Learning Mode (Self-Study vs Join a Class) */}
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-[11px] font-bold text-text-muted dark:text-text-darkMuted uppercase tracking-wider block text-center">
                    Select Learning Mode
                  </label>
                  <div className="bg-slate-200/80 dark:bg-white/10 p-1 rounded-2xl flex relative backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMode('self_study');
                        setFieldErrors((prev) => ({ ...prev, teacherCode: null }));
                        hapticFeedback.tap();
                      }}
                      className={`flex-1 py-2 text-xs tracking-wide font-bold rounded-xl transition-all duration-300 relative z-10 flex items-center justify-center gap-1.5 cursor-pointer ${
                        accountMode === 'self_study'
                          ? 'text-text-main dark:text-text-darkMain'
                          : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5 text-primary" />
                      <span>Self-Study</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAccountMode('managed');
                        hapticFeedback.tap();
                      }}
                      className={`flex-1 py-2 text-xs tracking-wide font-bold rounded-xl transition-all duration-300 relative z-10 flex items-center justify-center gap-1.5 cursor-pointer ${
                        accountMode === 'managed'
                          ? 'text-text-main dark:text-text-darkMain'
                          : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-secondary" />
                      <span>Join a Class</span>
                    </button>

                    <motion.div
                      layout
                      transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                      className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface-light dark:bg-surface-dark shadow-sm rounded-xl ${
                        accountMode === 'managed' ? 'left-[calc(50%+2px)]' : 'left-1'
                      }`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error banner */}
            {errorMessage && (
              <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs tracking-wide text-[#FF3B30]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF3B30]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Dynamic Teacher Invite Code Input */}
              <AnimatePresence>
                {isRegister && accountMode === 'managed' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                    className="overflow-hidden space-y-1.5 p-3.5 rounded-2xl bg-secondary/5 border border-secondary/20"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Teacher Invite Code</span>
                      </label>
                      <span className="text-[10px] text-text-muted dark:text-text-darkMuted font-medium">
                        6 characters
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 7X9K2M"
                      value={teacherCode}
                      onChange={(e) => {
                        setTeacherCode(e.target.value.toUpperCase());
                        if (fieldErrors.teacherCode) {
                          setFieldErrors((prev) => ({ ...prev, teacherCode: null }));
                        }
                      }}
                      className={`w-full bg-surface-light dark:bg-black/40 rounded-xl px-4 py-2.5 text-center text-sm font-mono font-bold tracking-widest text-text-main dark:text-text-darkMain uppercase placeholder-text-muted/50 focus:ring-2 focus:ring-secondary focus:outline-none transition-all duration-300 ${
                        fieldErrors.teacherCode
                          ? 'border-2 border-[#FF3B30] bg-[#FF3B30]/[0.02]'
                          : 'border border-secondary/30'
                      }`}
                    />
                    {fieldErrors.teacherCode && (
                      <p className="text-[#FF3B30] text-xs tracking-wide font-semibold flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.teacherCode}</span>
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    key="username-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[11px] font-bold text-text-main dark:text-text-darkMain uppercase tracking-wider block">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-text-muted dark:text-text-darkMuted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (fieldErrors.username) {
                            setFieldErrors((prev) => ({ ...prev, username: null }));
                          }
                        }}
                        className={`w-full bg-slate-50 dark:bg-black/30 rounded-2xl pl-10 pr-4 py-3 text-xs tracking-wide text-text-main dark:text-text-darkMain placeholder-text-muted/60 dark:placeholder-text-darkMuted/60 focus:ring-2 focus:ring-primary focus:outline-none focus:border-transparent transition-all duration-300 ease-in-out ${
                          fieldErrors.username
                            ? 'border-2 border-[#FF3B30] bg-[#FF3B30]/[0.02]'
                            : 'border border-black/10 dark:border-white/10'
                        }`}
                      />
                    </div>
                    {fieldErrors.username && (
                      <p className="text-[#FF3B30] text-xs tracking-wide font-semibold flex items-center gap-1 pt-0.5 animate-in fade-in duration-200">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.username}</span>
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-main dark:text-text-darkMain uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-text-muted dark:text-text-darkMuted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="aspirant@studytracker.app"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: null }));
                      }
                    }}
                    className={`w-full bg-slate-50 dark:bg-black/30 rounded-2xl pl-10 pr-4 py-3 text-xs tracking-wide text-text-main dark:text-text-darkMain placeholder-text-muted/60 dark:placeholder-text-darkMuted/60 focus:ring-2 focus:ring-primary focus:outline-none focus:border-transparent transition-all duration-300 ease-in-out ${
                      fieldErrors.email
                        ? 'border-2 border-[#FF3B30] bg-[#FF3B30]/[0.02]'
                        : 'border border-black/10 dark:border-white/10'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[#FF3B30] text-xs tracking-wide font-semibold flex items-center gap-1 pt-0.5 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-main dark:text-text-darkMain uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-muted dark:text-text-darkMuted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: null }));
                      }
                    }}
                    className={`w-full bg-slate-50 dark:bg-black/30 rounded-2xl pl-10 pr-4 py-3 text-xs tracking-wide text-text-main dark:text-text-darkMain placeholder-text-muted/60 dark:placeholder-text-darkMuted/60 focus:ring-2 focus:ring-primary focus:outline-none focus:border-transparent transition-all duration-300 ease-in-out ${
                      fieldErrors.password
                        ? 'border-2 border-[#FF3B30] bg-[#FF3B30]/[0.02]'
                        : 'border border-black/10 dark:border-white/10'
                    }`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-[#FF3B30] text-xs tracking-wide font-semibold flex items-center gap-1 pt-0.5 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-accent hover:opacity-90 active:scale-95 text-white font-bold text-xs tracking-wide rounded-2xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Options */}
            <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block text-center">
                ⚡ One-Click Instant Demo Access
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('student')}
                  disabled={loading}
                  className="py-2.5 px-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 rounded-2xl text-text-main dark:text-text-darkMain font-semibold text-xs tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  <span>Demo Aspirant</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('teacher')}
                  disabled={loading}
                  className="py-2.5 px-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 rounded-2xl text-text-main dark:text-text-darkMain font-semibold text-xs tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <School className="w-3.5 h-3.5 text-secondary" />
                  <span>Demo Teacher</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


