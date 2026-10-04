import React, { useState, memo } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';
import { CheckCircle, Undo2, Pencil, Clock, Check, X } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';
import toast from 'react-hot-toast';

/**
 * SwipeableCompletedItem
 *
 * Features:
 * 1. Fluid Undo Gesture: Swipe left to reveal undo action. Releasing past threshold restores task to active queue.
 * 2. Shared Layout Animation: Detaches smoothly and glides back up into UpNextQueue.
 * 3. Quick Edit Popover: Radix Popover to adjust logged minutes without leaving the page.
 */
export const SwipeableCompletedItem = memo(function SwipeableCompletedItem({
  item,
  onUndo,
  onUpdateMinutes,
}) {
  const x = useMotionValue(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editedMinutes, setEditedMinutes] = useState(
    item.durationMinutes || item.timeSpentMinutes || 30
  );
  const [isSaving, setIsSaving] = useState(false);

  // Background opacity transformation during swipe left (negative x)
  const undoOpacity = useTransform(x, [-90, -40, 0], [1, 0.4, 0]);

  const bind = useDrag(
    ({ down, movement: [mx] }) => {
      // Only permit swipe left (drag to the left)
      if (down) {
        const clampedX = Math.max(-120, Math.min(0, mx));
        x.set(clampedX);
      } else {
        if (mx < -70) {
          hapticFeedback.swipe(); // navigator.vibrate(50) for light tap
          onUndo(item);
        }
        x.set(0);
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      rubberband: true,
    }
  );

  const handleSaveMinutes = async (e) => {
    e.preventDefault();
    const mins = Math.max(1, Number(editedMinutes) || 1);
    setIsSaving(true);
    hapticFeedback.light();
    try {
      if (onUpdateMinutes) {
        await onUpdateMinutes(item, mins);
      }
      setIsPopoverOpen(false);
      toast.success(`Updated logged time to ${mins}m`);
    } catch (err) {
      console.error('Failed to update minutes:', err);
      toast.error('Failed to update minutes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative overflow-hidden select-none group touch-pan-y rounded-none md:rounded-2xl">
      {/* Background Swipe Action Underlay (Revealed on Swipe Left) */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none rounded-none md:rounded-2xl">
        <motion.div
          style={{ opacity: undoOpacity }}
          className="absolute inset-y-0 right-0 w-full bg-apple-red/90 flex items-center justify-end pr-5 gap-2 text-white font-bold text-xs tracking-wide"
        >
          <span>Undo Complete</span>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Undo2 className="w-4 h-4 stroke-[2.5]" />
          </div>
        </motion.div>
      </div>

      {/* Foreground Swipeable Card */}
      <motion.div
        {...bind()}
        style={{ x }}
        className="relative bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-xl px-2 py-3 sm:px-3 sm:py-3.5 flex items-center gap-3 transition-colors"
      >
        <CheckCircle className="w-5 h-5 text-success shrink-0 stroke-[2.5]" />

        {/* Inset Hairline Container: Border-b only stretches across content (iOS Settings style) */}
        <div className="flex-1 flex items-center justify-between gap-3 min-w-0 border-b-[0.5px] border-border pb-3">
          {/* Left: Task Title & Metadata with Apple typography */}
          <div className="min-w-0">
            <span className="text-base sm:text-lg font-medium text-label-secondary line-through truncate block">
              {item.title}
            </span>
            <span className="text-xs tracking-wide sm:text-sm text-label-secondary/80 truncate block pt-0.5">
              {item.subjectName} {item.chapterName ? `· ${item.chapterName}` : ''}
            </span>
          </div>

          {/* Right: Logged Time Badge, Quick Edit Pencil Popover & Contextual Undo Button */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Quick Edit Radix Popover */}
            <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <Popover.Trigger asChild>
                <motion.button whileTap={{ scale: 0.96 }}
                  type="button"
                  className="min-h-[36px] inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs tracking-wide font-mono text-label-secondary transition-colors cursor-pointer group/edit"
                  title="Adjust logged time"
                >
                  <span>{editedMinutes}m</span>
                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  side="top"
                  align="end"
                  sideOffset={6}
                  className="z-50 w-56 rounded-2xl bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border p-3 shadow-sm space-y-3 outline-none animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b-[0.5px] border-border">
                    <div className="flex items-center gap-1.5 text-xs tracking-wide font-bold text-label">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>Adjust Logged Minutes</span>
                    </div>
                    <Popover.Close asChild>
                      <motion.button whileTap={{ scale: 0.96 }}
                        type="button"
                        className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-label-secondary"
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    </Popover.Close>
                  </div>

                  <form onSubmit={handleSaveMinutes} className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <motion.button whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => setEditedMinutes((prev) => Math.max(5, Number(prev) - 5))}
                        className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 text-label font-bold text-xs tracking-wide flex items-center justify-center active:scale-95"
                      >
                        -5
                      </motion.button>
                      <input
                        type="number"
                        min="1"
                        max="600"
                        value={editedMinutes}
                        onChange={(e) => setEditedMinutes(e.target.value)}
                        className="w-16 text-center font-mono font-bold text-base bg-black/5 dark:bg-white/5 rounded-xl py-1 px-2 border-[0.5px] border-border outline-none focus:border-accent text-label"
                      />
                      <span className="text-xs tracking-wide font-bold text-label-secondary">min</span>
                      <motion.button whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => setEditedMinutes((prev) => Math.min(600, Number(prev) + 5))}
                        className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 text-label font-bold text-xs tracking-wide flex items-center justify-center active:scale-95"
                      >
                        +5
                      </motion.button>
                    </div>

                    <motion.button whileTap={{ scale: 0.96 }}
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-2 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs tracking-wide font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </motion.button>
                  </form>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            {/* Desktop Contextual Undo Button: ONLY visible on hover */}
            <motion.button whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => {
                hapticFeedback.swipe();
                onUndo(item);
              }}
              className="hidden md:flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl text-label-secondary hover:text-[#FF3B30] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              title="Click or swipe left to undo task"
            >
              <Undo2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default SwipeableCompletedItem;


