import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Calendar,
  BookOpen,
  Flame,
  Award,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sliders,
  Target,
  X,
  Send,
  MessageSquare,
  Activity,
  Zap,
  TrendingUp,
  PieChart,
  Layers,
  CircleAlert,
  Plus,
  Lock,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import AppleSlideOver from '../components/AppleSlideOver';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { hapticFeedback } from '../utils/haptics';

/**
 * Dedicated ClassroomCard Component
 * Displays: Total Students, Average Syllabus Completion %, Class Code Chip,
 * and Prominent "Push Syllabus Update" Button.
 * Roster is wrapped inside an ErrorBoundary with graceful offline presence indicator.
 */
function ClassroomCard({
  cls,
  onSelectStudent,
  onCopyClassCode,
  copiedClassId,
  isPushing,
  onPushSyllabus,
}) {
  const classStudents = cls.students || [];
  const avgCompletion =
    classStudents.length > 0
      ? Math.round(
          classStudents.reduce((acc, s) => acc + (s.plan?.progressPercent || 0), 0) /
            classStudents.length
        )
      : 0;

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark space-y-5 transition-all hover:border-black/10 dark:hover:border-white/10">
      {/* Classroom Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-text-main dark:text-text-darkMain tracking-tight truncate">
              {cls.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs tracking-wide text-text-muted mt-0.5">
              <span className="font-semibold text-text-main dark:text-text-darkMain">
                {cls.activeExam?.name || 'Custom Curriculum'}
              </span>
              <span>•</span>
              <span className="font-medium">
                {classStudents.length} {classStudents.length === 1 ? 'Aspirant' : 'Aspirants'}
              </span>
              <span>•</span>
              <span className="font-mono font-bold text-secondary">
                {avgCompletion}% Avg Completion
              </span>
              {cls.description && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[180px]">{cls.description}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Right Actions: Push Syllabus Update & Class Code */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-start sm:self-auto">
          {/* Prominent Push Syllabus Update Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            disabled={isPushing}
            onClick={() => onPushSyllabus(cls.classCode, cls.activeExam?._id || cls.activeExamId)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-primary text-white font-bold text-xs tracking-wide hover:bg-primary-hover shadow-apple dark:shadow-apple-dark transition-all cursor-pointer disabled:opacity-50"
            title="Push updated syllabus template to all enrolled students"
          >
            <Zap className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : 'fill-current'}`} />
            <span>{isPushing ? 'Pushing...' : 'Push Syllabus Update'}</span>
          </motion.button>

          {/* Class Code Chip with Copy and Lock */}
          <div className="flex items-center gap-1.5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 py-1.5 px-3 rounded-2xl">
            <span className="text-[11px] font-semibold text-text-muted">Code:</span>
            <span className="font-mono font-black text-xs tracking-wide text-primary tracking-widest">
              {cls.classCode}
            </span>
            <button
              type="button"
              onClick={() => onCopyClassCode(cls.classCode, cls._id)}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors cursor-pointer"
              title="Copy Class Code to Clipboard"
            >
              {copiedClassId === cls._id ? (
                <Check className="w-3.5 h-3.5 text-secondary" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <Lock
              className="w-3 h-3 text-secondary/70 shrink-0"
              title="Permanent class code (cannot be changed)"
            />
          </div>
        </div>
      </div>

      {/* Classroom Roster with ErrorBoundary */}
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => (
          <div className="py-6 px-4 text-center rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs tracking-wide text-text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
              <span>Student roster telemetry temporarily offline.</span>
            </div>
            <button
              type="button"
              onClick={resetErrorBoundary}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}
      >
        {classStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tracking-wide">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-text-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-2.5 font-bold">Aspirant</th>
                  <th className="pb-2.5 font-bold">Progress</th>
                  <th className="pb-2.5 font-bold">Today's Target</th>
                  <th className="pb-2.5 font-bold">Streak</th>
                  <th className="pb-2.5 font-bold text-right">Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {classStudents.map((student) => {
                  const plan = student.plan;
                  const percent = plan?.progressPercent || 0;
                  const isDoneToday =
                    plan && plan.todayTarget > 0 && plan.todayCompleted >= plan.todayTarget;
                  const isOnline = Boolean(
                    (plan && plan.todayCompleted > 0) ||
                    (plan && plan.streak > 0) ||
                    student.isOnline
                  );

                  return (
                    <tr
                      key={student._id}
                      onClick={() => {
                        hapticFeedback.tap();
                        onSelectStudent(student);
                      }}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-colors group"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            <div className="w-7 h-7 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-xs tracking-wide">
                              {(student.username || student.email || 'A')[0].toUpperCase()}
                            </div>
                            {/* Graceful Online / Offline Status Dot with zero layout shifting */}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-surface-dark transition-colors ${
                                isOnline ? 'bg-success' : 'bg-label-secondary/40'
                              }`}
                              title={isOnline ? 'Active' : 'Offline'}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-text-main dark:text-text-darkMain block truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                              <span className="truncate">{student.username || 'Aspirant'}</span>
                              {!isOnline && (
                                <span className="text-[10px] text-label-secondary font-normal shrink-0">
                                  • Offline
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-text-muted truncate block">
                              {student.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 min-w-[110px]">
                          <div className="w-16 bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px] text-primary">
                            {percent}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDoneToday
                              ? 'bg-secondary/15 text-secondary'
                              : 'bg-black/5 dark:bg-white/5 text-text-muted'
                          }`}
                        >
                          {plan?.todayCompleted || 0} / {plan?.todayTarget || 0} topics
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-bold text-accent flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-current text-accent" />
                          <span>{plan?.streak || 0}d</span>
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Drawer</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center bg-black/[0.015] dark:bg-white/[0.015] rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-5 space-y-1">
            <p className="text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain">
              No students enrolled in {cls.name} yet
            </p>
            <p className="text-[11px] text-text-muted">
              Share class code{' '}
              <span className="font-mono font-bold text-primary">{cls.classCode}</span> with
              students to start tracking their progress.
            </p>
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}

export default function TeacherDashboard() {
  const { user, updateUser, isTeacher } = useAuth();
  const { exams } = useApp();

  // Classrooms State
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassExamId, setNewClassExamId] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [generatedClassResult, setGeneratedClassResult] = useState(null);
  const [copiedClassId, setCopiedClassId] = useState(null);
  const [pushingClassCode, setPushingClassCode] = useState(null);

  // Cohort & Roster State
  const [teacherCode, setTeacherCode] = useState(user?.teacherCode || '');
  const [copied, setCopied] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadingCohort, setLoadingCohort] = useState(true);

  // Cohort Telemetry & Activity Feed State
  const [cohortTelemetry, setCohortTelemetry] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Slide-Over Drawer State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [drawerTab, setDrawerTab] = useState('progress'); // 'progress' | 'calibrate'
  const [studentProfile, setStudentProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Form State inside Calibrate Tab
  const [overrideTarget, setOverrideTarget] = useState(5);
  const [studentDirective, setStudentDirective] = useState('');
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [isSavingDirective, setIsSavingDirective] = useState(false);

  const fetchCohortData = async () => {
    try {
      setLoadingCohort(true);
      setLoadingClassrooms(true);
      const [studentsRes, telemetryRes, feedRes, classroomsRes] = await Promise.allSettled([
        api.getTeacherStudents(),
        api.getTeacherCohortTelemetry(),
        api.getTeacherActivityFeed(),
        api.getTeacherClassrooms(),
      ]);

      if (studentsRes.status === 'fulfilled' && studentsRes.value.success) {
        setStudents(studentsRes.value.students || []);
        if (studentsRes.value.teacherCode) setTeacherCode(studentsRes.value.teacherCode);
      }
      if (telemetryRes.status === 'fulfilled' && telemetryRes.value.success) {
        setCohortTelemetry(telemetryRes.value);
      }
      if (feedRes.status === 'fulfilled' && feedRes.value.success) {
        setActivityFeed(feedRes.value.activities || []);
      }
      if (classroomsRes.status === 'fulfilled' && classroomsRes.value.success) {
        setClassrooms(classroomsRes.value.classrooms || []);
      }
    } catch (err) {
      console.error('Error fetching cohort data:', err);
    } finally {
      setLoadingCohort(false);
      setLoadingClassrooms(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      toast.error('Please enter a classroom name.');
      return;
    }
    try {
      setIsCreatingClass(true);
      const res = await api.createTeacherClass({
        name: newClassName.trim(),
        activeExamId: newClassExamId || null,
        description: newClassDescription.trim(),
      });
      if (res.success) {
        setGeneratedClassResult(res.classroom || { classCode: res.classCode, name: newClassName });
        hapticFeedback.success();
        toast.success(`🎉 Classroom created! Class Code: ${res.classCode}`);
        const refreshed = await api.getTeacherClassrooms();
        if (refreshed.success) {
          setClassrooms(refreshed.classrooms || []);
        }
      }
    } catch (err) {
      console.error('Error creating class:', err);
      toast.error(err.response?.data?.message || 'Failed to create classroom.');
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleCopyClassCode = (code, classId) => {
    navigator.clipboard.writeText(code);
    setCopiedClassId(classId || code);
    hapticFeedback.success();
    toast.success(`Class code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedClassId(null), 2500);
  };

  const handlePushSyllabus = async (classCode, examId) => {
    try {
      setPushingClassCode(classCode);
      hapticFeedback.tap();
      const res = await api.pushSyllabusUpdate({ classCode, examId });
      hapticFeedback.success();
      toast.success(res.message || 'Syllabus update pushed to all students!', { icon: '🚀' });
      const refreshed = await api.getTeacherClassrooms();
      if (refreshed.success) {
        setClassrooms(refreshed.classrooms || []);
      }
    } catch (err) {
      console.error('Failed to push syllabus update:', err);
      toast.error(err.response?.data?.message || 'Failed to push syllabus update.');
    } finally {
      setPushingClassCode(null);
    }
  };

  useEffect(() => {
    fetchCohortData();
  }, []);

  // When a student is selected, fetch their deep profile analytics
  useEffect(() => {
    if (!selectedStudent) {
      setStudentProfile(null);
      return;
    }

    setOverrideTarget(selectedStudent.plan?.todayTarget || 5);
    setStudentDirective(selectedStudent.plan?.instructorNotes || '');
    setDrawerTab('progress');

    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await api.getTeacherStudentProfile(selectedStudent._id);
        if (res.success) {
          setStudentProfile(res);
          if (res.plan?.todayTarget) setOverrideTarget(res.plan.todayTarget);
          if (res.plan?.instructorNotes) setStudentDirective(res.plan.instructorNotes);
        }
      } catch (err) {
        console.error('Failed to load student profile analytics:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [selectedStudent]);

  // Generate Permanent Code (Cannot be changed once created)
  const handleGenerateCode = async () => {
    if (teacherCode) {
      toast('🔒 Class code is permanent and cannot be changed.', { icon: '🔒' });
      return;
    }
    try {
      setGeneratingCode(true);
      hapticFeedback.medium();
      const res = await api.generateTeacherCode();
      if (res.success && res.teacherCode) {
        setTeacherCode(res.teacherCode);
        if (user) updateUser({ ...user, teacherCode: res.teacherCode });
        toast.success(`🎉 Permanent class code created: ${res.teacherCode}`);
      }
    } catch (err) {
      console.error('Generate code error:', err);
      toast.error('Failed to generate code.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (!teacherCode) return;
    navigator.clipboard.writeText(teacherCode);
    setCopied(true);
    hapticFeedback.success();
    toast.success(`Invite code ${teacherCode} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save Target Override from Calibrate Tab
  const handleSaveTargetOverride = async () => {
    if (!selectedStudent) return;
    setIsSavingTarget(true);
    hapticFeedback.medium();

    try {
      const res = await api.updateStudentTarget(selectedStudent._id, {
        target: overrideTarget,
      });

      if (res.success) {
        hapticFeedback.success();
        toast.success(`Daily target updated to ${overrideTarget} chapters/day!`);

        setStudents((prev) =>
          prev.map((s) => {
            if (s._id === selectedStudent._id) {
              return {
                ...s,
                plan: {
                  ...s.plan,
                  todayTarget: overrideTarget,
                },
              };
            }
            return s;
          })
        );
      }
    } catch (err) {
      console.error('Failed to override target:', err);
      toast.error(err.response?.data?.message || 'Failed to update target.');
    } finally {
      setIsSavingTarget(false);
    }
  };

  // Save Directive / Note from Calibrate Tab
  const handleSaveDirective = async () => {
    if (!selectedStudent) return;
    setIsSavingDirective(true);
    hapticFeedback.medium();

    try {
      const res = await api.updateStudentTarget(selectedStudent._id, {
        notes: studentDirective,
      });

      if (res.success) {
        hapticFeedback.success();
        toast.success('Directive broadcasted to student!');
      }
    } catch (err) {
      console.error('Failed to save directive:', err);
      toast.error(err.response?.data?.message || 'Failed to save directive.');
    } finally {
      setIsSavingDirective(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pt-2 pb-24 md:pb-12">
      {/* COHORT INSIGHTS & TELEMETRY WIDGET (Class Telemetry Banner) */}
      <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-label tracking-tight">
                  Class Telemetry & Bottleneck Intelligence
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/25">
                  AI Diagnostics
                </span>
              </div>
              <p className="text-xs tracking-wide text-label-secondary">
                Real-time cohort hurdle detection. Identifies nodes where students spend significant
                time without completing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-label-secondary block">
                Cohort Health Score
              </span>
              <span className="text-lg font-black text-accent">
                {cohortTelemetry?.cohortHealthScore || 92}/100
              </span>
            </div>
            <button
              onClick={fetchCohortData}
              disabled={loadingCohort}
              className="py-2 px-3.5 rounded-xl bg-background-elevated hover:bg-black/5 dark:hover:bg-white/10 text-xs tracking-wide font-semibold text-label flex items-center gap-1.5 transition-all cursor-pointer border-[0.5px] border-border"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCohort ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Bottleneck Warning Pills */}
        <div className="pt-2">
          {cohortTelemetry?.bottlenecks && cohortTelemetry.bottlenecks.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {cohortTelemetry.bottlenecks.map((b) => (
                <div
                  key={b.topicId || b.title}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-background-elevated border-[0.5px] border-border text-label text-xs tracking-wide font-semibold shadow-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-accent shrink-0" />
                  <span>
                    <strong>{b.stuckPercentage}%</strong> of cohort stuck on:{' '}
                    <span className="underline">
                      {b.subjectName} → {b.title}
                    </span>{' '}
                    (~{b.avgMinutes}m avg)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary text-xs tracking-wide font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Cohort velocity is optimal! No critical syllabus bottlenecks detected across your
                active students.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Classroom Invite Code & Quick Stats Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark">
        <div className="space-y-1">
          <span className="text-xs tracking-wide font-bold text-text-muted dark:text-text-darkMuted uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-primary" />
            <span>Classroom Invite Code</span>
          </span>
          <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
            Share this with students so they can join your managed cohort during registration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-2.5 text-center">
            <span className="text-xl font-mono font-black text-primary tracking-widest">
              {teacherCode || '------'}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            disabled={!teacherCode}
            className="p-3 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all cursor-pointer disabled:opacity-50"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
          </button>

          {teacherCode ? (
            <div
              className="px-3.5 py-2.5 rounded-2xl bg-secondary/10 text-secondary border border-secondary/20 flex items-center gap-1.5 text-xs tracking-wide font-bold"
              title="Class code is permanent and cannot be changed once created"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Permanent</span>
            </div>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={generatingCode}
              className="px-4 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs tracking-wide hover:bg-primary-hover transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Create Permanent Code"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{generatingCode ? 'Generating...' : 'Create Code'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: CLASSROOMS GRID (LEFT) + REAL-TIME ACTIVITY FEED (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Classrooms & Roster Grid (Desktop: lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-text-main dark:text-text-darkMain tracking-tight flex items-center gap-2.5">
                <span>Classrooms & Cohorts</span>
                <span className="text-xs tracking-wide font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {classrooms.length} {classrooms.length === 1 ? 'Class' : 'Classes'}
                </span>
              </h2>
              <p className="text-xs tracking-wide text-text-muted mt-0.5">
                Manage your student batches, target curricula, and live student progress
              </p>
            </div>

            {/* Create Class Button */}
            <button
              onClick={() => {
                hapticFeedback.tap();
                setGeneratedClassResult(null);
                setNewClassName('');
                setNewClassDescription('');
                setNewClassExamId(exams?.[0]?._id || '');
                setIsCreateClassModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs tracking-wide flex items-center gap-2 hover:bg-primary-hover shadow-apple dark:shadow-apple-dark transition-all cursor-pointer self-start sm:self-auto group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>Create Class</span>
            </button>
          </div>

          {loadingClassrooms ? (
            <div className="py-16 text-center text-text-muted space-y-2">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs tracking-wide font-semibold">Loading classrooms...</p>
            </div>
          ) : classrooms.length === 0 ? (
            <div className="py-16 text-center bg-surface-light dark:bg-surface-dark border border-dashed border-black/10 dark:border-white/10 rounded-3xl p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-main dark:text-text-darkMain">
                  No classrooms created yet
                </h3>
                <p className="text-xs tracking-wide text-text-muted max-w-md mx-auto">
                  Organize your students into classrooms. Each class generates a unique 6-character
                  code that students can use to join instantly.
                </p>
              </div>
              <button
                onClick={() => {
                  setGeneratedClassResult(null);
                  setNewClassName('');
                  setNewClassDescription('');
                  setNewClassExamId(exams?.[0]?._id || '');
                  setIsCreateClassModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs tracking-wide hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
              >
                Create First Classroom
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {classrooms.map((cls) => (
                <ClassroomCard
                  key={cls._id}
                  cls={cls}
                  onSelectStudent={setSelectedStudent}
                  onCopyClassCode={handleCopyClassCode}
                  copiedClassId={copiedClassId}
                  isPushing={pushingClassCode === cls.classCode}
                  onPushSyllabus={handlePushSyllabus}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Real-Time Cohort Activity Feed Widget with ErrorBoundary */}
        <div className="lg:col-span-4 bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark space-y-4 sticky top-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black text-text-main dark:text-text-darkMain tracking-tight">
                Live Cohort Activity
              </h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
          <p className="text-[11px] text-text-muted">
            Instant event stream of focus sessions and chapter completions.
          </p>

          <ErrorBoundary
            fallbackRender={({ resetErrorBoundary }) => (
              <div className="py-10 text-center text-text-muted text-xs tracking-wide space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span>Activity stream temporarily offline.</span>
                </div>
                <button
                  type="button"
                  onClick={resetErrorBoundary}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            )}
          >
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {activityFeed.length === 0 ? (
                <div className="py-12 text-center text-text-muted text-xs tracking-wide">
                  No recent activity logged by cohort students today.
                </div>
              ) : (
                <AnimatePresence>
                  {activityFeed.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                      className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-xs tracking-wide space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-main dark:text-text-darkMain truncate max-w-[160px]">
                          {event.studentName}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">{event.date}</span>
                      </div>
                      <p className="text-[11px] text-text-muted dark:text-text-darkMuted leading-tight">
                        {event.title}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ErrorBoundary>
        </div>
      </div>

      {/* UPGRADED APPLE SPATIAL SLIDE-OVER DRAWER WITH SEGMENTED TABS */}
      <AppleSlideOver
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.username || 'Aspirant'}
        subtitle={selectedStudent?.email}
        maxWidth="max-w-xl"
        headerExtra={
          selectedStudent ? (
            <div className="w-8 h-8 rounded-xl bg-[#E5E5EA] dark:bg-[#38383A] text-label flex items-center justify-center font-medium text-xs tracking-wide border-[0.5px] border-border">
              {(selectedStudent.username || 'A')[0].toUpperCase()}
            </div>
          ) : null
        }
        footer={
          <button
            type="button"
            onClick={() => setSelectedStudent(null)}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-muted hover:text-text-main dark:hover:text-white text-xs tracking-wide font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        }
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* APPLE-STYLE SEGMENTED CONTROL: PROGRESS vs CALIBRATE */}
            <div className="flex items-center p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.tap();
                  setDrawerTab('progress');
                }}
                className={`flex-1 py-2 rounded-xl text-xs tracking-wide font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  drawerTab === 'progress'
                    ? 'bg-white dark:bg-white/15 text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Progress Tracker</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticFeedback.tap();
                  setDrawerTab('calibrate');
                }}
                className={`flex-1 py-2 rounded-xl text-xs tracking-wide font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  drawerTab === 'calibrate'
                    ? 'bg-white dark:bg-white/15 text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Calibrate Goals</span>
              </button>
            </div>

            {/* TAB 1: PROGRESS (The Tracker) */}
            {drawerTab === 'progress' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* STAT PILLS: 3 Sleek Glassmorphic Metric Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-3.5 text-center space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-accent flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3 fill-current text-accent" />
                      <span>Streak</span>
                    </span>
                    <span className="text-xl font-black text-text-main dark:text-text-darkMain block">
                      {studentProfile?.currentStreak || selectedStudent.plan?.streak || 0}d
                    </span>
                    <span className="text-[9px] text-text-muted block">Consecutive</span>
                  </div>

                  <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-3.5 text-center space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-secondary flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Avg Focus</span>
                    </span>
                    <span className="text-xl font-black text-text-main dark:text-text-darkMain block">
                      {studentProfile?.averageFocusTime || 0}m
                    </span>
                    <span className="text-[9px] text-text-muted block">Per Study Day</span>
                  </div>

                  <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-3.5 text-center space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-primary flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>Avg Topics</span>
                    </span>
                    <span className="text-xl font-black text-text-main dark:text-text-darkMain block">
                      {studentProfile?.averageVelocity || 0}
                    </span>
                    <span className="text-[9px] text-text-muted block">Chapters/Day</span>
                  </div>
                </div>

                {/* DUAL-AXIS LINE / BAR CHART: Topics Completed (Bar) vs Minutes Focused (Line) */}
                <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs tracking-wide font-black uppercase tracking-wider text-text-main dark:text-text-darkMain">
                        Velocity vs Focus Audit (Last 7 Days)
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        Detects skimming without focus, or stalling on chapters for hours.
                      </p>
                    </div>
                  </div>

                  <div className="h-56 w-full pt-1">
                    {loadingProfile ? (
                      <div className="h-full flex items-center justify-center text-text-muted">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={studentProfile?.last7Days || []}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            yAxisId="left"
                            stroke="#888888"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#888888"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '0.75rem',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                          {/* Bar: Topics Completed */}
                          <Bar
                            yAxisId="left"
                            dataKey="topicsCompleted"
                            name="Topics Completed"
                            fill="#007AFF"
                            radius={[4, 4, 0, 0]}
                          />
                          {/* Line: Minutes Focused */}
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="timeStudiedMinutes"
                            name="Minutes Focused"
                            stroke="#F59E0B"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* SUBJECT RADAR CHART (Subject Distribution) */}
                {studentProfile?.distribution && studentProfile.distribution.length > 0 && (
                  <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs tracking-wide font-black uppercase tracking-wider text-text-main dark:text-text-darkMain">
                        Subject Effort Allocation
                      </h4>
                      <span className="text-[10px] text-text-muted">Spot neglected subjects</span>
                    </div>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={studentProfile.distribution}>
                          <PolarGrid stroke="#888888" strokeOpacity={0.2} />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#888888', fontSize: 10, fontWeight: 700 }}
                          />
                          <PolarRadiusAxis stroke="#888888" strokeOpacity={0.2} />
                          <Radar
                            name="Minutes Spent"
                            dataKey="minutes"
                            stroke="#007AFF"
                            fill="#007AFF"
                            fillOpacity={0.35}
                          />
                          <Radar
                            name="Completed"
                            dataKey="completed"
                            stroke="#4ECDC4"
                            fill="#4ECDC4"
                            fillOpacity={0.25}
                          />
                          <RechartsTooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* SYLLABUS SNAPSHOT: Condensed Read-Only Syllabus Tree */}
                <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs tracking-wide font-black uppercase tracking-wider text-text-main dark:text-text-darkMain">
                      Curriculum Completion Snapshot
                    </h4>
                    <span className="text-[10px] text-text-muted">
                      {studentProfile?.plan?.completedTopics ||
                        selectedStudent.plan?.completedTopics ||
                        0}{' '}
                      completed
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {studentProfile?.plan?.examId?.subjects ? (
                      studentProfile.plan.examId.subjects.map((subj) => {
                        const completedSet = new Set(
                          studentProfile.plan?.completedChapterIds || []
                        );
                        return (
                          <div key={subj.name} className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                              {subj.name}
                            </span>
                            <div className="space-y-1 pl-1">
                              {(subj.chapters || []).map((ch) => {
                                const isDone = completedSet.has(ch.id);
                                return (
                                  <div
                                    key={ch.id || ch.title}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs tracking-wide transition-colors ${
                                      isDone
                                        ? 'bg-success/15 text-success font-semibold'
                                        : 'bg-black/5 dark:bg-white/5 text-text-muted'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                                          isDone
                                            ? 'bg-success text-white'
                                            : 'border border-black/20 dark:border-white/20'
                                        }`}
                                      >
                                        {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                      </div>
                                      <span className="truncate max-w-[280px]">{ch.title}</span>
                                    </div>
                                    <span className="text-[10px] font-mono opacity-60">
                                      {isDone ? 'Done' : 'Pending'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs tracking-wide text-text-muted">
                        Loading curriculum snapshot...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: CALIBRATE (Target Sliders & Directives) */}
            {drawerTab === 'calibrate' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* DAILY TARGET OVERRIDE SLIDER */}
                <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs tracking-wide font-black text-text-main dark:text-text-darkMain uppercase tracking-wider">
                        Daily Target Override
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        Manually override the adaptive target for this student.
                      </p>
                    </div>
                    <span className="text-sm font-mono font-black text-primary bg-primary/10 px-2.5 py-1 rounded-xl">
                      {overrideTarget} ch/day
                    </span>
                  </div>

                  {/* Slider Control */}
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={overrideTarget}
                    onChange={(e) => setOverrideTarget(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-text-muted font-mono">
                    <span>1 ch</span>
                    <span>12 ch</span>
                    <span>25 ch</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveTargetOverride}
                    disabled={isSavingTarget}
                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-[#ff5252] text-white text-xs tracking-wide font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingTarget ? 'Saving Target...' : 'Save Target Override'}
                  </button>
                </div>

                {/* PERSONALIZED DIRECTIVES & NOTES */}
                <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-5 space-y-3">
                  <div>
                    <h4 className="text-xs tracking-wide font-black text-text-main dark:text-text-darkMain uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <span>Individual Guidance & Directives</span>
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      Personal directives pinned directly to this student's Focus dashboard.
                    </p>
                  </div>

                  <textarea
                    rows={3}
                    value={studentDirective}
                    onChange={(e) => setStudentDirective(e.target.value)}
                    placeholder="e.g. Focus on Organic Chemistry reaction mechanisms before proceeding."
                    className="w-full bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl p-3 text-xs tracking-wide text-text-main dark:text-text-darkMain focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  />

                  <button
                    type="button"
                    onClick={handleSaveDirective}
                    disabled={isSavingDirective}
                    className="w-full py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-text-main dark:text-text-darkMain border border-black/10 dark:border-white/10 text-xs tracking-wide font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingDirective ? 'Saving...' : 'Post Directive to Student'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AppleSlideOver>

      {/* GLASSMORPHIC CREATE CLASSROOM MODAL */}
      <AnimatePresence>
        {isCreateClassModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-background-elevated backdrop-blur-2xl border-[0.5px] border-border rounded-3xl p-6 shadow-sm space-y-5"
            >
              {generatedClassResult ? (
                /* Success State with Generated Code */
                <div className="text-center space-y-4 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-text-main dark:text-text-darkMain">
                      Classroom Created!
                    </h3>
                    <p className="text-xs tracking-wide text-text-muted mt-1">
                      Share this code with students to join{' '}
                      <span className="font-bold text-text-main dark:text-text-darkMain">
                        {generatedClassResult.name}
                      </span>
                      . This class code is permanent and will not change:
                    </p>
                  </div>

                  <div className="bg-black/5 dark:bg-white/5 border border-primary/30 p-4 rounded-2xl flex items-center justify-between gap-3 group">
                    <span className="font-mono font-black text-2xl tracking-tight tracking-widest text-primary">
                      {generatedClassResult.classCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyClassCode(generatedClassResult.classCode, 'new')}
                      className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs tracking-wide flex items-center gap-1.5 hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
                    >
                      {copiedClassId === 'new' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy to Clipboard</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateClassModalOpen(false);
                        setGeneratedClassResult(null);
                      }}
                      className="w-full py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-main dark:text-text-darkMain font-bold text-xs tracking-wide transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-text-main dark:text-text-darkMain">
                        Create New Classroom
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateClassModalOpen(false)}
                      className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain mb-1">
                        Class Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., GATE CS 2027 Morning Batch"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="w-full text-xs tracking-wide font-semibold px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 focus:border-primary outline-none text-text-main dark:text-text-darkMain"
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain mb-1">
                        Target Exam Curriculum
                      </label>
                      <select
                        value={newClassExamId}
                        onChange={(e) => setNewClassExamId(e.target.value)}
                        className="w-full text-xs tracking-wide font-medium px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 focus:border-primary outline-none text-text-main dark:text-text-darkMain"
                      >
                        <option value="">Select an exam template (optional)</option>
                        {(exams || []).map((exam) => (
                          <option key={exam._id} value={exam._id}>
                            {exam.name} ({exam.totalChapters || 0} chapters)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain mb-1">
                        Description / Cohort Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g., Target GATE 2027 with rigorous Spaced Repetition cadence."
                        value={newClassDescription}
                        onChange={(e) => setNewClassDescription(e.target.value)}
                        className="w-full text-xs tracking-wide font-medium px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 focus:border-primary outline-none text-text-main dark:text-text-darkMain resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateClassModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-main text-xs tracking-wide font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingClass || !newClassName.trim()}
                      className="px-5 py-2 rounded-xl bg-primary text-white text-xs tracking-wide font-bold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {isCreatingClass ? 'Generating Class...' : 'Create Class'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


