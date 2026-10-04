/**
 * iOS / Mobile Haptic Feedback Utility
 * Uses the Web Vibration API when available on mobile devices
 */

export const triggerHaptic = (pattern = 50) => {
  try {
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator
    ) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Vibration API blocked or unsupported; silent fallback
  }
};

export const hapticFeedback = {
  tap: () => triggerHaptic(30),
  light: () => triggerHaptic(50),
  checkbox: () => triggerHaptic(50),
  // Swipe to complete/undo a task: navigator.vibrate(50) (Light tap)
  swipe: () => triggerHaptic(50),
  medium: () => triggerHaptic(70),
  heavy: () => triggerHaptic(100),
  success: () => triggerHaptic([30, 50, 30]),
  // Complete an entire chapter via bulk action: navigator.vibrate([30, 50, 30]) (Success burst)
  bulkComplete: () => triggerHaptic([30, 50, 30]),
  timerSuccess: () => triggerHaptic([30, 50, 30]),
  warning: () => triggerHaptic([60, 40, 60]),
  // Error (e.g., trying to start a timer without selecting a topic): navigator.vibrate([100, 50, 100]) (Double heavy warning)
  error: () => triggerHaptic([100, 50, 100]),
};

export default triggerHaptic;
