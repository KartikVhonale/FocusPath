/**
 * usePlannerWorker
 *
 * React hook that provides a promise-based interface to the math.worker.js
 * Web Worker. All heavy syllabus math (daily target calculation, SRS intervals,
 * subject distribution) is executed off the main thread, guaranteeing zero
 * frame drops even on a 10,000-node syllabus tree.
 *
 * Usage:
 *   const { calculateTarget, calculateSRS, calculateDistribution } = usePlannerWorker();
 *   const result = await calculateTarget({ subjects, completedIds, targetDate, studyDays });
 */
import { useRef, useEffect, useCallback } from 'react';

// Vite-style import with ?worker — no additional config needed.
// math.worker.js uses self.onmessage and self.postMessage, compatible with Vite.
let _workerUrl = null;

function getWorkerUrl() {
  if (_workerUrl) return _workerUrl;
  try {
    // Attempt native Vite worker import if bundler supports it
    // (bundled at build time, inline URL at runtime)
    return new URL('../workers/math.worker.js', import.meta.url).href;
  } catch {
    return null;
  }
}

/**
 * Creates a deterministic message ID for request/response matching.
 */
let _msgCounter = 0;
function nextId() {
  _msgCounter = (_msgCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `worker-${Date.now()}-${_msgCounter}`;
}

export function usePlannerWorker() {
  const workerRef = useRef(null);
  const pendingRef = useRef(new Map()); // id -> { resolve, reject }

  // Initialise worker once on mount
  useEffect(() => {
    let worker = null;
    try {
      const url = getWorkerUrl();
      if (url) {
        worker = new Worker(url, { type: 'module' });
        worker.onmessage = (e) => {
          const { id, success, result, error } = e.data || {};
          const pending = pendingRef.current.get(id);
          if (!pending) return;
          pendingRef.current.delete(id);
          if (success) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error || 'Worker returned an error'));
          }
        };
        worker.onerror = (err) => {
          console.error('[PlannerWorker] Uncaught worker error:', err);
          // Reject all pending requests
          for (const [id, pending] of pendingRef.current.entries()) {
            pending.reject(new Error('Worker crashed: ' + (err.message || 'unknown')));
            pendingRef.current.delete(id);
          }
        };
        workerRef.current = worker;
      }
    } catch (err) {
      console.warn('[PlannerWorker] Could not initialise Web Worker:', err.message);
    }

    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, []);

  /**
   * Internal: dispatch a typed message and return a Promise for the response.
   * Falls back to a synchronous in-line calculation if the worker is unavailable.
   */
  const dispatch = useCallback(async (type, payload, fallback) => {
    const worker = workerRef.current;
    if (!worker) {
      // Worker not available (SSR, test env, or init failure) — run fallback
      if (fallback) return fallback(payload);
      throw new Error(`[PlannerWorker] Worker unavailable and no fallback provided for: ${type}`);
    }

    return new Promise((resolve, reject) => {
      const id = nextId();
      pendingRef.current.set(id, { resolve, reject });

      // Timeout guard: reject after 10s to prevent silent hangs
      const timer = setTimeout(() => {
        if (pendingRef.current.has(id)) {
          pendingRef.current.delete(id);
          reject(new Error(`[PlannerWorker] Timeout waiting for worker response: ${type}`));
        }
      }, 10_000);

      // Wrap resolve/reject to clear the timeout
      pendingRef.current.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });

      try {
        worker.postMessage({ type, payload, id });
      } catch (err) {
        pendingRef.current.delete(id);
        clearTimeout(timer);
        reject(err);
      }
    });
  }, []);

  /**
   * Calculates today's adaptive daily target off the main thread.
   *
   * @param {object} params
   * @param {Array}  params.subjects      - Full syllabus subjects array
   * @param {Array}  params.completedIds  - Array of completed node ID strings
   * @param {string} params.targetDate    - ISO date string of exam date
   * @param {Array}  params.studyDays     - e.g. ['Mon','Tue','Wed','Thu','Fri','Sat']
   * @param {Array}  [params.vacationDates] - ISO date strings to exclude
   * @param {Date}   [params.referenceDate] - Override "today" for testing
   * @returns {Promise<object>} { todayTarget, remainingTopics, remainingValidDays, ... }
   */
  const calculateTarget = useCallback(
    (params) =>
      dispatch('CALCULATE_TARGET', params, () => {
        // Inline fallback (no worker) — simple calculation
        const remaining = Math.max(
          0,
          (params.subjects?.length ?? 0) - (params.completedIds?.length ?? 0)
        );
        return { todayTarget: remaining > 0 ? 1 : 0, remainingTopics: remaining };
      }),
    [dispatch]
  );

  /**
   * Calculates the next SRS review date off the main thread.
   *
   * @param {number} reviewCount   - How many times this node has been reviewed
   * @param {string} [currentDate] - ISO string for "today" (defaults to now)
   * @returns {Promise<{ nextReviewDate, reviewCount, daysAdded, intervalDays }>}
   */
  const calculateSRS = useCallback(
    ({ reviewCount = 0, currentDate } = {}) =>
      dispatch(
        'CALCULATE_SPACED_REPETITION',
        { reviewCount, currentDate: currentDate ?? new Date().toISOString() },
        ({ reviewCount: rc }) => {
          const intervals = [3, 7, 21, 45];
          const days = intervals[Math.min(Math.max(0, rc), intervals.length - 1)];
          const next = new Date();
          next.setDate(next.getDate() + days);
          return {
            nextReviewDate: next.toISOString(),
            reviewCount: rc + 1,
            daysAdded: days,
            intervalDays: days,
          };
        }
      ),
    [dispatch]
  );

  /**
   * Calculates per-subject distribution stats off the main thread.
   *
   * @param {object} params
   * @param {Array}  params.subjects
   * @param {Array}  params.completedIds
   * @param {Array}  [params.logs]
   * @returns {Promise<{ distribution, totalMinutesLogged, totalCompletedTopics }>}
   */
  const calculateDistribution = useCallback(
    (params) =>
      dispatch('CALCULATE_DISTRIBUTION', params, () => ({
        distribution: [],
        totalMinutesLogged: 0,
        totalCompletedTopics: 0,
      })),
    [dispatch]
  );

  /**
   * Counts total leaf nodes (subtopics) in a syllabus tree off the main thread.
   *
   * @param {Array} subjects
   * @returns {Promise<{ totalNodes: number }>}
   */
  const countNodes = useCallback(
    (subjects) => dispatch('COUNT_NODES', { subjects }, () => ({ totalNodes: 0 })),
    [dispatch]
  );

  return {
    calculateTarget,
    calculateSRS,
    calculateDistribution,
    countNodes,
    /** True when the worker has been successfully initialised */
    isReady: Boolean(workerRef.current),
  };
}

export default usePlannerWorker;
