import { hapticFeedback } from './haptics.js';

/**
 * Formats seconds into digital timer display (HH:MM:SS or MM:SS)
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds = 0) {
  const totalSecs = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`;
}

/**
 * Calculates progress percentage safely with divide-by-zero protection
 * @param {number} completed
 * @param {number} total
 * @returns {number} Integer between 0 and 100
 */
export function calculateProgress(completed = 0, total = 0) {
  const comp = Number(completed) || 0;
  const tot = Number(total) || 0;
  if (!tot || tot <= 0) return comp > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((comp / tot) * 100)));
}

/**
 * Returns contextual Apple HIG greeting based on time of day
 * @param {Date|string|number} date
 * @returns {string}
 */
export function getGreeting(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const hour = isNaN(d.getTime()) ? new Date().getHours() : d.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning,';
  if (hour >= 12 && hour < 17) return 'Good afternoon,';
  if (hour >= 17 && hour < 22) return 'Good evening,';
  return 'Late night focus,';
}

/**
 * Returns whether Apple Night Shift comfort lighting should be active (10 PM to 4:59 AM)
 * @param {Date|string|number} date
 * @returns {boolean}
 */
export function isNightShift(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const hour = isNaN(d.getTime()) ? new Date().getHours() : d.getHours();
  return hour >= 22 || hour < 5;
}

export { hapticFeedback };
export { exportStudyDataToCsv } from './exportCsv.js';
export {
  calculateTargetAsync,
  calculateSpacedRepetitionAsync,
  calculateDistributionAsync,
} from './asyncMathEngine.js';
export { toastThrottler } from './toastThrottler.js';
export * from './notifications.js';
