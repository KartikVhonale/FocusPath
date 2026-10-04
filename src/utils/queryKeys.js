/**
 * Strict Dictionary of React Query Keys
 * Used for consistent caching and invalidation across the app.
 */
export const queryKeys = {
  // User/Auth
  user: () => ['userData'],
  
  // Dashboard / Focus Tab
  dashboard: () => ['dashboard'],
  
  // Timeline / History
  timeline: (limit = '') => ['timeline', limit],
  dailyLog: (dateStr) => ['dailyLog', dateStr],
  
  // Path Analytics
  trends: () => ['trends'],
  distribution: () => ['distribution'],
  leaderboard: () => ['leaderboard'],
  
  // Syllabus
  currentPlan: () => ['currentPlan'],
  syllabus: () => ['syllabus'],
  
  // Classroom / Teacher
  teacherClassrooms: () => ['teacherClassrooms'],
  teacherStudents: () => ['teacherStudents'],
  teacherFeed: () => ['teacherFeed'],
};
