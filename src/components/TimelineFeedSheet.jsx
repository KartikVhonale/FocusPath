import React, { useState, useMemo } from 'react';
import { Drawer } from 'vaul';
import { Clock, Calendar, Tag, Sparkles, X, ChevronRight } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

const AVAILABLE_TAGS = ['#All', '#Theory', '#Revision', '#MockTest', '#Practice', '#Notes'];

/**
 * Native-feeling Apple HIG Vertical Timeline Feed (TrackIt DNA)
 * Implemented inside a swipeable vaul Bottom Sheet for progressive disclosure.
 * Shows exact time blocks: "10:00 AM - 10:45 AM: Thermodynamics (#Theory)".
 */
export default function TimelineFeedSheet({
  isOpen,
  onClose,
  sessions = [],
  timeline = [],
  title = 'Activity Timeline Feed',
}) {
  const [selectedTag, setSelectedTag] = useState('#All');

  // Combine today's sessions and timeline sessions chronologically
  const allEvents = useMemo(() => {
    const events = [];

    // Collect sessions from today
    (sessions || []).forEach((s, idx) => {
      events.push({
        id: `today-${idx}-${s.topicId || idx}`,
        date: 'Today',
        timeRange: s.timeRange || '10:00 AM - 10:45 AM',
        topicTitle: s.topicTitle || 'Deep Work Session',
        subjectName: s.subjectName || 'General',
        chapterName: s.chapterName || '',
        tag: s.tag || '#Theory',
        durationMinutes: s.durationMinutes || s.actualMinutes || 0,
        plannedMinutes: s.plannedMinutes || s.durationMinutes || 0,
        actualMinutes: s.actualMinutes || s.durationMinutes || 0,
        loggedAt: s.loggedAt ? new Date(s.loggedAt) : new Date(),
      });
    });

    // Collect sessions from past timeline logs
    (timeline || []).forEach((dayLog) => {
      if (Array.isArray(dayLog.sessions) && dayLog.sessions.length > 0) {
        dayLog.sessions.forEach((s, sIdx) => {
          events.push({
            id: `past-${dayLog.date}-${sIdx}`,
            date: dayLog.date,
            timeRange: s.timeRange || '',
            topicTitle: s.topicTitle || 'Study Session',
            subjectName: s.subjectName || 'General',
            chapterName: s.chapterName || '',
            tag: s.tag || '#Theory',
            durationMinutes: s.durationMinutes || 0,
            plannedMinutes: s.plannedMinutes || s.durationMinutes || 0,
            actualMinutes: s.actualMinutes || s.durationMinutes || 0,
            loggedAt: s.loggedAt ? new Date(s.loggedAt) : new Date(dayLog.date),
          });
        });
      } else if (Array.isArray(dayLog.completedTopics) && dayLog.completedTopics.length > 0) {
        // Fallback for days without granular sessions
        dayLog.completedTopics.forEach((t, tIdx) => {
          events.push({
            id: `topic-${dayLog.date}-${tIdx}`,
            date: dayLog.date,
            timeRange: '',
            topicTitle: t.title || 'Completed Concept',
            subjectName: t.subjectName || 'General',
            chapterName: t.chapterName || '',
            tag: '#Theory',
            durationMinutes: Math.round(
              (dayLog.timeStudiedMinutes || 30) / dayLog.completedTopics.length
            ),
            plannedMinutes: 30,
            actualMinutes: Math.round(
              (dayLog.timeStudiedMinutes || 30) / dayLog.completedTopics.length
            ),
            loggedAt: new Date(dayLog.date),
          });
        });
      }
    });

    return events;
  }, [sessions, timeline]);

  const filteredEvents = useMemo(() => {
    if (selectedTag === '#All') return allEvents;
    return allEvents.filter((e) => e.tag?.toLowerCase() === selectedTag.toLowerCase());
  }, [allEvents, selectedTag]);

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          hapticFeedback.tap();
          onClose?.();
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300" />
        <Drawer.Content
          aria-describedby="timeline-feed-desc"
          className="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] flex flex-col rounded-t-[32px] bg-background-elevated border-t border-[0.5px] border-border outline-none pb-[env(safe-area-inset-bottom)] text-label shadow-sm"
        >
          {/* iOS Thumb Drag Handle Pill */}
          <div className="pt-3 pb-2 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-label-secondary/30" />
          </div>

          {/* Header */}
          <div className="px-6 py-3 border-b border-[0.5px] border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/10 border-[0.5px] border-accent/20 text-accent flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <Drawer.Title className="text-base font-bold text-label tracking-tight">
                  {title}
                </Drawer.Title>
                <p id="timeline-feed-desc" className="text-xs tracking-wide text-label-secondary">
                  Categorized time blocks & habit feed
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                hapticFeedback.tap();
                onClose?.();
              }}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-label-secondary hover:text-label flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tag Filter Pills */}
          <div className="px-6 py-2.5 border-b border-[0.5px] border-border flex items-center gap-2 overflow-x-auto scrollbar-none">
            {AVAILABLE_TAGS.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    hapticFeedback.tap();
                    setSelectedTag(tag);
                  }}
                  className={`px-3 py-1 rounded-full text-xs tracking-wide font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 text-label-secondary hover:text-label'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Vertical Timeline Feed Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(88vh-130px)] space-y-3 custom-scrollbar">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-label-secondary space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-accent opacity-50" />
                <p className="text-sm font-semibold text-label">No sessions logged yet.</p>
                <p className="text-xs tracking-wide text-label-secondary max-w-xs mx-auto">
                  Start a focus timer with a tag like #Theory or #Revision to populate your
                  timeline.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                {filteredEvents.map((evt) => (
                  <div key={evt.id} className="relative group">
                    {/* Timeline Node Bullet */}
                    <div className="absolute -left-[27px] top-2.5 w-3 h-3 rounded-full bg-accent border-2 border-background-elevated shadow-sm" />

                    {/* Timeline Block Card */}
                    <div className="p-3.5 rounded-2xl bg-background border-[0.5px] border-border transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          {/* Time Block & Tag Display */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {evt.timeRange ? (
                              <span className="font-mono text-xs tracking-wide font-semibold text-label">
                                {evt.timeRange}:
                              </span>
                            ) : (
                              <span className="font-mono text-[11px] text-label-secondary">
                                {evt.date} ·
                              </span>
                            )}
                            <span className="font-bold text-label tracking-tight truncate">
                              {evt.topicTitle}
                            </span>
                            <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border-[0.5px] border-accent/20">
                              {evt.tag}
                            </span>
                          </div>

                          {/* Subject & Chapter Context */}
                          <div className="flex items-center gap-1.5 text-xs tracking-wide text-label-secondary">
                            <span className="font-medium">{evt.subjectName}</span>
                            {evt.chapterName && (
                              <>
                                <span>·</span>
                                <span className="truncate">{evt.chapterName}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Duration Stat */}
                        <div className="text-right shrink-0">
                          <span className="font-mono text-sm font-bold text-label block">
                            {evt.durationMinutes}m
                          </span>
                          {evt.plannedMinutes > 0 && evt.plannedMinutes !== evt.durationMinutes && (
                            <span className="text-[10px] font-mono text-label-secondary block">
                              plan: {evt.plannedMinutes}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

