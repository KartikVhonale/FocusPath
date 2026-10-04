import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Calendar,
  BookOpen,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Lock,
  Sliders,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { hapticFeedback } from '../utils/haptics';

export default function Setup() {
  const { exams, dashboardData, fetchDashboard } = useApp();
  const { isManagedStudent, isLockedByTeacher, teacherName } = useAuth();
  const isLocked = isManagedStudent || isLockedByTeacher;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedExamId, setSelectedExamId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [daysOff, setDaysOff] = useState(['Sun']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize defaults
  useEffect(() => {
    if (dashboardData?.targetDate) {
      const d = new Date(dashboardData.targetDate);
      setTargetDate(d.toISOString().split('T')[0]);
    } else {
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 6);
      setTargetDate(defaultDate.toISOString().split('T')[0]);
    }

    if (exams.length > 0) {
      if (dashboardData?.examCode) {
        const matching = exams.find((e) => e.code === dashboardData.examCode);
        if (matching) setSelectedExamId(matching._id);
        else setSelectedExamId(exams[0]._id);
      } else {
        const gate = exams.find((e) => e.code === 'gate-cs') || exams[0];
        setSelectedExamId(gate._id);
      }
    }
  }, [exams, dashboardData]);

  const selectedExam = useMemo(() => {
    return exams.find((e) => e._id === selectedExamId) || exams[0];
  }, [exams, selectedExamId]);

  // Massive 1-Tap Auto-Pilot Handler
  const handleGenerateSmartSchedule = async () => {
    if (!selectedExamId && exams[0]?._id) {
      setSelectedExamId(exams[0]._id);
    }

    hapticFeedback.heavy();
    setIsSubmitting(true);
    const toastId = toast.loading('Calculating optimal study distribution...');

    try {
      const res = await api.autoSchedule({
        examId: selectedExamId || exams[0]?._id,
        targetDate: targetDate || undefined,
        daysOff,
      });

      if (res.success) {
        hapticFeedback.success();
        toast.success(
          `🚀 Smart Schedule Active! ${res.summary?.totalSubtopics || 'All'} topics mapped. Dropping into Focus...`,
          { id: toastId, duration: 3000 }
        );

        // Refresh global state
        await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
        await queryClient.invalidateQueries({ queryKey: queryKeys.timeline() });
        if (fetchDashboard) {
          await fetchDashboard();
        }

        // Drop directly into the Focus tab (Zero Friction)
        setTimeout(() => {
          navigate('/');
        }, 400);
      } else {
        toast.error(res.message || 'Failed to auto-schedule', { id: toastId });
      }
    } catch (err) {
      console.error('Auto-schedule failed:', err);
      toast.error('Network error while scheduling. Changes saved offline.', { id: toastId });
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDayOff = (day) => {
    hapticFeedback.tap();
    setDaysOff((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs tracking-wide font-bold">
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Zero-Friction Auto-Pilot Engine</span>
        </div>
        <h1 className="text-3xl tracking-tight sm:text-4xl tracking-tight font-black text-text-main dark:text-text-darkMain tracking-tight">
          Your Exam. Auto-Scheduled in One Tap.
        </h1>
        <p className="text-sm text-text-muted dark:text-text-darkMuted max-w-xl mx-auto leading-relaxed">
          Skip manual calendar planning. The mathematical engine automatically maps all 4 levels of
          atomic subtopics across your available study days.
        </p>
      </div>

      {/* Managed Student Notice */}
      {isLocked && (
        <div className="p-4 rounded-3xl bg-background-elevated border-[0.5px] border-border flex items-center justify-between text-label">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 shrink-0 text-label" />
            <div className="text-xs tracking-wide">
              <span className="font-bold block">Classroom Curriculum Active</span>
              <span className="text-label-secondary">
                Instructor {teacherName ? `"${teacherName}"` : ''} manages your pace.
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 border border-border px-3 py-1 rounded-full text-label-secondary">
            Managed
          </span>
        </div>
      )}

      {/* Hero Smart Card */}
      <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-apple dark:shadow-apple-dark space-y-6">
        {/* Exam Selection Pills */}
        <div className="space-y-3">
          <label className="text-xs tracking-wide font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block">
            Select Your Target Competitive Exam
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map((ex) => {
              const isSelected = selectedExam?._id === ex._id;
              const leafCount =
                ex.totalLeafNodes ||
                (ex.subjects || []).reduce((acc, s) => acc + (s.chapters || []).length, 0);
              return (
                <button
                  key={ex._id}
                  type="button"
                  onClick={() => {
                    hapticFeedback.tap();
                    setSelectedExamId(ex._id);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:border-black/15 text-text-main dark:text-text-darkMain'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs tracking-wide font-black truncate">{ex.name}</span>
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted dark:text-text-darkMuted">
                    <span>{(ex.subjects || []).length} Subjects</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-primary">{leafCount} subtopics</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THE SINGLE MASSIVE, APPLE-STYLED BUTTON                                   */}
        {/* ========================================================================= */}
        <div className="pt-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={isSubmitting}
            onClick={handleGenerateSmartSchedule}
            className="w-full py-5 px-6 sm:px-8 rounded-3xl bg-accent hover:opacity-90 text-white shadow-sm flex items-center justify-between cursor-pointer border border-white/20 transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-3.5 text-left min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="w-6 h-6 fill-current" />
              </div>
              <div className="min-w-0">
                <span className="block text-base sm:text-xl font-black tracking-tight leading-tight truncate">
                  Generate Smart Schedule
                </span>
                <span className="text-[11px] sm:text-xs tracking-wide font-medium text-white/80 block mt-0.5 truncate">
                  Auto-pilot maps {selectedExam?.totalLeafNodes || 'all'} topics directly into Focus
                  screen
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 pl-2">
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full whitespace-nowrap">
                1-Tap Auto-Pilot
              </span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Collapsible Power-User Preferences (Days Off & Target Date) */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs tracking-wide font-bold text-text-muted hover:text-text-main dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Target Date & Rest Days (Optional)</span>
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Date Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs tracking-wide font-bold text-text-muted dark:text-text-darkMuted block">
                      Target Exam Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  {/* Rest Days (Days Off) */}
                  <div className="space-y-1.5">
                    <label className="text-xs tracking-wide font-bold text-text-muted dark:text-text-darkMuted block">
                      Scheduled Rest Days (Days Off)
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const isOff = daysOff.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDayOff(day)}
                            className={`px-3 py-1.5 rounded-xl text-xs tracking-wide font-bold transition-all cursor-pointer ${
                              isOff
                                ? 'bg-accent text-white shadow-sm'
                                : 'bg-black/5 dark:bg-white/5 text-label-secondary hover:text-label'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}



