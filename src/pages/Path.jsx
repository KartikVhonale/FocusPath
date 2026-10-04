import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Lock,
  Sliders,
  Sparkles,
  BookOpen,
  TrendingUp,
  PieChart,
  Activity,
  Download,
  Clock,
} from 'lucide-react';
import { TrendsAreaChart, DistributionRadarChart } from '../components/AnalyticsCharts';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTimeline, useTrends, useDistribution } from '../hooks/useHistory';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { exportStudyDataToCsv } from '../utils/exportCsv';
import StreakCalendar from '../components/StreakCalendar';
import StudyStreakHeatmap from '../components/StudyStreakHeatmap';
import TimelineFeedSheet from '../components/TimelineFeedSheet';
import CohortLeaderboard from '../components/CohortLeaderboard';
import EditableTree from '../components/EditableTree';
import SyllabusBuilder from './SyllabusBuilder';
import HistoryTimeline from '../components/HistoryTimeline';
import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import Tooltip from '../components/Tooltip';
import AppleSlideOver from '../components/AppleSlideOver';
import { Panel, PanelGroup, PanelResizeHandle } from '../components/ResizablePanels';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { hapticFeedback } from '../utils/haptics';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useCanvasScroll } from '../hooks/useCanvasScroll';
import { useDrag } from '@use-gesture/react';

