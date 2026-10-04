import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Send,
  BookOpen,
  Calendar,
  CheckCircle2,
  Sparkles,
  Sliders,
  ShieldCheck,
  Target,
  FileText,
  AlertCircle,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import SyllabusBuilder from './SyllabusBuilder';
import { hapticFeedback } from '../utils/haptics';

export default function TeacherMasterPlan() {
  const { user, isTeacher } = useAuth();
  const { exams, fetchDashboard } = useApp();

  const [selectedExamId, setSelectedExamId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [studyDays, setStudyDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [instructorNotes, setInstructorNotes] = useState(user?.cohortNotes || '');
  const [assigningPlan, setAssigningPlan] = useState(false);
  const [cohortStats, setCohortStats] = useState(null);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0]._id);
    }
  }, [exams, selectedExamId]);

  useEffect(() => {
    if (!targetDate) {
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      setTargetDate(future.toISOString().split('T')[0]);
    }
  }, [targetDate]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.getTeacherOverview();
        if (res.success) {
          setCohortStats(res);
        }
      } catch (err) {
        console.error('Failed to load overview:', err);
      }
    };
    fetchOverview();
  }, []);

  const toggleDay = (day) => {
    hapticFeedback.tap();
    setStudyDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) {
          toast.error('At least one study day required');
          return prev;
        }
        return prev.filter((d) => d !== day);
      }
      return [...prev, day];
    });
  };

  const handleAssignMasterPlan = async (e) => {
    e.preventDefault();
    if (!selectedExamId || !targetDate) {
      toast.error('Please choose both exam and target date');
      return;
    }

    setAssigningPlan(true);
    hapticFeedback.medium();

    try {
      const res = await api.assignTeacherPlan({
        examId: selectedExamId,
        targetDate,
        studyDays,
        instructorNotes,
      });

      if (res.success) {
        hapticFeedback.success();
        toast.success(res.message || '🎉 Master plan assigned to cohort!');
        await fetchDashboard();
      } else {
        toast.error(res.message || 'Failed to assign plan');
      }
    } catch (err) {
      console.error('Assign master plan error:', err);
      toast.error(err.response?.data?.message || 'Failed to assign plan');
    } finally {
      setAssigningPlan(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pt-2 pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-sm">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl tracking-tight font-black text-text-main dark:text-text-darkMain tracking-tight">
                Cohort Master Plan
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                Curriculum Standard
              </span>
            </div>
            <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted pt-0.5">
              Distribute standardized curriculum milestones to your entire student cohort in one
              batch.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsBuilderModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-text-main dark:text-text-darkMain border border-black/10 dark:border-white/10 text-xs tracking-wide font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <Sliders className="w-4 h-4 text-primary" />
          <span>Curriculum Studio</span>
        </button>
      </div>

      {/* Cohort Sync Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-5 shadow-apple dark:shadow-apple-dark">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block">
            Enrolled Aspirants
          </span>
          <span className="text-3xl tracking-tight font-black text-text-main dark:text-text-darkMain tracking-tight mt-1 block">
            {cohortStats?.totalStudents || 0}
          </span>
          <span className="text-[11px] text-text-muted pt-1 block">Linked managed students</span>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-5 shadow-apple dark:shadow-apple-dark">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block">
            Active Study Plans
          </span>
          <span className="text-3xl tracking-tight font-black text-primary tracking-tight mt-1 block">
            {cohortStats?.activePlansCount || 0}
          </span>
          <span className="text-[11px] text-text-muted pt-1 block">Synchronized cohort plans</span>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-5 shadow-apple dark:shadow-apple-dark">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block">
            Lockout Guard
          </span>
          <span className="text-lg font-black text-secondary tracking-tight mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5" />
            <span>Enforced</span>
          </span>
          <span className="text-[11px] text-text-muted pt-1 block">Prevents student tampering</span>
        </div>
      </div>

      {/* Master Plan Push Form */}
      <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-apple dark:shadow-apple-dark space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black text-text-main dark:text-text-darkMain tracking-tight">
              Batch Push Standardized Plan
            </h2>
          </div>
          <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
            Pushing this master plan will set the target exam, exam date, and weekly study schedule
            for all linked students.
          </p>
        </div>

        <form onSubmit={handleAssignMasterPlan} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Exam Selector */}
            <div className="space-y-1.5">
              <label className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain uppercase tracking-wider block">
                Target Exam Curriculum
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer"
                >
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.name} ({exam.totalTopics || exam.totalChapters || 0} chapters)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Date */}
            <div className="space-y-1.5">
              <label className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain uppercase tracking-wider block">
                Target Exam Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={targetDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Study Days Selector */}
          <div className="space-y-2">
            <label className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain uppercase tracking-wider block">
              Cohort Study Days ({studyDays.length} days / week)
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => {
                const isSelected = studyDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-2 px-4 rounded-xl text-xs tracking-wide font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Broadcast Directives / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain uppercase tracking-wider block">
              Cohort Guidance & Directives
            </label>
            <textarea
              rows={3}
              value={instructorNotes}
              onChange={(e) => setInstructorNotes(e.target.value)}
              placeholder="e.g., Focus on Modern History chapters first. Complete Mock Test 3 by Friday."
              className="w-full bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-2xl p-4 text-xs tracking-wide font-medium text-text-main dark:text-text-darkMain focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={assigningPlan}
              className="py-4 px-8 bg-accent hover:opacity-90 active:scale-95 text-white font-black text-xs tracking-wide rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {assigningPlan ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Push Master Plan to Cohort</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Curriculum Studio Modal */}
      <AnimatePresence>
        {isBuilderModalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
              className="w-full h-[92vh] bg-background-elevated border-t border-[0.5px] border-border rounded-t-3xl shadow-sm flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <SyllabusBuilder isModal={true} onClose={() => setIsBuilderModalOpen(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


