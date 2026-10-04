import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Tag, BookOpen, Clock, Sparkles } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

const QUICK_TAGS = ['#Theory', '#Revision', '#MockTest', '#Practice', '#Notes'];
const DURATION_PRESETS = [
  { label: '25m', minutes: 25 },
  { label: '50m', minutes: 50 },
  { label: '90m', minutes: 90 },
  { label: 'Open', minutes: 0 },
];

/**
 * One-Tap Quick Timers (The TrackIt DNA)
 * Renders below the dynamic queue in Focus.jsx.
 * Allows users to instantly start a standalone timer tagged to a subject and category
 * without linking to a specific syllabus subtopic (perfect for ad-hoc revision or unstructured reading).
 */
export default function QuickTimerSection({
  subjects = [],
  onStartQuickTimer,
  isTimerRunning = false,
}) {
  const availableSubjects = useMemo(() => {
    if (Array.isArray(subjects) && subjects.length > 0) {
      return subjects.map((s) =>
        typeof s === 'string' ? s : s.name || s.subjectName || 'General'
      );
    }
    return ['General', 'Physics', 'Chemistry', 'Mathematics'];
  }, [subjects]);

  const [selectedSubject, setSelectedSubject] = useState(() => availableSubjects[0] || 'General');
  const [selectedTag, setSelectedTag] = useState('#Revision');
  const [selectedPreset, setSelectedPreset] = useState(50);

  const handleLaunch = () => {
    hapticFeedback.tap();
    const uniqueId = `quick-${Date.now()}`;
    const title = `${selectedSubject} (${selectedTag})`;

    onStartQuickTimer?.({
      id: uniqueId,
      title,
      subjectName: selectedSubject,
      chapterName: 'Ad-hoc Focus Block',
      tag: selectedTag,
      plannedMinutes: selectedPreset,
      isQuickTimer: true,
    });
  };

  return (
    <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border-[0.5px] border-accent/20 text-accent flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-base font-bold text-label tracking-tight">One-Tap Quick Timer</h3>
            <p className="text-xs tracking-wide text-label-secondary">
              Instant standalone tracking for ad-hoc revision & open reading
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-label-secondary">
          TrackIt Quick Log
        </span>
      </div>

      {/* Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Subject Chips */}
        <div className="space-y-1.5">
          <label className="text-xs tracking-wide font-semibold text-label-secondary flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Select Subject</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableSubjects.slice(0, 6).map((sub) => {
              const isSelected = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    hapticFeedback.tap();
                    setSelectedSubject(sub);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs tracking-wide font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-background border-[0.5px] border-border text-label-secondary hover:text-label'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Tag Chips */}
        <div className="space-y-1.5">
          <label className="text-xs tracking-wide font-semibold text-label-secondary flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>Activity Tag</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    hapticFeedback.tap();
                    setSelectedTag(tag);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs tracking-wide font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-success text-white shadow-sm'
                      : 'bg-background border-[0.5px] border-border text-label-secondary hover:text-label'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Duration Presets & Primary One-Tap Launch Button */}
      <div className="pt-2 border-t border-[0.5px] border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Duration selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs tracking-wide text-label-secondary font-medium mr-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Block:
          </span>
          {DURATION_PRESETS.map((p) => {
            const isSelected = selectedPreset === p.minutes;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  hapticFeedback.tap();
                  setSelectedPreset(p.minutes);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs tracking-wide font-mono font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-label text-background font-bold'
                    : 'bg-background border-[0.5px] border-border text-label-secondary hover:text-label'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Single Launch Tap */}
        <motion.button
          layoutId="timer-morph"
          type="button"
          onClick={handleLaunch}
          disabled={isTimerRunning}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            isTimerRunning
              ? 'bg-black/10 dark:bg-white/10 text-label-secondary cursor-not-allowed'
              : 'bg-accent text-white hover:opacity-90 shadow-sm'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>
            Start {selectedSubject} ({selectedTag})
          </span>
        </motion.button>
      </div>
    </div>
  );
}