export default function Path() {
  const isMobile = useIsMobile();
  const { scrollY } = useCanvasScroll(35);
  const [mobileSection, setMobileSection] = useState('analytics'); // 'analytics' | 'syllabus'
  const { dashboardData, activeExam, toggleChapter, fetchDashboard } = useApp();
  const { user, isTeacher, isManagedStudent, isLockedByTeacher, teacherName } = useAuth();
  const isLocked = isManagedStudent || isLockedByTeacher;

  // Tab State: 'timeline' | 'trend' | 'distribution'
  const [activeTab, setActiveTab] = useState('timeline');
  const [timelineViewMode, setTimelineViewMode] = useState('heatmap'); // 'heatmap' | 'month'
  const [isTimelineFeedOpen, setIsTimelineFeedOpen] = useState(false);

  // Centralized Hooks: Fetch Trends, Timeline, and Distribution Reports
  const { data: trendsRes, isLoading: loadingTrends } = useTrends();
  const trendsData = trendsRes?.trends || [];

  const { data: timelineRes, isLoading: loadingTimeline } = useTimeline(30);
  const timelineData = timelineRes?.timeline || [];

  const { data: distributionRes, isLoading: loadingDistribution } = useDistribution();
  const distributionData = useMemo(() => {
    return (distributionRes?.distribution || []).map((d) => ({
      ...d,
      subjectName: d.subjectName || d.subject || 'Subject',
      timeSpentMinutes: d.timeSpentMinutes ?? d.minutes ?? 0,
    }));
  }, [distributionRes?.distribution]);

  // Search & Filter state
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubjectFilter, setActiveSubjectFilter] = useState('ALL');
  // Sync search query from URL parameter (e.g. from Spotlight search)
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Slide-up Full-Screen Glass Modal for Syllabus Builder
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Mobile Edge Swipe-to-Go-Back: Swiping right from the left screen edge pops back to 'ALL' subjects
  const bindBackGesture = useDrag(
    ({ down, movement: [mx, my], initial: [ix] }) => {
      if (!isMobile || activeSubjectFilter === 'ALL' || ix > 75) return;
      if (!down && mx > 70 && Math.abs(my) < 80) {
        hapticFeedback.light();
        setActiveSubjectFilter('ALL');
        toast('Returned to All Subjects', { icon: '◀️', id: 'back-to-all' });
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      enabled: isMobile && activeSubjectFilter !== 'ALL',
    }
  );

  const completedIds = useMemo(() => {
    return dashboardData?.completedChapterIds || [];
  }, [dashboardData?.completedChapterIds]);

  // Subtopic Completion & SRS Toggle (Level 4 Leaf Node)
  const handleToggleSubtopic = async (item, willBeCompleted) => {
    hapticFeedback.success();
    try {
      await api.toggleNodeSRS({
        studyPlanId: dashboardData?.studyPlanId,
        nodeId: item.id,
        isCompleted: willBeCompleted,
        action: 'complete',
      });
      // Synchronize AppContext state & daily increment
      toggleChapter(item.id, willBeCompleted);
      toast.success(
        willBeCompleted
          ? `✅ Completed "${item.title}"! Next review scheduled.`
          : `↩️ Reverted "${item.title}"`
      );
    } catch (err) {
      console.error('Failed to toggle subtopic:', err);
      toast.error('Failed to sync progress with server');
    }
  };

  // Snooze Subtopic (Level 4 Leaf Node via Swipe Left)
  const handleSnoozeSubtopic = async (item) => {
    hapticFeedback.medium();
    try {
      await api.toggleNodeSRS({
        studyPlanId: dashboardData?.studyPlanId,
        nodeId: item.id,
        action: 'snooze',
      });
      toast(`⏰ Snoozed "${item.title}" to tomorrow`, { icon: '⏰' });
    } catch (err) {
      console.error('Failed to snooze subtopic:', err);
      toast.error('Failed to snooze subtopic');
    }
  };

  // 4-Level Deep Filtering (Subject -> Chapter -> Topic -> Subtopic)
  const displayedSubjects = useMemo(() => {
    if (!activeExam?.subjects) return [];
    let list = activeExam.subjects.map((s, idx) => ({ ...s, originalIndex: idx }));

    if (activeSubjectFilter !== 'ALL') {
      list = list.filter((_, idx) => idx.toString() === activeSubjectFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list
        .map((s) => {
          const sName = s.subjectName || s.name || '';
          const filteredChapters = (s.chapters || [])
            .map((c) => {
              const cName = c.chapterName || c.title || '';
              // If chapter has topics, filter them
              if (Array.isArray(c.topics) && c.topics.length > 0) {
                const filteredTopics = c.topics
                  .map((t) => {
                    const topTitle = t.title || '';
                    const filteredSubtopics = (t.subtopics || []).filter((st) =>
                      st.title?.toLowerCase().includes(q)
                    );
                    if (
                      filteredSubtopics.length > 0 ||
                      topTitle.toLowerCase().includes(q) ||
                      cName.toLowerCase().includes(q) ||
                      sName.toLowerCase().includes(q)
                    ) {
                      return {
                        ...t,
                        subtopics: filteredSubtopics.length > 0 ? filteredSubtopics : t.subtopics,
                      };
                    }
                    return null;
                  })
                  .filter(Boolean);

                if (
                  filteredTopics.length > 0 ||
                  cName.toLowerCase().includes(q) ||
                  sName.toLowerCase().includes(q)
                ) {
                  return {
                    ...c,
                    topics: filteredTopics.length > 0 ? filteredTopics : c.topics,
                  };
                }
                return null;
              } else {
                // Chapter-level fallback
                if (cName.toLowerCase().includes(q) || sName.toLowerCase().includes(q)) {
                  return c;
                }
                return null;
              }
            })
            .filter(Boolean);

          return {
            ...s,
            chapters: filteredChapters,
          };
        })
        .filter((s) => (s.chapters || []).length > 0);
    }

    return list;
  }, [activeExam?.subjects, activeSubjectFilter, searchQuery]);

  if (!dashboardData || !activeExam) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-apple dark:shadow-apple-dark">
          <Compass className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl tracking-tight font-black text-text-main dark:text-text-darkMain">
            No Exam Plan Configured
          </h2>
          <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted max-w-sm mx-auto">
            Set up your study plan to explore your exam's syllabus tree, check off chapters, and
            view your analytics.
          </p>
        </div>
        <Link
          to="/setup"
          onClick={() => hapticFeedback.tap()}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-accent hover:opacity-90 active:scale-95 text-white font-bold text-xs tracking-wide rounded-2xl shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Configure Exam Plan</span>
        </Link>
      </div>
    );
  }

  const totalTopics = dashboardData.totalTopics || activeExam.totalChapters || 0;
  const totalCompleted = completedIds.length;
  const overallPercent = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;
  const canEditPlan = !isLocked || isTeacher;

  return (
    <div
      {...bindBackGesture()}
      className="w-full max-w-7xl mx-auto space-y-8 pt-2 pb-24 md:pb-12 touch-pan-y"
    >
      {/* ========================================================================= */}
      {/* iOS LARGE TITLE (Mobile < 768px)                                          */}
      {/* ========================================================================= */}
      <div className="block md:hidden mt-2 mb-2">
        <motion.h1
          style={{
            opacity: Math.max(0, 1 - scrollY / 50),
            y: -Math.min(15, scrollY * 0.25),
          }}
          className="text-4xl tracking-tight font-extrabold tracking-tight text-text-main dark:text-text-darkMain"
        >
          Path
        </motion.h1>
      </div>

      {/* Managed Student Lock Banner */}
      {isLocked && (
        <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black/5 dark:bg-white/10 text-label flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs tracking-wide font-bold text-label block">
                🔒 Syllabus Managed by Instructor
              </span>
              <span className="text-[11px] text-label-secondary">
                {teacherName
                  ? `Instructor ${teacherName} has standardized your curriculum.`
                  : 'Curriculum locked by class instructor.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Only Apple-Style Segmented Control: [ Analytics ] | [ Syllabus ] */}
      {isMobile && (
        <div className="flex items-center p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              hapticFeedback.tap();
              setMobileSection('analytics');
            }}
            className={`flex-1 min-h-[44px] py-2 px-4 rounded-xl text-xs tracking-wide font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              mobileSection === 'analytics'
                ? 'bg-background-elevated text-label shadow-sm border-[0.5px] border-border'
                : 'text-label-secondary hover:text-label'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticFeedback.tap();
              setMobileSection('syllabus');
            }}
            className={`flex-1 min-h-[44px] py-2 px-4 rounded-xl text-xs tracking-wide font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              mobileSection === 'syllabus'
                ? 'bg-background-elevated text-label shadow-sm border-[0.5px] border-border'
                : 'text-label-secondary hover:text-label'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Syllabus</span>
          </button>
        </div>
      )}

      {/* TOP SECTION: APPLE BENTO BOX ANALYTICS */}
        {(!isMobile || mobileSection === 'analytics') && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
                  Telemetry & Velocity
                </span>
                <span className="text-xs tracking-wide text-label-secondary">? Apple Health Analytics</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.medium();
                  exportStudyDataToCsv(dashboardData?.dailyLogs, activeExam?.name);
                }}
                className="px-3 py-1.5 rounded-xl text-xs tracking-wide font-semibold border-[0.5px] border-border bg-background-elevated hover:opacity-90 active:scale-95 text-label flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* THE BENTO BOX GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* TOP SPANNING BOX: HEATMAP */}
              <div className="lg:col-span-2 bg-background-elevated rounded-3xl border-[0.5px] border-border shadow-sm p-5 overflow-hidden">
                <StudyStreakHeatmap
                  heatmapData={dashboardData?.heatmapData || []}
                  streak={dashboardData?.streak || 0}
                  loading={!dashboardData}
                />
              </div>

              {/* BOTTOM LEFT: RADAR CHART */}
              <div className="bg-background-elevated rounded-3xl border-[0.5px] border-border shadow-sm p-5 aspect-square flex flex-col">
                <h3 className="text-sm font-bold text-label mb-2">Target vs. Actual</h3>
                <div className="flex-1 min-h-0">
                  <DistributionRadarChart data={distributionData} loading={loadingDistribution} />
                </div>
              </div>

              {/* BOTTOM RIGHT: TIMELINE FEED */}
              <div className="bg-background-elevated rounded-3xl border-[0.5px] border-border shadow-sm p-0 flex flex-col h-full max-h-[500px] overflow-hidden">
                <div className="p-5 pb-2 border-b-[0.5px] border-border sticky top-0 bg-background-elevated z-10">
                  <h3 className="text-sm font-bold text-label">Timeline Feed</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-5 pt-2">
                  <HistoryTimeline timeline={timelineData} isLoading={loadingTimeline} />
                </div>
              </div>
            </div>

            {/* PART 3: COHORT LEADERBOARD - Mount directly below analytics area conditionally */}
          {(user?.accountMode === 'managed' || isManagedStudent) && (
            <div className="mt-4">
              <WidgetErrorBoundary title="Cohort Leaderboard">
                <CohortLeaderboard />
              </WidgetErrorBoundary>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM SECTION: SYLLABUS TREE */}
      {(!isMobile || mobileSection === 'syllabus') && (
        <div className="space-y-6">
          {/* Header with Title and "Edit Plan" Glass Modal Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent md:bg-surface-light dark:bg-transparent md:dark:bg-surface-dark border-0 md:border border-black/5 dark:border-white/5 rounded-none md:rounded-3xl p-1 md:p-6 shadow-none md:shadow-apple dark:shadow-apple-dark">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black text-text-main dark:text-text-darkMain tracking-tight">
                  {activeExam.name} Syllabus Path
                </h2>
              </div>
              <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
                {totalCompleted} of {totalTopics} chapters finished ({overallPercent}% total
                curriculum mastered)
              </p>
            </div>

            {/* Hidden Complexity: Single "Edit Plan" button opens full-screen slide-up glass modal */}
            {canEditPlan ? (
              <Tooltip content="Launch full visual builder to scrape URLs, parse text, or edit tree">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback.medium();
                    setIsEditModalOpen(true);
                  }}
                  className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-text-main dark:text-text-darkMain border border-black/10 dark:border-white/10 text-xs tracking-wide font-bold transition-all active:scale-95 cursor-pointer shadow-sm min-h-[44px]"
                >
                  <Sliders className="w-4 h-4 text-primary" />
                  <span>Edit Plan</span>
                </button>
              </Tooltip>
            ) : (
              <span className="text-[11px] font-bold text-text-muted dark:text-text-darkMuted flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl min-h-[44px]">
                <Lock className="w-3.5 h-3.5" />
                <span>Curriculum Locked</span>
              </span>
            )}
          </div>

          {/* SYLLABUS EXPLORER */}
          {displayedSubjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={searchQuery ? `No topics matching "${searchQuery}"` : 'No subjects available'}
              description="Try clearing your search query or choose 'All Subjects' to see your complete curriculum."
              actionText="Clear Search"
              onAction={() => {
                setSearchQuery('');
                setActiveSubjectFilter('ALL');
              }}
              badge="Search Empty"
            />
          ) : (
            <>
              {/* Desktop Draggable Resizable Split Pane (react-resizable-panels) */}
              <div className="hidden lg:block w-full">
                <PanelGroup
                  direction="horizontal"
                  className="min-h-[620px] w-full items-start gap-1"
                >
                  {/* Left Panel: Subject Directory & Search */}
                  <Panel defaultSize={34} minSize={25} maxSize={50} className="pr-3 space-y-3.5">
                    {/* Search Box */}
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chapters & subtopics..."
                        className="w-full bg-surface-light dark:bg-surface-dark border border-black/10 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs tracking-wide font-medium text-text-main dark:text-text-darkMain focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm"
                      />
                    </div>

                    {/* Subject Directory Cards */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-4 shadow-apple dark:shadow-apple-dark space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                          Subject Directory
                        </span>
                        <span className="text-[10px] font-bold text-primary">
                          {(activeExam.subjects || []).length} Subjects
                        </span>
                      </div>

                      {/* "All Subjects" Item */}
                      <button
                        type="button"
                        onClick={() => {
                          hapticFeedback.tap();
                          setActiveSubjectFilter('ALL');
                        }}
                        className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                          activeSubjectFilter === 'ALL'
                            ? 'bg-primary text-white shadow-apple shadow-primary/20'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-main dark:text-text-darkMain'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs tracking-wide font-bold block">All Subjects</span>
                          <span
                            className={`text-[10px] block ${
                              activeSubjectFilter === 'ALL' ? 'text-white/80' : 'text-text-muted'
                            }`}
                          >
                            Complete 4-level exam hierarchy
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeSubjectFilter === 'ALL'
                              ? 'bg-white/20 text-white'
                              : 'bg-black/5 dark:bg-white/5 text-text-muted'
                          }`}
                        >
                          {totalCompleted}/{totalTopics}
                        </span>
                      </button>

                      {/* Individual Subjects */}
                      <div className="space-y-1.5 max-h-[460px] overflow-y-auto scrollbar-none pr-0.5">
                        {(activeExam.subjects || []).map((sub, idx) => {
                          const sName = sub.subjectName || sub.name || `Subject ${idx + 1}`;
                          const isSelected = activeSubjectFilter === idx.toString();
                          const chapters = sub.chapters || [];
                          let subLeafCount = 0;
                          chapters.forEach((ch) => {
                            (ch.topics || []).forEach((top) => {
                              subLeafCount += (top.subtopics || []).length || 1;
                            });
                          });

                          return (
                            <button
                              key={sName + idx}
                              type="button"
                              onClick={() => {
                                hapticFeedback.tap();
                                setActiveSubjectFilter(idx.toString());
                              }}
                              className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-primary text-white shadow-apple shadow-primary/20'
                                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-main dark:text-text-darkMain'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <span className="text-xs tracking-wide font-bold truncate block">{sName}</span>
                                <span
                                  className={`text-[10px] block ${
                                    isSelected ? 'text-white/80' : 'text-text-muted'
                                  }`}
                                >
                                  {chapters.length} chapters • {subLeafCount} subtopics
                                </span>
                              </div>
                              <ChevronRight
                                className={`w-4 h-4 shrink-0 transition-transform ${
                                  isSelected ? 'text-white translate-x-0.5' : 'text-text-muted'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </Panel>

                  {/* Vertical Mac/Xcode-style Draggable Divider */}
                  <PanelResizeHandle className="w-3 hover:w-4 flex items-center justify-center cursor-col-resize group transition-all py-16 select-none shrink-0">
                    <div className="w-1 h-14 rounded-full bg-black/15 dark:bg-white/20 group-hover:bg-primary group-hover:h-24 transition-all duration-200" />
                  </PanelResizeHandle>

                  {/* Right Panel: 4-Level Syllabus Tree */}
                  <Panel defaultSize={66} minSize={50} className="pl-3 space-y-4">
                    <WidgetErrorBoundary title="Syllabus Curriculum">
                      <EditableTree
                        subjects={displayedSubjects}
                        completedIds={completedIds}
                        onToggleSubtopic={handleToggleSubtopic}
                        onSnoozeSubtopic={handleSnoozeSubtopic}
                        searchQuery={searchQuery}
                        isLocked={isLocked}
                        onTreeUpdated={fetchDashboard}
                      />
                    </WidgetErrorBoundary>
                  </Panel>
                </PanelGroup>
              </div>

              {/* Mobile View: No Split Pane, direct search + horizontal subject pills + full-height tree */}
              <div className="lg:hidden space-y-4">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chapters & subtopics..."
                    className="w-full min-h-[44px] bg-surface-light dark:bg-surface-dark border border-black/10 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs tracking-wide font-medium text-text-main dark:text-text-darkMain focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm"
                  />
                </div>

                {/* Thumb-friendly horizontal subject filter pills with 44px min touch target */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback.tap();
                      setActiveSubjectFilter('ALL');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs tracking-wide font-bold transition-all cursor-pointer shrink-0 min-h-[44px] flex items-center gap-1.5 ${
                      activeSubjectFilter === 'ALL'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main'
                    }`}
                  >
                    <span>All Subjects</span>
                    <span className="text-[10px] opacity-80">
                      ({totalCompleted}/{totalTopics})
                    </span>
                  </button>

                  {(activeExam.subjects || []).map((sub, idx) => {
                    const sName = sub.subjectName || sub.name || `Subject ${idx + 1}`;
                    const isSelected = activeSubjectFilter === idx.toString();
                    return (
                      <button
                        key={sName + idx}
                        type="button"
                        onClick={() => {
                          hapticFeedback.tap();
                          setActiveSubjectFilter(idx.toString());
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs tracking-wide font-bold transition-all cursor-pointer shrink-0 min-h-[44px] flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main'
                        }`}
                      >
                        <span>{sName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Full height EditableTree */}
                <div className="w-full">
                  <WidgetErrorBoundary title="Syllabus Curriculum">
                    <EditableTree
                      subjects={displayedSubjects}
                      completedIds={completedIds}
                      onToggleSubtopic={handleToggleSubtopic}
                      onSnoozeSubtopic={handleSnoozeSubtopic}
                      searchQuery={searchQuery}
                      isLocked={isLocked}
                      onTreeUpdated={fetchDashboard}
                    />
                  </WidgetErrorBoundary>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* APPLE SPATIAL SLIDE-OVER: PLAN BUILDER & INGESTION STUDIO */}
      <AppleSlideOver
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Plan Builder & Ingestion Studio"
        subtitle="Scrape official syllabi, parse raw text, or edit nodes"
        maxWidth="max-w-4xl"
        headerExtra={
          <div className="p-1.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
        }
      >
        <SyllabusBuilder isModal={true} onClose={() => setIsEditModalOpen(false)} />
      </AppleSlideOver>

      {/* Swipeable vaul Bottom Sheet: Activity Timeline Feed */}
      <TimelineFeedSheet
        isOpen={isTimelineFeedOpen}
        onClose={() => setIsTimelineFeedOpen(false)}
        sessions={dashboardData?.todaySessions}
        timeline={timelineData}
      />
    </div>
  );
}


