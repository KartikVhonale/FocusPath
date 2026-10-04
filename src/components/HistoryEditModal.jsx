import React, { useState, useEffect, useMemo, useRef } from 'react';
import { queryKeys } from '../utils/queryKeys';
import * as Dialog from '@radix-ui/react-dialog';
import { Drawer } from 'vaul';
import { Command } from 'cmdk';
import {
  Sparkles,
  Clock,
  CircleMinus,
  Plus,
  Search,
  RotateCcw,
  X,
  AlertCircle,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { hapticFeedback } from '../utils/haptics';
import { useIsMobile } from '../hooks/useMediaQuery';
import api from '../services/api';

/**
 * HistoryEditModal Component (Apple HIG "Time Machine" Editor)
 *
 * Part 1 & Part 2 of Mobile UX Refactor:
 * - On Desktop (md: and above): Renders as centered Radix Dialog with spatial backdrop.
 * - On Mobile: Renders as vaul Bottom Sheet snapping to bottom of screen with thumb swipe dismiss.
 * - Replaces full syllabus tree with dedicated flat table of completed topics.
 * - iOS-style deletion with CircleMinus and frictionless addition with cmdk Search.
 * - Enforces minimum 44px touch targets across all interactive buttons.
 */
export default function HistoryEditModal({ isOpen, onClose, entry, allSyllabusTopics = [] }) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [minutes, setMinutes] = useState(0);
  const [removedTopicIds, setRemovedTopicIds] = useState(new Set());
  const [stagedAdditions, setStagedAdditions] = useState([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const commandInputRef = useRef(null);

  // Sync state whenever entry or isOpen changes
  useEffect(() => {
    if (isOpen && entry) {
      setMinutes(entry.timeStudiedMinutes || 0);
      setRemovedTopicIds(new Set());
      setStagedAdditions([]);
      setIsAddingTask(false);
      setSearchQuery('');
    }
  }, [isOpen, entry]);

  // Scroll-lock body while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus cmdk search input when add mode is toggled on
  useEffect(() => {
    if (isAddingTask) {
      setTimeout(() => {
        commandInputRef.current?.focus();
      }, 50);
    }
  }, [isAddingTask]);

  const originalTopics = useMemo(() => {
    return entry?.completedTopics || [];
  }, [entry?.completedTopics]);

  // Set of IDs already completed on this date
  const originalTopicIdSet = useMemo(() => {
    return new Set(originalTopics.map((t) => String(t.id || t.nodeId || t._id || t)));
  }, [originalTopics]);

  // Set of staged addition IDs
  const stagedAdditionIdSet = useMemo(() => {
    return new Set(stagedAdditions.map((t) => String(t.id)));
  }, [stagedAdditions]);

  // Filter syllabus topics available to be added as forgotten tasks
  const availableSyllabusTopics = useMemo(() => {
    return (allSyllabusTopics || []).filter((topic) => {
      const topicId = String(topic.id);
      // If already originally in the log and NOT staged for removal, skip
      if (originalTopicIdSet.has(topicId) && !removedTopicIds.has(topicId)) {
        return false;
      }
      // If already staged in additions, skip
      if (stagedAdditionIdSet.has(topicId)) {
        return false;
      }
      return true;
    });
  }, [allSyllabusTopics, originalTopicIdSet, removedTopicIds, stagedAdditionIdSet]);

  // Stage a completed task for removal (iOS-style)
  const handleStageRemoval = (topicId) => {
    hapticFeedback.tap();
    setRemovedTopicIds((prev) => {
      const next = new Set(prev);
      next.add(String(topicId));
      return next;
    });
  };

  // Restore/unstage a task from removal
  const handleUnstageRemoval = (topicId) => {
    hapticFeedback.light();
    setRemovedTopicIds((prev) => {
      const next = new Set(prev);
      next.delete(String(topicId));
      return next;
    });
  };

  // Stage a forgotten topic addition from cmdk search
  const handleAddForgottenTopic = (topic) => {
    hapticFeedback.medium();
    const topicId = String(topic.id);

    // If it was originally in the log and was staged for removal, just unstage removal
    if (originalTopicIdSet.has(topicId) && removedTopicIds.has(topicId)) {
      handleUnstageRemoval(topicId);
    } else {
      setStagedAdditions((prev) => [
        ...prev,
        {
          id: topicId,
          title: topic.title,
          subjectName: topic.subjectName,
          chapterName: topic.chapterName,
        },
      ]);
    }

    setSearchQuery('');
    setIsAddingTask(false);
    toast.success(`Staged "${topic.title}" to log`);
  };

  // Remove a staged addition
  const handleRemoveStagedAddition = (topicId) => {
    hapticFeedback.tap();
    setStagedAdditions((prev) => prev.filter((t) => String(t.id) !== String(topicId)));
  };

  // Mutation to persist historical log edits
  const editMutation = useMutation({
    mutationFn: async () => {
      const added = stagedAdditions.map((t) => String(t.id));
      const removed = Array.from(removedTopicIds).map(String);

      return await api.editHistoryLog({
        date: entry.date,
        addedTopicIds: added,
        removedTopicIds: removed,
        overrideTotalMinutes: Math.max(0, parseInt(minutes, 10) || 0),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.timeline() });
      const previousTimeline = queryClient.getQueryData(['timeline', 30]);

      const parsedMins = Math.max(0, parseInt(minutes, 10) || 0);
      if (previousTimeline && Array.isArray(previousTimeline.timeline)) {
        queryClient.setQueryData(['timeline', 30], (old) => {
          if (!old?.timeline) return old;
          return {
            ...old,
            timeline: old.timeline.map((item) => {
              if (item.date === entry.date) {
                return {
                  ...item,
                  minutesStudied: parsedMins,
                };
              }
              return item;
            }),
          };
        });
      }

      return { previousTimeline };
    },
    onSuccess: () => {
      hapticFeedback.success();
      toast.success(`Time Machine: Log for ${entry.date} updated!`);
      onClose();
    },
    onError: (err, variables, context) => {
      console.error('Failed to update historical log:', err);
      if (context?.previousTimeline) {
        queryClient.setQueryData(['timeline', 30], context.previousTimeline);
      }
      toast.error(err.message || 'Failed to update historical log.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: ['studyPlan'] });
      queryClient.invalidateQueries({ queryKey: ['reportsTrends'] });
      queryClient.invalidateQueries({ queryKey: ['reportsDistribution'] });
    },
  });

  if (!entry) return null;

  const formattedDate = entry.date
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(entry.date + 'T00:00:00'))
    : '';

  const activeTopicCount = originalTopics.length - removedTopicIds.size + stagedAdditions.length;
  const hasChanges =
    removedTopicIds.size > 0 ||
    stagedAdditions.length > 0 ||
    parseInt(minutes, 10) !== (entry?.timeStudiedMinutes || 0);

  const TitleComponent = isMobile ? Drawer.Title : Dialog.Title;

  const modalInnerContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-black/5 dark:border-white/5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 fill-primary/20" />
          </div>
          <div className="min-w-0">
            <TitleComponent className="text-base font-black text-text-main dark:text-text-darkMain tracking-tight truncate">
              Time Machine: Edit Log
            </TitleComponent>
            <p id="time-machine-desc" className="text-xs tracking-wide text-text-muted font-mono truncate">
              {formattedDate} {entry?.date ? `(${entry.date})` : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            hapticFeedback.tap();
            onClose();
          }}
          className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text-main transition-colors cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 py-2 pr-1">
        {/* Total Minutes Focused Input */}
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2">
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Total Study Duration (Minutes)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="1440"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="flex-1 bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-text-main dark:text-text-darkMain focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm min-h-[44px]"
              placeholder="e.g. 90"
            />
            <span className="text-xs tracking-wide font-semibold text-text-muted shrink-0">
              {Math.round(((parseInt(minutes, 10) || 0) / 60) * 10) / 10} hours
            </span>
          </div>
        </div>

        {/* Flat Table of Completed Tasks for This Day */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Completed Tasks on this Day ({activeTopicCount})
            </span>
            {hasChanges && (
              <span className="text-[10px] font-bold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-full">
                Modified
              </span>
            )}
          </div>

          {originalTopics.length === 0 && stagedAdditions.length === 0 ? (
            <div className="py-8 text-center rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 p-4 space-y-2">
              <AlertCircle className="w-6 h-6 text-text-muted mx-auto opacity-50" />
              <p className="text-xs tracking-wide font-semibold text-text-muted">
                No tasks were logged for this day.
              </p>
              <p className="text-[11px] text-text-muted">
                Use the button below to retroactively add forgotten tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Originally logged tasks */}
              {originalTopics.map((topic) => {
                const topicId = String(topic.id || topic.nodeId || topic._id || topic);
                const isStagedForRemoval = removedTopicIds.has(topicId);

                return (
                  <div
                    key={topicId}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      isStagedForRemoval
                        ? 'bg-[#FF3B30]/10 border-[#FF3B30]/25 opacity-70'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-border hover:border-accent/40'
                    }`}
                  >
                    {/* Topic info */}
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="min-w-0">
                        <span
                          className={`text-xs tracking-wide font-bold truncate block ${
                            isStagedForRemoval ? 'line-through text-[#FF3B30]' : 'text-label'
                          }`}
                        >
                          {topic.title || topicId}
                        </span>
                        <span className="text-[10px] text-label-secondary truncate block">
                          {topic.subjectName || 'Subject'}{' '}
                          {topic.chapterName ? `• ${topic.chapterName}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* iOS-Style Deletion / Undo Action with 44x44px touch targets */}
                    <div className="flex items-center shrink-0">
                      {isStagedForRemoval ? (
                        <button
                          type="button"
                          onClick={() => handleUnstageRemoval(topicId)}
                          className="min-h-[44px] px-3 py-1.5 rounded-xl bg-background-elevated text-label text-xs tracking-wide font-semibold border-[0.5px] border-border hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Restore task"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStageRemoval(topicId)}
                          className="min-w-[44px] min-h-[44px] -my-1.5 -mr-1.5 flex items-center justify-center rounded-xl text-[#FF3B30] hover:bg-[#FF3B30]/10 active:scale-90 transition-all cursor-pointer"
                          title="Stage for removal (iOS style)"
                        >
                          <CircleMinus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Staged Additions (Newly Added Forgotten Tasks) */}
              {stagedAdditions.map((topic) => (
                <div
                  key={`staged-${topic.id}`}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-success/10 border border-success/25 transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs tracking-wide font-bold text-success truncate block">
                        {topic.title}
                      </span>
                      <span className="text-[9px] font-bold bg-success/20 text-success px-1.5 py-0.2 rounded-md shrink-0">
                        Staged
                      </span>
                    </div>
                    <span className="text-[10px] text-success/80 truncate block">
                      {topic.subjectName} {topic.chapterName ? `• ${topic.chapterName}` : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveStagedAddition(topic.id)}
                    className="min-w-[44px] min-h-[44px] -my-1.5 -mr-1.5 flex items-center justify-center rounded-xl text-label-secondary hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer shrink-0"
                    title="Remove staged addition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Frictionless Addition: cmdk Search Input */}
        <div className="pt-1">
          {!isAddingTask ? (
            <button
              type="button"
              onClick={() => {
                hapticFeedback.tap();
                setIsAddingTask(true);
              }}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl border border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary text-xs tracking-wide font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add forgotten task</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-primary/40 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  <span>Search & Add Forgotten Task</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTask(false);
                    setSearchQuery('');
                  }}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-main transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* cmdk Command Container */}
              <Command
                className="w-full bg-white dark:bg-black/60 rounded-xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden"
                loop
              >
                <div className="flex items-center px-3 py-2 border-b border-black/5 dark:border-white/5 gap-2">
                  <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <Command.Input
                    ref={commandInputRef}
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    placeholder="Search e.g. K-Maps, Calculus, Thermodynamics..."
                    className="w-full bg-transparent text-xs tracking-wide font-medium outline-none text-text-main dark:text-text-darkMain placeholder:text-text-muted/60 min-h-[36px]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="min-w-[44px] min-h-[36px] flex items-center justify-center text-[10px] text-text-muted hover:text-text-main"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <Command.List className="max-h-44 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                  <Command.Empty className="py-4 text-center text-xs tracking-wide text-text-muted">
                    No matching syllabus topics found.
                  </Command.Empty>

                  {availableSyllabusTopics.map((topic) => (
                    <Command.Item
                      key={topic.id}
                      value={`${topic.title} ${topic.chapterName || ''} ${topic.subjectName || ''}`}
                      onSelect={() => handleAddForgottenTopic(topic)}
                      className="flex items-center justify-between p-2 rounded-lg text-xs tracking-wide cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary min-h-[44px]"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold block truncate">{topic.title}</span>
                        <span className="text-[10px] text-text-muted truncate block">
                          {topic.subjectName} {topic.chapterName ? `• ${topic.chapterName}` : ''}
                        </span>
                      </div>
                      <Plus className="w-4 h-4 shrink-0 opacity-70" />
                    </Command.Item>
                  ))}
                </Command.List>
              </Command>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls with 44px min-height touch targets */}
      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-4 py-2.5 rounded-2xl text-xs tracking-wide font-semibold text-text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={editMutation.isPending || !hasChanges}
          onClick={() => editMutation.mutate()}
          className="min-h-[44px] py-2.5 px-5 rounded-2xl bg-primary hover:bg-[#ff5252] text-white font-bold text-xs tracking-wide shadow-md shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {editMutation.isPending ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  // Mobile Bottom Sheet (Vaul Drawer)
  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out" />
          <Drawer.Content
            aria-describedby="time-machine-desc"
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[28px] bg-background-elevated/95 backdrop-blur-2xl border-t border-[0.5px] border-border max-h-[88vh] outline-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] overflow-hidden"
          >
            {/* Grab handle indicator */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/20 dark:bg-white/20 shrink-0" />
            {modalInnerContent}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop Centered Modal (Radix Dialog)
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Spatial Blur Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out" />

        {/* Modal Window */}
        <Dialog.Content
          aria-describedby="time-machine-desc"
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[94vw] max-w-lg rounded-3xl bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border shadow-sm p-6 flex flex-col max-h-[85vh] outline-none animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        >
          {modalInnerContent}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}



