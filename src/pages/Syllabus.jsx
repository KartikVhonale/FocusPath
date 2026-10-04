import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Check,
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Layers,
  X,
  Filter,
  Edit2,
  Trash2,
  Plus,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../utils/haptics';
import Tooltip from '../components/Tooltip';

export default function Syllabus() {
  const { activeExam, setActiveExam, dashboardData, toggleChapter, fetchExams, fetchDashboard } =
    useApp();
  const { isManagedStudent, isLockedByTeacher, teacherName } = useAuth();
  const isLocked = isManagedStudent || isLockedByTeacher;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [activeSubjectFilter, setActiveSubjectFilter] = useState('ALL');

  // Inline topic editing state
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [newTopicSubjectIdx, setNewTopicSubjectIdx] = useState(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const completedIds = useMemo(() => {
    return dashboardData?.completedChapterIds || [];
  }, [dashboardData?.completedChapterIds]);

  // Filter subjects based on active tab (must be called unconditionally before early returns)
  const displayedSubjects = useMemo(() => {
    if (!activeExam?.subjects) return [];
    if (activeSubjectFilter === 'ALL')
      return activeExam.subjects.map((s, idx) => ({ ...s, originalIndex: idx }));
    return activeExam.subjects
      .map((s, idx) => ({ ...s, originalIndex: idx }))
      .filter((_, idx) => idx.toString() === activeSubjectFilter);
  }, [activeExam?.subjects, activeSubjectFilter]);

  if (!dashboardData || !activeExam) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto shadow-sm">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-label">No Exam Plan Active</h3>
          <p className="text-xs tracking-wide text-label-secondary max-w-sm mx-auto">
            Please configure your exam plan first to browse, check off, and customize chapters from
            its official syllabus.
          </p>
        </div>
        <Link
          to="/setup"
          onClick={() => hapticFeedback.tap()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:opacity-90 active:scale-95 text-white font-bold text-xs tracking-wide rounded-xl shadow-sm transition-all"
        >
          <span>Select Exam & Create Plan</span>
        </Link>
      </div>
    );
  }

  const totalTopics = dashboardData.totalTopics || activeExam.totalChapters || 0;
  const totalCompleted = completedIds.length;
  const overallPercent = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;
  const chaptersRemaining = Math.max(0, totalTopics - totalCompleted);

  const toggleSubjectExpand = (index) => {
    hapticFeedback.tap();
    setExpandedSubjects((prev) => ({
      ...prev,
      [index]: prev[index] === undefined ? false : !prev[index],
    }));
  };

  const handleToggleChapter = (chapterId, status) => {
    if (editingChapterId) return; // Prevent toggle when editing title
    if (status) {
      hapticFeedback.medium();
    } else {
      hapticFeedback.tap();
    }
    toggleChapter(chapterId, status);
  };

  // Topic Edit Functions
  const handleStartEdit = (e, chapterId, currentTitle) => {
    e.stopPropagation();
    setEditingChapterId(chapterId);
    setEditedTitle(currentTitle);
  };

  const handleSaveEdit = async (e, subjectIdx, chapterId) => {
    e.stopPropagation();
    if (!editedTitle.trim()) return;
    setIsSaving(true);
    hapticFeedback.tap();

    try {
      const res = await api.put(`/admin/exams/${activeExam._id}/topics`, {
        action: 'edit',
        subjectIndex: subjectIdx,
        chapterId,
        newTitle: editedTitle.trim(),
      });

      const data = res.data || res;
      if (data?.success) {
        toast.success('Chapter title updated');
        if (data.exam && setActiveExam) {
          setActiveExam(data.exam);
        }
        setEditingChapterId(null);
        await fetchExams();
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to update chapter:', err);
      toast.error(err.response?.data?.message || 'Failed to update chapter');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTopic = async (e, subjectIdx, subjectName) => {
    if (e) e.preventDefault();
    if (!newTopicTitle.trim()) return;
    setIsSaving(true);
    hapticFeedback.tap();

    try {
      const res = await api.put(`/admin/exams/${activeExam._id}/topics`, {
        action: 'add',
        subjectIndex: subjectIdx,
        subjectName,
        newTitle: newTopicTitle.trim(),
      });

      const data = res.data || res;
      if (data?.success) {
        toast.success(`🎉 Added "${newTopicTitle.trim()}" to syllabus!`);
        if (data.exam && setActiveExam) {
          setActiveExam(data.exam);
        }
        setNewTopicSubjectIdx(null);
        setNewTopicTitle('');
        await fetchExams();
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to add topic:', err);
      toast.error(err.response?.data?.message || 'Failed to add topic');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTopic = async (e, subjectIdx, chapterId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this chapter from the syllabus?')) return;
    setIsSaving(true);
    hapticFeedback.tap();

    try {
      const res = await api.put(`/admin/exams/${activeExam._id}/topics`, {
        action: 'delete',
        subjectIndex: subjectIdx,
        chapterId,
      });

      const data = res.data || res;
      if (data?.success) {
        toast.success('Chapter deleted');
        if (data.exam && setActiveExam) {
          setActiveExam(data.exam);
        }
        await fetchExams();
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to delete chapter:', err);
      toast.error(err.response?.data?.message || 'Failed to delete chapter');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24 md:pb-12 space-y-6">
      {/* Page Title & Breadcrumb */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
            {activeExam.name}
          </span>
          <span className="text-xs tracking-wide text-label-secondary">
            • Interactive Syllabus Tracker & Editor
          </span>
        </div>
        <h1 className="text-2xl tracking-tight sm:text-3xl tracking-tight font-black text-label tracking-tight">
          Syllabus & Topic Breakdown
        </h1>
        <p className="text-xs tracking-wide text-label-secondary">
          Click subjects to smoothly expand sub-topics across wide columns. Check off chapters to
          dynamically recalculate daily goals, or edit any chapter title inline.
        </p>
      </div>

      {/* Sleek Managed Mode Lockout Banner */}
      {isLocked && (
        <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs tracking-wide font-semibold text-label shadow-apple dark:shadow-apple-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/10 text-label flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">🔒 Syllabus Managed by Instructor</span>
              <p className="text-[11px] text-label-secondary pt-0.5">
                {teacherName
                  ? `Your syllabus structure is managed directly by ${teacherName}. Check off topics as you study; structural modifications are locked.`
                  : 'Your syllabus structure is managed directly by your instructor. Check off topics as you study; structural modifications are locked.'}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-border text-label-secondary">
            Locked
          </span>
        </div>
      )}

      {/* Responsive Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column / Sticky Sidebar (Desktop: col-span-4) */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
          {/* Grand Progress Card */}
          <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-secondary">
                Overall Syllabus Progress
              </span>
              <span className="text-xs tracking-wide font-black font-mono text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                {overallPercent}% Done
              </span>
            </div>

            {/* Micro Stats Counter */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background border-[0.5px] border-border rounded-2xl p-3">
                <span className="text-[10px] uppercase font-bold text-label-secondary block">
                  Completed
                </span>
                <span className="text-xl font-black font-mono text-success">{totalCompleted}</span>
                <span className="text-[10px] text-label-secondary block">chapters</span>
              </div>
              <div className="bg-background border-[0.5px] border-border rounded-2xl p-3">
                <span className="text-[10px] uppercase font-bold text-label-secondary block">
                  Remaining
                </span>
                <span className="text-xl font-black font-mono text-label">{chaptersRemaining}</span>
                <span className="text-[10px] text-label-secondary block">chapters</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-label-secondary">
                <span>0 chapters</span>
                <span>{totalTopics} chapters total</span>
              </div>
            </div>
          </div>

          {/* Search Filter Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-label-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search chapters by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background-elevated border-[0.5px] border-border rounded-2xl pl-10 pr-10 py-3 text-xs tracking-wide text-label placeholder:text-label-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-label-secondary hover:text-label transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Subject Filter Navigator */}
          <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs tracking-wide font-bold text-label">
              <Filter className="w-3.5 h-3.5 text-accent" />
              <span>Subject Filter</span>
            </div>

            <div className="flex flex-wrap lg:flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.tap();
                  setActiveSubjectFilter('ALL');
                }}
                className={`px-3 py-2 rounded-xl text-xs tracking-wide font-bold transition-all text-left flex items-center justify-between ${
                  activeSubjectFilter === 'ALL'
                    ? 'bg-accent text-white shadow-sm shadow-accent/20'
                    : 'bg-background hover:bg-black/5 dark:hover:bg-white/5 text-label-secondary hover:text-label'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Subjects</span>
                </span>
                <span className="text-[10px] font-mono opacity-80">
                  {totalCompleted}/{totalTopics}
                </span>
              </button>

              {activeExam.subjects?.map((sub, idx) => {
                const subChapters = sub.chapters || [];
                const subDone = subChapters.filter((c) => completedIds.includes(c.id)).length;
                const isSelected = activeSubjectFilter === idx.toString();

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      hapticFeedback.tap();
                      setActiveSubjectFilter(idx.toString());
                    }}
                    className={`px-3 py-2 rounded-xl text-xs tracking-wide font-bold transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-accent text-white shadow-sm shadow-accent/20'
                        : 'bg-background hover:bg-black/5 dark:hover:bg-white/5 text-label-secondary hover:text-label'
                    }`}
                  >
                    <span className="truncate pr-2">{sub.name}</span>
                    <span className="text-[10px] font-mono shrink-0 opacity-80">
                      {subDone}/{subChapters.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Column Collapsible Accordion & Topic Editor (Desktop: col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {displayedSubjects.map((subject) => {
            const subIndex = subject.originalIndex;
            const isExpanded = expandedSubjects[subIndex] !== false;
            const allChapters = subject.chapters || [];
            const filteredChapters = allChapters.filter((ch) =>
              ch.title.toLowerCase().includes(searchQuery.toLowerCase())
            );

            const subjectTotal = allChapters.length;
            const subjectCompleted = allChapters.filter((ch) =>
              completedIds.includes(ch.id)
            ).length;
            const subjectPercent =
              subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0;

            if (searchQuery && filteredChapters.length === 0) return null;

            return (
              <div
                key={subIndex}
                className="bg-background-elevated border-[0.5px] border-border rounded-3xl overflow-hidden transition-all duration-200"
              >
                {/* Subject Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSubjectExpand(subIndex)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-left select-none cursor-pointer"
                >
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-label tracking-tight">
                          {subject.name}
                        </span>
                        {subjectCompleted === subjectTotal && subjectTotal > 0 && (
                          <span className="text-[10px] font-bold bg-success/15 text-success border border-success/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Done</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs tracking-wide text-accent font-mono font-bold">
                        {subjectCompleted} of {subjectTotal} completed ({subjectPercent}%)
                      </span>
                    </div>

                    {/* Micro Progress Bar */}
                    <div className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${subjectPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-label-secondary p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Sub-Topics Multi-Column CSS Grid (Grid cols 1 on mobile, 2 on tablet, 3 on laptop) */}
                {isExpanded && (
                  <div className="border-t border-border bg-background/50 p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {filteredChapters.map((chapter, chIdx) => {
                        const isDone = completedIds.includes(chapter.id);
                        const isEditingThis = editingChapterId === chapter.id;

                        return (
                          <div
                            key={chapter.id || chIdx}
                            onClick={() =>
                              !isEditingThis && handleToggleChapter(chapter.id, !isDone)
                            }
                            className={`p-3.5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-200 border select-none group min-h-[90px] ${
                              isDone
                                ? 'bg-success/[0.04] border-success/25'
                                : 'bg-background border-[0.5px] border-border hover:border-accent/40 shadow-sm'
                            }`}
                          >
                            {/* Inline Edit Mode */}
                            {isEditingThis ? (
                              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editedTitle}
                                  onChange={(e) => setEditedTitle(e.target.value)}
                                  className="w-full bg-background border border-accent rounded-xl px-2.5 py-1.5 text-xs tracking-wide text-label outline-none"
                                  autoFocus
                                />
                                <div className="flex items-center gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={(e) => handleSaveEdit(e, subIndex, chapter.id)}
                                    className="px-2.5 py-1 rounded-lg bg-accent text-white text-[11px] font-bold shadow-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingChapterId(null);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-background-elevated border-[0.5px] border-border text-label-secondary text-[11px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start gap-2.5">
                                  {/* Custom Checkbox */}
                                  <div
                                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                                      isDone
                                        ? 'bg-success border-success text-white shadow-sm scale-105'
                                        : 'border-border bg-background text-transparent group-hover:border-accent'
                                    }`}
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>

                                  {/* Chapter Title */}
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-mono text-label-secondary block leading-none mb-1">
                                      Chapter {chIdx + 1}
                                    </span>
                                    <span
                                      className={`text-xs tracking-wide block leading-snug transition-colors break-words ${
                                        isDone
                                          ? 'line-through text-label-secondary/50 font-normal'
                                          : 'text-label font-semibold'
                                      }`}
                                    >
                                      {chapter.title}
                                    </span>
                                  </div>
                                </div>

                                {/* Edit Options Footer (Hover action) - Hidden if isLocked */}
                                {!isLocked && (
                                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-border mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Tooltip content="Edit topic name" position="top">
                                      <button
                                        type="button"
                                        onClick={(e) =>
                                          handleStartEdit(e, chapter.id, chapter.title)
                                        }
                                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-label-secondary hover:text-label"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    </Tooltip>
                                    <Tooltip content="Delete topic" position="top">
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteTopic(e, subIndex, chapter.id)}
                                        className="p-1 rounded-md hover:bg-[#FF3B30]/15 text-label-secondary hover:text-[#FF3B30] transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </Tooltip>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Inline Add Topic to Subject - Hidden if isLocked */}
                    {!isLocked &&
                      (newTopicSubjectIdx === subIndex ? (
                        <div className="flex items-center gap-2 pt-2 bg-background-elevated border border-accent/40 rounded-2xl p-3">
                          <input
                            type="text"
                            placeholder="Type new chapter / topic title..."
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddTopic(e, subIndex, subject.name);
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs tracking-wide text-label outline-none focus:ring-2 focus:ring-accent"
                            autoFocus
                          />
                          <button
                            type="button"
                            disabled={isSaving || !newTopicTitle.trim()}
                            onClick={(e) => handleAddTopic(e, subIndex, subject.name)}
                            className="px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs tracking-wide rounded-xl shadow-sm transition-all"
                          >
                            {isSaving ? 'Adding...' : 'Add Chapter'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewTopicSubjectIdx(null);
                              setNewTopicTitle('');
                            }}
                            className="px-3 py-2 bg-background-elevated border-[0.5px] border-border text-label-secondary text-xs tracking-wide rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setNewTopicSubjectIdx(subIndex);
                            setNewTopicTitle('');
                          }}
                          className="w-full py-2.5 border border-dashed border-border hover:border-accent/50 hover:bg-accent/5 rounded-2xl text-xs tracking-wide font-semibold text-label-secondary hover:text-accent transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Chapter to {subject.name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty Search Result Message */}
          {searchQuery &&
            displayedSubjects.every(
              (s) =>
                (s.chapters || []).filter((ch) =>
                  ch.title.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0
            ) && (
              <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-12 text-center space-y-3">
                <Search className="w-8 h-8 text-label-secondary mx-auto opacity-50" />
                <p className="text-sm font-bold text-label">No chapters matching "{searchQuery}"</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs tracking-wide font-bold text-accent hover:underline"
                >
                  Clear search query
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

