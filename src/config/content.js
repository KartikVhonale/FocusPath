/**
 * Centralized Application Copy & Content
 * Strict Rule: Zero forbidden words.
 */

export const APP_CONTENT = {
  appName: 'FocusPath',
  tagline: 'Precision Study Tracking & Adaptive Mastery',
  navigation: {
    focus: 'Focus',
    plan: 'Plan',
    path: 'Path',
    classroom: 'Classroom',
    profile: 'Profile',
    timeMachine: 'Time Machine',
  },
  timer: {
    ready: 'Ready to deep work',
    running: 'Deep Work Active',
    paused: 'Session Paused',
    completed: 'Session Complete',
    startSession: 'Start Focus Session',
    pauseSession: 'Pause Session',
    resumeSession: 'Resume Session',
    stopSession: 'Finish & Log',
  },
  studyPlan: {
    dailyTargetTitle: "Today's Target",
    activePaceTitle: 'Pace Needed',
    daysLeftTitle: 'Days Remaining',
    completedTitle: 'Completed Topics',
    streakTitle: 'Active Streak',
    emptyPlanTitle: 'No Study Plan Active',
    emptyPlanSubtitle:
      'Select a competitive exam syllabus or customize your own roadmap to begin adaptive tracking.',
    createPlanButton: 'Create Study Plan',
    recalculateButton: 'Recalculate Pace',
  },
  timeMachine: {
    title: 'Time Machine',
    subtitle:
      'Retroactively record past study sessions and topic completions with zero math drift.',
    saveChanges: 'Save History Record',
    savedSuccess: 'Past study log synchronized successfully.',
  },
  errors: {
    networkError: 'Unable to connect to the server. Your offline changes are saved locally.',
    authFailed: 'Session expired or invalid credentials. Please sign in again.',
    generic: "Something went wrong. Don't worry, your study progress is safe.",
    notFound: 'The requested resource was not found.',
  },
};

export default APP_CONTENT;
