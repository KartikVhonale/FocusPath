import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Globe,
  Download,
  Sparkles,
  Check,
  Trash2,
  Edit2,
  Plus,
  ArrowRight,
  BookOpen,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { hapticFeedback } from '../utils/haptics';

export default function AdminSyllabus() {
  const { exams, fetchExams, fetchDashboard } = useApp();

  const [examName, setExamName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedResult, setScrapedResult] = useState(null);

  // Topic editing state
  const [selectedExamToEdit, setSelectedExamToEdit] = useState('');
  const [activeEditingExam, setActiveEditingExam] = useState(null);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [newTopicSubjectIdx, setNewTopicSubjectIdx] = useState(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isSavingTopics, setIsSavingTopics] = useState(false);

  // Sync selected exam for manual editing
  useEffect(() => {
    if (selectedExamToEdit && exams.length > 0) {
      const match = exams.find((e) => e._id === selectedExamToEdit);
      if (match) {
        setActiveEditingExam(JSON.parse(JSON.stringify(match)));
      }
    }
  }, [selectedExamToEdit, exams]);

  const handleFetchSyllabus = async (e) => {
    e.preventDefault();
    if (!examName.trim()) {
      toast.error('Please enter an exam name (e.g., SSC CGL, UPSC Prelims)');
      return;
    }
    if (!sourceUrl.trim() || !sourceUrl.startsWith('http')) {
      toast.error('Please enter a valid HTTP or HTTPS source URL');
      return;
    }

    setIsScraping(true);
    hapticFeedback.medium();

    try {
      const res = await api.post('/admin/fetch-syllabus', {
        examName: examName.trim(),
        targetUrl: sourceUrl.trim(),
      });

      if (res.data?.success) {
        hapticFeedback.success();
        toast.success(res.data.message || '🎉 Successfully ingested syllabus!');
        setScrapedResult(res.data.exam);
        setActiveEditingExam(res.data.exam);
        setSelectedExamToEdit(res.data.exam._id);
        await fetchExams();
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Error fetching syllabus:', err);
      const msg =
        err.response?.data?.message || err.message || 'Failed to fetch syllabus from source';
      toast.error(msg);
    } finally {
      setIsScraping(false);
    }
  };

  // Preset sample test URLs for quick testing
  const samplePresets = [
    {
      name: 'UPSC Civil Services Prelims',
      url: 'https://en.wikipedia.org/wiki/Civil_Services_Examination',
    },
    {
      name: 'GATE Computer Science',
      url: 'https://gate2026.iitk.ac.in',
    },
  ];

  // Topic Edit Handlers
  const handleStartEdit = (chapterId, currentTitle) => {
    setEditingChapterId(chapterId);
    setEditedTitle(currentTitle);
  };

  const handleSaveEdit = async (subjectIdx, chapterId) => {
    if (!editedTitle.trim()) return;
    setIsSavingTopics(true);
    hapticFeedback.tap();

    try {
      const res = await api.put(`/admin/exams/${activeEditingExam._id}/topics`, {
        action: 'edit',
        subjectIndex: subjectIdx,
        chapterId,
        newTitle: editedTitle.trim(),
      });

      const data = res.data || res;
      if (data?.success) {
        toast.success('Chapter title updated');
        if (data.exam) setActiveEditingExam(data.exam);
        setEditingChapterId(null);
        await fetchExams();
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to update chapter:', err);
      toast.error(err.response?.data?.message || 'Failed to update chapter');
    } finally {
      setIsSavingTopics(false);
    }
  };

  const handleAddTopic = async (subjectIdx) => {
    if (!newTopicTitle.trim()) return;
    setIsSavingTopics(true);
    hapticFeedback.tap();

    const subjectName = activeEditingExam.subjects[subjectIdx]?.name;

    try {
      const res = await api.put(`/admin/exams/${activeEditingExam._id}/topics`, {
        action: 'add',
        subjectIndex: subjectIdx,
        subjectName,
        newTitle: newTopicTitle.trim(),
      });

      const data = res.data || res;
      if (data?.success) {
        toast.success(`🎉 Added "${newTopicTitle.trim()}"`);
        if (data.exam) setActiveEditingExam(data.exam);
        setNewTopicSubjectIdx(null);
        setNewTopicTitle('');
        await fetchExams();
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to add topic:', err);
      toast.error(err.response?.data?.message || 'Failed to add topic');
    } finally {
      setIsSavingTopics(false);
    }
  };

  const handleDeleteTopic = async (subjectIdx, chapterId) => {
    if (!window.confirm('Delete this chapter from the syllabus?')) return;
    setIsSavingTopics(true);
    hapticFeedback.tap();

    try {
      const res = await api.put(`/admin/exams/${activeEditingExam._id}/topics`, {
        action: 'delete',
        subjectIndex: subjectIdx,
        chapterId,
      });

      const data = res.data || res;
      if (data?.success) {
        toast.success('Topic removed');
        if (data.exam) setActiveEditingExam(data.exam);
        await fetchExams();
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to delete topic:', err);
      toast.error(err.response?.data?.message || 'Failed to delete topic');
    } finally {
      setIsSavingTopics(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24 md:pb-12 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
            Admin Suite
          </span>
          <span className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
            • Automated Ingestion & Topic Editor
          </span>
        </div>
        <h1 className="text-2xl tracking-tight sm:text-3xl tracking-tight font-black text-text-main dark:text-text-darkMain tracking-tight">
          Automated Syllabus Ingestion Engine
        </h1>
        <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
          Scrape and convert unstructured web tables and bullet points into database-ready adaptive
          syllabi, or customize any topic.
        </p>
      </div>

      {/* Main Grid: Scraper Form & Live Topic Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Scraper Input Form (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-text-main dark:text-text-darkMain">
                Fetch Syllabus from Web URL
              </h2>
            </div>

            <form onSubmit={handleFetchSyllabus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs tracking-wide font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block">
                  Target Exam Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. SSC CGL 2026, CA Foundation, UPSC"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-xs tracking-wide text-text-main dark:text-text-darkMain placeholder-text-muted/60 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs tracking-wide font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block">
                  Source Webpage URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/syllabus-guide"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-xs tracking-wide text-text-main dark:text-text-darkMain placeholder-text-muted/60 font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Sample Shortcuts */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase font-bold text-text-muted dark:text-text-darkMuted block">
                  Quick Sample Presets:
                </span>
                <div className="flex flex-col gap-1.5">
                  {samplePresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setExamName(preset.name);
                        setSourceUrl(preset.url);
                      }}
                      className="text-left py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] text-text-muted hover:text-text-main transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold">{preset.name}</span>
                      <span className="text-[10px] text-primary">Use URL →</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isScraping}
                className="w-full py-3.5 bg-accent hover:opacity-90 active:scale-95 text-white font-bold text-xs tracking-wide rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isScraping ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting & Ingesting DOM...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Fetch & Ingest Syllabus</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-3xl p-5 space-y-2 text-xs tracking-wide text-text-muted dark:text-text-darkMuted leading-relaxed">
            <h4 className="font-bold text-text-main dark:text-text-darkMain flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>How the Ingestion Engine Works</span>
            </h4>
            <p>
              The engine visits the URL using an automated headless HTTP client, extracts subject
              headings (`h1/h2/h3`) and adjoining bulleted lists or table rows, generates individual
              chapter items, and calculates the total chapters count before committing directly to
              MongoDB.
            </p>
          </div>
        </div>

        {/* Right Column: Live Topic Editor & Syllabus Management (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" />
                <div>
                  <h3 className="text-sm font-bold text-text-main dark:text-text-darkMain">
                    Interactive Topic & Syllabus Editor
                  </h3>
                  <p className="text-[11px] text-text-muted dark:text-text-darkMuted">
                    Edit topic names, add custom chapters, or remove outdated entries
                  </p>
                </div>
              </div>

              {/* Exam Switcher */}
              <select
                value={selectedExamToEdit}
                onChange={(e) => setSelectedExamToEdit(e.target.value)}
                className="bg-slate-100 dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Select Exam to Edit --</option>
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.name} ({ex.totalChapters} ch)
                  </option>
                ))}
              </select>
            </div>

            {/* Display Active Exam Topics */}
            {activeEditingExam ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-primary/5 p-3 rounded-2xl border border-primary/20">
                  <div>
                    <span className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain">
                      {activeEditingExam.name}
                    </span>
                    <span className="text-[11px] text-text-muted dark:text-text-darkMuted block">
                      Code: {activeEditingExam.code}
                    </span>
                  </div>
                  <span className="text-xs tracking-wide font-black font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {activeEditingExam.totalChapters} Total Chapters
                  </span>
                </div>

                {/* Subjects & Chapter Lists */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {activeEditingExam.subjects?.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="border border-black/5 dark:border-white/5 rounded-2xl p-4 bg-slate-50/50 dark:bg-black/20 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain">
                          {sub.name}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted dark:text-text-darkMuted font-bold">
                          {sub.chapters?.length || 0} chapters
                        </span>
                      </div>

                      {/* Chapters Items */}
                      <div className="space-y-1.5">
                        {sub.chapters?.map((ch, cIdx) => (
                          <div
                            key={ch.id || cIdx}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 text-xs tracking-wide hover:border-primary/30 transition-all group"
                          >
                            {editingChapterId === ch.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editedTitle}
                                  onChange={(e) => setEditedTitle(e.target.value)}
                                  className="flex-1 bg-slate-100 dark:bg-black/30 border border-primary rounded-lg px-2 py-1 text-xs tracking-wide outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(sIdx, ch.id)}
                                  className="w-7 h-7 rounded-lg bg-secondary text-white flex items-center justify-center hover:opacity-90"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingChapterId(null)}
                                  className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/10 text-text-muted flex items-center justify-center"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-text-main dark:text-text-darkMain font-medium truncate flex-1">
                                  {cIdx + 1}. {ch.title}
                                </span>

                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(ch.id, ch.title)}
                                    title="Edit title"
                                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTopic(sIdx, ch.id)}
                                    title="Delete chapter"
                                    className="p-1 rounded-lg hover:bg-[#FF3B30]/10 text-label-secondary hover:text-[#FF3B30] transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Topic Input for this Subject */}
                      {newTopicSubjectIdx === sIdx ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Enter new chapter name..."
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddTopic(sIdx);
                            }}
                            className="flex-1 bg-surface-light dark:bg-surface-dark border border-primary rounded-xl px-3 py-1.5 text-xs tracking-wide outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTopic(sIdx)}
                            className="px-3 py-1.5 bg-primary text-white font-bold text-xs tracking-wide rounded-xl shadow-sm"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewTopicSubjectIdx(null);
                              setNewTopicTitle('');
                            }}
                            className="px-2.5 py-1.5 bg-slate-200 dark:bg-white/10 text-text-muted text-xs tracking-wide rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setNewTopicSubjectIdx(sIdx);
                            setNewTopicTitle('');
                          }}
                          className="w-full py-2 border border-dashed border-black/15 dark:border-white/15 rounded-xl text-xs tracking-wide font-semibold text-text-muted hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Topic to {sub.name}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 space-y-2 text-text-muted dark:text-text-darkMuted">
                <BookOpen className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-xs tracking-wide">
                  Fetch a syllabus from the left form or select an existing exam from the dropdown
                  above to edit chapters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

