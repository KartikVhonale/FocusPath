/**
 * Web Worker for Offloading Heavy Math Calculations
 * Processes multi-thousand node syllabus trees, daily pace distributions, and SRS intervals off the main thread.
 */

/**
 * Recursively counts all atomic leaf nodes (topics) across nested subjects.
 */
function countTotalLeafNodes(subjects = []) {
  if (!Array.isArray(subjects)) return 0;
  let total = 0;

  for (const subject of subjects) {
    if (!subject) continue;
    const chapters = subject.chapters || [];
    for (const chapter of chapters) {
      if (!chapter) continue;
      const topics = chapter.topics || [];
      if (topics.length > 0) {
        total += topics.length;
      } else {
        total += 1;
      }
    }
  }

  return total;
}

/**
 * Computes spaced repetition interval based on review count.
 */
function getSrsIntervalDays(reviewCount = 0) {
  const count = Math.max(0, parseInt(reviewCount, 10) || 0);
  switch (count) {
    case 0:
      return 3;
    case 1:
      return 7;
    case 2:
      return 21;
    case 3:
      return 45;
    default:
      return 45;
  }
}

/**
 * Calculates adaptive daily target given syllabus, completed IDs, target date, and study days.
 */
function calculateAdaptiveTarget({
  subjects = [],
  completedIds = [],
  targetDate,
  studyDays = [1, 2, 3, 4, 5, 6], // default Mon-Sat
  vacationDays = [],
  currentDate = new Date().toISOString(),
}) {
  const totalTopics = countTotalLeafNodes(subjects);
  const completedCount = Array.isArray(completedIds) ? completedIds.length : 0;
  const remainingTopics = Math.max(0, totalTopics - completedCount);

  if (remainingTopics === 0) {
    return {
      totalTopics,
      completedCount,
      remainingTopics: 0,
      todayTarget: 0,
      activeDaysRemaining: 0,
      completionPercent: 100,
    };
  }

  const now = new Date(currentDate);
  const target = new Date(targetDate);
  const msPerDay = 24 * 60 * 60 * 1000;

  // Days difference
  const daysDiff = Math.max(0, Math.ceil((target - now) / msPerDay));

  let validStudyDaysCount = 0;
  const vacationSet = new Set(
    (vacationDays || []).map((d) => (typeof d === 'string' ? d.split('T')[0] : ''))
  );

  const cur = new Date(now);
  for (let i = 0; i <= daysDiff; i++) {
    const dayOfWeek = cur.getDay(); // 0 is Sun, 1 is Mon...
    const dateStr = cur.toISOString().split('T')[0];

    const isStudyDay = studyDays.includes(dayOfWeek);
    const isVacation = vacationSet.has(dateStr);

    if (isStudyDay && !isVacation) {
      validStudyDaysCount++;
    }

    cur.setDate(cur.getDate() + 1);
  }

  const activeDays = Math.max(1, validStudyDaysCount);
  const pace = Math.ceil(remainingTopics / activeDays);

  const todayDayOfWeek = now.getDay();
  const todayStr = now.toISOString().split('T')[0];
  const isTodayStudyDay = studyDays.includes(todayDayOfWeek) && !vacationSet.has(todayStr);

  const todayTarget = isTodayStudyDay ? pace : 0;
  const completionPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  return {
    totalTopics,
    completedCount,
    remainingTopics,
    todayTarget,
    dailyPace: pace,
    activeDaysRemaining: activeDays,
    completionPercent,
  };
}

/**
 * Message handler
 */
self.onmessage = function (event) {
  const { type, payload, id } = event.data || {};

  try {
    switch (type) {
      case 'CALCULATE_TARGET': {
        const result = calculateAdaptiveTarget(payload || {});
        self.postMessage({ id, success: true, result });
        break;
      }
      case 'CALCULATE_SRS': {
        const { reviewCount } = payload || {};
        const intervalDays = getSrsIntervalDays(reviewCount);
        self.postMessage({ id, success: true, result: { intervalDays } });
        break;
      }
      case 'COUNT_NODES': {
        const { subjects } = payload || {};
        const count = countTotalLeafNodes(subjects);
        self.postMessage({ id, success: true, result: { totalNodes: count } });
        break;
      }
      default:
        self.postMessage({ id, success: false, error: `Unknown worker task type: ${type}` });
    }
  } catch (err) {
    self.postMessage({ id, success: false, error: err.message || 'Worker computation error' });
  }
};
