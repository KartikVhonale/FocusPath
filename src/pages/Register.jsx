import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  KeyRound,
  GraduationCap,
  Compass,
  School,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hapticFeedback } from '../utils/haptics';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Mode: 'self_study' | 'managed' | 'teacher'
  const [accountMode, setAccountMode] = useState('self_study');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!username.trim()) {
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

    if (accountMode === 'managed') {
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
      const cleanCode = teacherCode.trim().toUpperCase();
      const result = await register(
        username || 'Aspirant',
        email,
        password,
        accountMode,
        accountMode === 'managed' ? cleanCode : ''
      );

      if (result.success) {
        hapticFeedback.success();
        toast.success(
          accountMode === 'teacher'
            ? '👨‍🏫 Teacher account created! Welcome to your cohort console.'
            : accountMode === 'managed'
              ? '🎓 Enrolled in class successfully! Your syllabus is synchronized.'
              : '🎉 Account created! Welcome aboard.'
        );
        if (accountMode === 'teacher') {
          navigate('/teacher', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        hapticFeedback.warning();
        setErrorMessage(result.message || 'Registration failed. Please check your credentials.');
        toast.error(result.message || 'Registration failed');
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

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 relative transition-colors duration-300">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background Accent Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
        className="w-full max-w-md lg:max-w-xl bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl shadow-apple dark:shadow-apple-dark overflow-hidden relative z-10 transition-all duration-300 p-6 sm:p-8"
      >
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mx-auto shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl tracking-tight font-black text-text-main dark:text-text-darkMain tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
            Choose your learning mode to get started with adaptive tracking
          </p>
        </div>

        {/* Apple-style Segmented Control (Toggle Switch) */}
        <div className="space-y-2 mb-6">
          <label className="text-[11px] font-bold text-text-muted dark:text-text-darkMuted uppercase tracking-wider block text-center">
            Select Learning Mode
          </label>
          <div className="bg-slate-200/80 dark:bg-white/10 p-1 rounded-2xl flex relative backdrop-blur-md">
            {/* Self-Study Option */}
            <button
              type="button"
              onClick={() => {
                setAccountMode('self_study');
                setErrorMessage('');
                setFieldErrors((prev) => ({ ...prev, teacherCode: null }));
                hapticFeedback.tap();
              }}
              className={`flex-1 py-3 px-3 text-xs tracking-wide font-bold rounded-xl transition-all duration-300 ease-in-out relative z-10 flex items-center justify-center gap-2 cursor-pointer ${
                accountMode === 'self_study'
                  ? 'text-text-main dark:text-text-darkMain'
                  : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
              }`}
            >
              <Compass className="w-4 h-4 text-primary" />
              <span>Self-Study</span>
            </button>

            {/* Join a Class Option */}
            <button
              type="button"
              onClick={() => {
                setAccountMode('managed');
                setErrorMessage('');
                hapticFeedback.tap();
              }}
              className={`flex-1 py-3 px-3 text-xs tracking-wide font-bold rounded-xl transition-all duration-300 ease-in-out relative z-10 flex items-center justify-center gap-2 cursor-pointer ${
                accountMode === 'managed'
                  ? 'text-text-main dark:text-text-darkMain'
                  : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-secondary" />
              <span>Join a Class</span>
            </button>

            {/* Sliding Pill */}
            <motion.div
              layout
              transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface-light dark:bg-surface-dark shadow-sm rounded-xl ${
                accountMode === 'managed' ? 'left-[calc(50%+2px)]' : 'left-1'
              }`}
            />
          </div>

          {/* Mode Subtitle Description */}
          <div className="text-center pt-1">
            <p className="text-[11px] text-text-muted dark:text-text-darkMuted">
              {accountMode === 'self_study'
                ? '🎯 Personal pace: Customize your syllabus, target date, and study days independently.'
                : '🔒 Managed cohort: Synced directly to your instructor’s master curriculum and target date.'}
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs tracking-wide text-[#FF3B30]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF3B30]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Teacher Invite Code (Dynamically Revealed when 'Join a Class' is selected) */}
          <AnimatePresence>
            {accountMode === 'managed' && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                className="overflow-hidden space-y-1.5 p-4 rounded-2xl bg-secondary/5 border border-secondary/20"
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
                <div className="relative">
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
                    className={`w-full bg-surface-light dark:bg-black/40 rounded-xl px-4 py-3 text-center text-sm font-mono font-bold tracking-widest text-text-main dark:text-text-darkMain uppercase placeholder-text-muted/50 focus:ring-2 focus:ring-secondary focus:outline-none transition-all duration-300 ${
                      fieldErrors.teacherCode
                        ? 'border-2 border-[#FF3B30] bg-[#FF3B30]/[0.02]'
                        : 'border border-secondary/30'
                    }`}
                  />
                </div>
                {fieldErrors.teacherCode ? (
                  <p className="text-[#FF3B30] text-xs tracking-wide font-semibold flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.teacherCode}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-text-muted dark:text-text-darkMuted text-center">
                    Enter the code provided by your teacher to join their class syllabus.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-main dark:text-text-darkMain uppercase tracking-wider block">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-text-muted dark:text-text-darkMuted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: null }));
                  }
                }}
                className={`w-full bg-slate-50 dark:bg-black/30 rounded-2xl pl-10 pr-4 py-3 text-xs tracking-wide text-text-main dark:text-text-darkMain placeholder-text-muted/60 dark:placeholder-text-darkMuted/60 focus:ring-2 focus:ring-primary focus:outline-none focus:border-transparent transition-all duration-300 ${
                  fieldErrors.username
                    ? 'border-2 border-[#FF3B30] bg-[#FF3B30]/[0.02]'
                    : 'border border-black/10 dark:border-white/10'
                }`}
              />
            </div>
            {fieldErrors.username && (
              <p className="text-[#FF3B30] text-xs tracking-wide font-semibold flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.username}</span>
              </p>
            )}
          </div>

          {/* Email Address */}
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
                className={`w-full bg-slate-50 dark:bg-black/30 rounded-2xl pl-10 pr-4 py-3 text-xs tracking-wide text-text-main dark:text-text-darkMain placeholder-text-muted/60 dark:placeholder-text-darkMuted/60 focus:ring-2 focus:ring-primary focus:outline-none focus:border-transparent transition-all duration-300 ${
                  fieldErrors.email
                    ? 'border-2 border-[#FF3B30] bg-[#FF3B30]/[0.02]'
                    : 'border border-black/10 dark:border-white/10'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[#FF3B30] text-xs tracking-wide font-semibold flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Password */}
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
                className={`w-full bg-slate-50 dark:bg-black/30 rounded-2xl pl-10 pr-4 py-3 text-xs tracking-wide text-text-main dark:text-text-darkMain placeholder-text-muted/60 dark:placeholder-text-darkMuted/60 focus:ring-2 focus:ring-primary focus:outline-none focus:border-transparent transition-all duration-300 ${
                  fieldErrors.password
                    ? 'border-2 border-[#FF3B30] bg-[#FF3B30]/[0.02]'
                    : 'border border-black/10 dark:border-white/10'
                }`}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-[#FF3B30] text-xs tracking-wide font-semibold flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-accent hover:opacity-90 active:scale-95 text-white font-bold text-xs tracking-wide rounded-2xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {accountMode === 'managed' ? 'Join Class & Register' : 'Create Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Educator Switch Option */}
        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
          <button
            type="button"
            onClick={() => {
              setAccountMode(accountMode === 'teacher' ? 'self_study' : 'teacher');
              hapticFeedback.tap();
            }}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <School className="w-3.5 h-3.5" />
            <span>
              {accountMode === 'teacher'
                ? 'Back to Student Registration'
                : 'Are you an Instructor? Create Teacher Account'}
            </span>
          </button>

          <Link
            to="/login"
            className="text-[11px] font-semibold text-text-main dark:text-text-darkMain hover:text-primary transition-colors"
          >
            Sign In Instead
          </Link>
        </div>
      </motion.div>
    </div>
  );
}


