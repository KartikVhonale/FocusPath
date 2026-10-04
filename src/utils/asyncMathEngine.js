/**
 * Asynchronous Math Engine
 * Dispatches heavy syllabus computations to the Web Worker for 120fps UI responsiveness.
 * Includes synchronous fallbacks when Web Workers are unavailable.
 */

let workerInstance = null;
let messageId = 0;
const pendingCallbacks = new Map();

function getWorker() {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('../workers/math.worker.js', import.meta.url), {
        type: 'module',
      });

      workerInstance.onmessage = (event) => {
        const { id, success, result, error } = event.data || {};
        const callback = pendingCallbacks.get(id);
        if (callback) {
          pendingCallbacks.delete(id);
          if (success) {
            callback.resolve(result);
          } else {
            callback.reject(new Error(error));
          }
        }
      };

      workerInstance.onerror = (err) => {
        console.warn('MathWorker encountered an error, falling back to synchronous:', err);
      };
    } catch (e) {
      console.warn('Failed to initialize Math Web Worker, falling back to sync:', e);
      workerInstance = null;
    }
  }

  return workerInstance;
}

/**
 * Dispatches an adaptive target calculation asynchronously to the worker.
 */
export function calculateTargetAsync(payload) {
  const worker = getWorker();

  if (!worker) {
    // Synchronous fallback
    const { subjects = [], completedIds = [] } = payload || {};
    const totalTopics = (subjects || []).reduce(
      (acc, sub) => acc + (sub?.chapters?.length || 0),
      0
    );
    const completedCount = Array.isArray(completedIds) ? completedIds.length : 0;
    const remaining = Math.max(0, totalTopics - completedCount);
    return Promise.resolve({
      totalTopics,
      completedTopics: completedCount,
      remainingTopics: remaining,
      todayTarget: Math.ceil(remaining / 30),
      completionPercent: totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0,
    });
  }

  return new Promise((resolve, reject) => {
    const id = ++messageId;
    pendingCallbacks.set(id, { resolve, reject });
    worker.postMessage({ type: 'CALCULATE_TARGET', payload, id });
  });
}

/**
 * Dispatches spaced repetition interval calculation asynchronously to the worker.
 */
export function calculateSpacedRepetitionAsync(payload) {
  const worker = getWorker();

  if (!worker) {
    const { reviewCount = 0, currentDate = new Date() } = payload || {};
    const intervals = [3, 7, 21, 45];
    const count = Math.max(0, Number(reviewCount) || 0);
    const daysToAdd = intervals[Math.min(count, intervals.length - 1)];
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return Promise.resolve({
      nextReviewDate: nextDate.toISOString(),
      reviewCount: count + 1,
      daysAdded: daysToAdd,
      intervalDays: daysToAdd,
    });
  }

  return new Promise((resolve, reject) => {
    const id = ++messageId;
    pendingCallbacks.set(id, { resolve, reject });
    worker.postMessage({ type: 'CALCULATE_SPACED_REPETITION', payload, id });
  });
}

/**
 * Dispatches subject distribution calculation asynchronously to the worker.
 */
export function calculateDistributionAsync(payload) {
  const worker = getWorker();

  if (!worker) {
    const { subjects = [], completedIds = [], totalMinutesLogged = 0 } = payload || {};
    const completedSet = new Set((completedIds || []).map(String));
    const distribution = (subjects || []).map((subj) => ({
      subject: subj.name || subj.subjectName || 'Subject',
      completedTopics: (subj.chapters || []).filter((c) => completedSet.has(String(c.id))).length,
      totalTopics: subj.chapters?.length || 1,
      percentage: 0,
      minutesStudied: 0,
    }));
    return Promise.resolve({
      distribution,
      totalMinutesLogged,
      totalCompletedTopics: completedSet.size,
    });
  }

  return new Promise((resolve, reject) => {
    const id = ++messageId;
    pendingCallbacks.set(id, { resolve, reject });
    worker.postMessage({ type: 'CALCULATE_DISTRIBUTION', payload, id });
  });
}
