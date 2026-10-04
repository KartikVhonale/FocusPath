import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';
import HistoryEditModal from './HistoryEditModal';

/**
 * Study Timeline & Historical Reflection Component
 * Displays a 30-day vertical history with expandable topic drilldown
 * and provides access to the Time Machine retro editor modal.
 */
export default function HistoryTimeline({
  timeline = [],
  isLoading = false,
  syllabusSubjects = [],
}) {
  const [expandedDates, setExpandedDates] = useState({});
  const [editingEntry, setEditingEntry] = useState(null);

  // Flatten syllabus topics for frictionless search in the Time Machine modal
  const flatSyllabusTopics = useMemo(() => {
    const list = [];
    (syllabusSubjects || []).forEach((subj) => {
      const sName = subj.subjectName || subj.name || 'Subject';
      (subj.chapters || []).forEach((chap) => {
        const cName = chap.chapterName || chap.title || 'Chapter';
        (chap.topics || []).forEach((top) => {
          const tTitle = top.title || 'Topic';
          if (Array.isArray(top.subtopics) && top.subtopics.length > 0) {
            top.subtopics.forEach((st) => {
              const stId = String(
                st.nodeId || st._id || st.id || `${sName}-${cName}-${tTitle}-${st.title}`
              );
              list.push({
                id: stId,
                title: st.title,
                subjectName: sName,
                chapterName: cName,
                topicTitle: tTitle,
              });
            });
          } else {
            const topId = String(top._id || top.id || top.nodeId || `${sName}-${cName}-${tTitle}`);
            list.push({
              id: topId,
              title: tTitle,
              subjectName: sName,
              chapterName: cName,
            });
          }
        });
      });
    });
    return list;
  }, [syllabusSubjects]);

  const toggleDate = (dateStr) => {
    hapticFeedback.tap();
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 animate-pulse" />
          <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-black/10 dark:bg-white/10 animate-pulse mt-1" />
              <div className="flex-1 h-12 bg-black/5 dark:bg-white/5 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-main dark:text-text-darkMain tracking-tight">
              Study Timeline
            </h3>
            <span className="text-[11px] text-text-muted">Historical activity & Time Machine</span>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-text-muted">
          Past 30 Days
        </span>
      </div>

      {/* Vertical Timeline List */}
      {!timeline || timeline.length === 0 ? (
        <div className="py-8 text-center text-text-muted space-y-2">
          <Sparkles className="w-7 h-7 mx-auto text-primary opacity-50" />
          <p className="text-xs tracking-wide font-semibold">No study logs recorded yet.</p>
          <p className="text-[11px] text-text-muted max-w-xs mx-auto">
            Complete topics today in the Focus tab to build your historical learning trajectory.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-black/10 dark:before:bg-white/10">
          {timeline.map((entry) => {
            const isExpanded = Boolean(expandedDates[entry.date]);
            const topics = entry.completedTopics || [];
            const hasTopics = topics.length > 0;

            const formattedDate = new Intl.DateTimeFormat('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }).format(new Date(entry.date + 'T00:00:00'));

            return (
              <div key={entry.date} className="relative group">
                {/* Timeline Node Dot */}
                <div
                  className={`absolute -left-[27px] top-2.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    hasTopics
                      ? 'bg-primary border-white dark:border-black shadow-sm'
                      : 'bg-black/20 dark:bg-white/20 border-white dark:border-black'
                  }`}
                />

                {/* Date Accordion Header */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    hasTopics
                      ? 'bg-black/[0.015] dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10'
                      : 'bg-black/[0.01] dark:bg-white/[0.01] border-black/5 dark:border-white/5 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      onClick={() => hasTopics && toggleDate(entry.date)}
                      className={`min-w-0 flex-1 ${hasTopics ? 'cursor-pointer' : ''}`}
                    >
                      <span className="text-xs tracking-wide font-bold text-text-main dark:text-text-darkMain block truncate">
                        {formattedDate}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                        <span className="font-semibold text-primary">
                          {entry.topicsCompleted || topics.length} completed
                        </span>
                        {entry.timeStudiedMinutes > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{entry.timeStudiedMinutes}m</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Retroactive Time Machine Modal Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          hapticFeedback.tap();
                          setEditingEntry(entry);
                        }}
                        className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-primary/15 text-text-muted hover:text-primary transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Time Machine: Edit Log"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {hasTopics && (
                        <button
                          type="button"
                          onClick={() => toggleDate(entry.date)}
                          className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-muted hover:text-text-main transition-colors cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Dropdown Showing Exact Topics Studied */}
                  <AnimatePresence initial={false}>
                    {isExpanded && hasTopics && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                        className="pt-3 mt-2.5 border-t border-black/5 dark:border-white/5 space-y-1.5"
                      >
                        {topics.map((t, tIdx) => (
                          <div
                            key={t.id || tIdx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-[11px]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-text-main dark:text-text-darkMain truncate block">
                                {t.title}
                              </span>
                              {t.subjectName && (
                                <span className="text-[10px] text-text-muted truncate block">
                                  {t.subjectName} {t.chapterName ? `• ${t.chapterName}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Time Machine Modal */}
      <HistoryEditModal
        isOpen={Boolean(editingEntry)}
        onClose={() => setEditingEntry(null)}
        entry={editingEntry}
        allSyllabusTopics={flatSyllabusTopics}
      />
    </div>
  );
}


