import React, { useState, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, Clock, Play, Trash2 } from 'lucide-react';
import { Drawer } from 'vaul';
import toast from 'react-hot-toast';
import { hapticFeedback } from '../utils/haptics';
import { useTimerStore } from '../store/useTimerStore';
import { useIsMobile } from '../hooks/useMediaQuery';

export default function SwipeableQueueItem({
  item,
  onComplete,
  onSnooze,
  isCompleted = false,
  badge = null,
  isReview = false,
  isSelected = false,
  onSelect = null,
}) {
  const [_swipedAction, setSwipedAction] = useState(null); // 'complete' | 'snooze'
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const longPressTimerRef = useRef(null);
  const isMobile = useIsMobile();
  const x = useMotionValue(0);
  const { activeTopic, isActive, startTimer } = useTimerStore();
  const isTimerThisItem = activeTopic?.id === item.id;

  // Background color and icon opacity transformations based on drag distance
  const greenOpacity = useTransform(x, [0, 50, 90], [0, 0.4, 1]);
  const snoozeOpacity = useTransform(x, [-90, -50, 0], [1, 0.4, 0]);

  const bind = useDrag(
    ({ down, movement: [mx] }) => {
      if (isCompleted) return;

      if (down) {
        // Cancel long press if user begins dragging
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }
        // Limit horizontal drag between -130px and 130px
        const clampedX = Math.max(-130, Math.min(130, mx));
        x.set(clampedX);

        if (clampedX > 80) {
          setSwipedAction('complete');
        } else if (clampedX < -80) {
          setSwipedAction('snooze');
        } else {
          setSwipedAction(null);
        }
      } else {
        // Drag released: trigger action if threshold exceeded
        if (mx > 75) {
          hapticFeedback.swipe(); // navigator.vibrate(50) for light tap
          onComplete(item);
        } else if (mx < -75) {
          hapticFeedback.swipe();
          onSnooze(item);
        }
        // Spring back to center
        x.set(0);
        setSwipedAction(null);
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      rubberband: true,
    }
  );

  const handleClick = (e) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      e.stopPropagation();
      onSelect?.(item, e);
    }
  };

  const handlePointerDown = () => {
    if (!isMobile) return;
    longPressTimerRef.current = setTimeout(() => {
      hapticFeedback.heavy();
      setIsActionSheetOpen(true);
    }, 450);
  };

  const handlePointerUpOrLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
        onContextMenu={(e) => {
          if (isMobile) {
            e.preventDefault();
            hapticFeedback.heavy();
            setIsActionSheetOpen(true);
          }
        }}
        className="relative overflow-hidden select-none group touch-pan-y rounded-none md:rounded-2xl"
      >
        {/* Background Action Underlays (revealed during iOS swipe) */}
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none rounded-none md:rounded-2xl">
          {/* Swipe Right Background: Green Complete / Review */}
          <motion.div
            style={{ opacity: greenOpacity }}
            className="absolute inset-y-0 left-0 w-full bg-success flex items-center pl-5 gap-2 text-white font-bold text-xs tracking-wide"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span>{isReview ? 'Mark Reviewed' : 'Mark Completed'}</span>
          </motion.div>

          {/* Swipe Left Background: Accent Snooze to Tomorrow */}
          <motion.div
            style={{ opacity: snoozeOpacity }}
            className="absolute inset-y-0 right-0 w-full bg-accent flex items-center justify-end pr-5 gap-2 text-white font-bold text-xs tracking-wide"
          >
            <span>Snooze to Tomorrow</span>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </motion.div>
        </div>

        {/* Foreground Swipeable Item Row */}
        <motion.div
          {...bind()}
          style={{ x }}
          className={`relative z-10 px-2 py-3 sm:px-3 sm:py-3.5 transition-all cursor-grab active:cursor-grabbing rounded-xl ${
            isSelected
              ? 'bg-accent/15 dark:bg-accent/25 border border-accent/50 ring-1 ring-accent/40'
              : isCompleted
                ? 'bg-success/10'
                : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Multi-Select Round Pill if onSelect is passed */}
            {onSelect && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item, e);
                }}
                className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'border border-black/20 dark:border-white/20 hover:border-primary'
                }`}
                title="Select for batch action (Hold Shift or ⌘)"
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </motion.button>
            )}

            {/* Check/Complete Button (44x44px touch target) */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                hapticFeedback.checkbox(); // navigator.vibrate(50)
                onComplete(item);
              }}
              className="w-11 h-11 -my-2.5 flex items-center justify-center shrink-0 cursor-pointer"
              title="Click or swipe right to complete"
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'border-success bg-success text-white'
                    : isReview
                      ? 'border-border hover:border-accent hover:bg-accent/10'
                      : 'border-border hover:border-accent hover:bg-accent/10'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <Check className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </motion.button>

            {/* Inset Hairline Container: Border-b only stretches across content (iOS Settings style) */}
            <div className="flex-1 flex items-center justify-between gap-3 min-w-0 border-b-[0.5px] border-border md:border-b-0 pb-3 md:pb-0">
              {/* Topic Info with Apple typographic hierarchy */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-base sm:text-lg font-medium tracking-tight truncate block ${
                      isCompleted ? 'line-through text-label-secondary' : 'text-label'
                    }`}
                  >
                    {item.title}
                  </span>

                  {isReview && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/20 shrink-0">
                      SRS {item.reviewCount ? `Lv.${item.reviewCount}` : 'Due'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs tracking-wide sm:text-sm text-label-secondary pt-0.5">
                  <span className="truncate">{item.subjectName}</span>
                  <span>•</span>
                  <span className="shrink-0">~{item.estimatedHours || 1}h focus</span>
                  {isReview && item.nextReviewDate && (
                    <>
                      <span>•</span>
                      <span className="text-accent font-semibold shrink-0">Due today</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Tag / Badge & Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {badge && (
                  <span className="text-[10px] font-mono font-bold text-label-secondary bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full mr-0.5">
                    {badge}
                  </span>
                )}

                {/* Desktop Contextual Reveal: Action buttons ONLY appear on mouse hover */}
                <div className="hidden md:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {/* Focus Timer Button (44x44px touch target) */}
                  {!isCompleted && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticFeedback.medium();
                        startTimer({
                          id: item.id,
                          title: item.title,
                          subjectName: item.subjectName,
                          chapterName: item.chapterName,
                        });
                      }}
                      className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                        isTimerThisItem && isActive
                          ? 'bg-accent text-white shadow-sm'
                          : isTimerThisItem
                            ? 'bg-accent/20 text-accent'
                            : 'text-label-secondary hover:text-accent hover:bg-accent/10'
                      }`}
                      title={
                        isTimerThisItem && isActive
                          ? 'Focusing now...'
                          : 'Start focus timer on this topic'
                      }
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </motion.button>
                  )}

                  {/* Quick Snooze Button (44x44px touch target) */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      hapticFeedback.tap();
                      onSnooze(item);
                    }}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-label-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                    title="Snooze to tomorrow (or swipe left)"
                  >
                    <Clock className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* PART 3: iOS-Style Vaul Action Sheet (Bottom Drawer on Long Press) */}
      <Drawer.Root open={isActionSheetOpen} onOpenChange={setIsActionSheetOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-opacity duration-300 ease-out" />
          <Drawer.Content
            aria-describedby="action-sheet-desc"
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[28px] bg-background-elevated/95 backdrop-blur-2xl border-t border-border p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] outline-none overflow-hidden space-y-4 max-w-lg mx-auto"
          >
            {/* Grab handle indicator */}
            <div className="mx-auto h-1.5 w-12 rounded-full bg-border shrink-0" />

            {/* Header info */}
            <div className="text-center px-4 space-y-1">
              <Drawer.Title className="text-sm font-semibold text-label truncate">
                {item.title}
              </Drawer.Title>
              <p id="action-sheet-desc" className="text-xs tracking-wide text-label-secondary truncate">
                {item.subjectName} {item.chapterName ? `• ${item.chapterName}` : ''}
              </p>
            </div>

            {/* Action Group Container */}
            <div className="rounded-2xl bg-background border-[0.5px] border-border overflow-hidden divide-y divide-border">
              {/* Action 1: Mark Complete */}
              <button
                type="button"
                onClick={() => {
                  setIsActionSheetOpen(false);
                  hapticFeedback.success();
                  onComplete(item);
                }}
                className="w-full h-14 px-5 text-sm font-semibold flex items-center justify-between text-label active:bg-black/5 dark:active:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Mark Complete</span>
                <Check className="w-5 h-5 text-success stroke-[2.5]" />
              </button>

              {/* Action 2: Snooze */}
              <button
                type="button"
                onClick={() => {
                  setIsActionSheetOpen(false);
                  hapticFeedback.tap();
                  onSnooze(item);
                }}
                className="w-full h-14 px-5 text-sm font-semibold flex items-center justify-between text-label active:bg-black/5 dark:active:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Snooze to Tomorrow</span>
                <Clock className="w-5 h-5 text-accent" />
              </button>

              {/* Action 3: Start Focus Timer */}
              <button
                type="button"
                onClick={() => {
                  setIsActionSheetOpen(false);
                  hapticFeedback.medium();
                  startTimer({
                    id: item.id,
                    title: item.title,
                    subjectName: item.subjectName,
                    chapterName: item.chapterName,
                  });
                }}
                className="w-full h-14 px-5 text-sm font-semibold flex items-center justify-between text-accent active:bg-black/5 dark:active:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Start Focus Timer</span>
                <Play className="w-5 h-5 fill-current" />
              </button>

              {/* Action 4: Delete / Remove */}
              <button
                type="button"
                onClick={() => {
                  setIsActionSheetOpen(false);
                  hapticFeedback.error();
                  onSnooze(item);
                  toast.success(`Removed "${item.title}" from today's queue`);
                }}
                className="w-full h-14 px-5 text-sm font-semibold flex items-center justify-between text-[#FF3B30] active:bg-[#FF3B30]/10 transition-colors cursor-pointer"
              >
                <span>Delete from Queue</span>
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setIsActionSheetOpen(false)}
              className="w-full h-14 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] text-sm font-bold text-text-main dark:text-text-darkMain flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer"
            >
              Cancel
            </button>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

