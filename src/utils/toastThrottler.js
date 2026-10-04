/**
 * Toast Throttler & Debouncer
 * Groups rapid successive notifications into a unified, consolidated summary toast.
 * Prevents toast stacking during bulk completion or rapid check-offs.
 */
import toast from 'react-hot-toast';

let pendingCompletions = 0;
let completionTimer = null;
const THROTTLE_WINDOW_MS = 400;

export const toastThrottler = {
  /**
   * Dispatches a single topic completion notification or batches multiple rapid completions.
   *
   * @param {string} topicTitle - Title of the topic completed
   */
  notifyCompletion(topicTitle) {
    pendingCompletions++;

    if (completionTimer) {
      clearTimeout(completionTimer);
    }

    completionTimer = setTimeout(() => {
      if (pendingCompletions === 1) {
        toast.success(`Completed "${topicTitle}"`, { id: 'topic-complete' });
      } else if (pendingCompletions > 1) {
        toast.success(`${pendingCompletions} topics marked complete`, {
          id: 'topic-complete-batch',
        });
      }
      pendingCompletions = 0;
      completionTimer = null;
    }, THROTTLE_WINDOW_MS);
  },

  /**
   * Immediate success notification with debounced ID.
   */
  success(message, id) {
    return toast.success(message, id ? { id } : undefined);
  },

  /**
   * Immediate error notification with debounced ID.
   */
  error(message, id) {
    return toast.error(message, id ? { id } : undefined);
  },
};

export default toastThrottler;
