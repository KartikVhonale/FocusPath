import axios from 'axios';
import localforage from 'localforage';

// Clean & normalize API root URL from environment variables
const rawApiUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000'
)
  .trim()
  .replace(/\/+$/, '');

// Ensure baseURL always ends with '/api' without duplicating it
export const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Auth Expiry on protected endpoints only
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint =
      error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');

    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      // Token expired or invalid during protected request
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Direct HTTP methods backed by authenticated Axios client
  get: (url, config) => client.get(url, config),
  post: (url, data, config) => client.post(url, data, config),
  put: (url, data, config) => client.put(url, data, config),
  delete: (url, config) => client.delete(url, config),
  patch: (url, data, config) => client.patch(url, data, config),
  client,

  // Topic & Chapter Management
  addTopic: async (examId, subjectIndex, newTitle, subjectName) => {
    const res = await client.put(`/admin/exams/${examId}/topics`, {
      action: 'add',
      subjectIndex,
      subjectName,
      newTitle,
    });
    return res.data;
  },
  editTopic: async (examId, chapterId, newTitle, subjectIndex) => {
    const res = await client.put(`/admin/exams/${examId}/topics`, {
      action: 'edit',
      chapterId,
      newTitle,
      subjectIndex,
    });
    return res.data;
  },
  deleteTopic: async (examId, chapterId, subjectIndex) => {
    const res = await client.put(`/admin/exams/${examId}/topics`, {
      action: 'delete',
      chapterId,
      subjectIndex,
    });
    return res.data;
  },

  // Authentication
  register: async (username, email, password, accountMode = 'self_study', teacherCode = '') => {
    const res = await client.post('/auth/register', {
      username,
      email,
      password,
      accountMode,
      teacherCode,
    });
    return res.data;
  },
  login: async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await client.get('/auth/me');
    return res.data;
  },

  // Teacher / Cohort Management
  generateTeacherCode: async () => {
    const res = await client.post('/teacher/generate-code');
    return res.data;
  },
  createTeacherClass: async (classData) => {
    const res = await client.post('/teacher/create-class', classData);
    return res.data;
  },
  getTeacherClassrooms: async () => {
    const res = await client.get('/teacher/classrooms');
    return res.data;
  },
  joinClass: async (classCode) => {
    const res = await client.post('/join-class', { classCode });
    return res.data;
  },
  assignTeacherPlan: async (planData) => {
    const res = await client.post('/teacher/assign-plan', planData);
    return res.data;
  },
  updateTeacherNotes: async (cohortNotes) => {
    const res = await client.post('/teacher/update-notes', { cohortNotes });
    return res.data;
  },
  getTeacherStudents: async () => {
    const res = await client.get('/teacher/students');
    return res.data;
  },
  getTeacherOverview: async () => {
    const res = await client.get('/teacher/overview');
    return res.data;
  },
  updateStudentTarget: async (studentId, { target, notes }) => {
    const res = await client.put(`/teacher/student/${studentId}/override-target`, {
      target,
      notes,
    });
    return res.data;
  },

  // Mutable Custom Syllabus (Self-Study & Customization)
  addCustomTopic: async (topicData) => {
    const res = await client.post('/study-plan/add-custom-topic', topicData);
    return res.data;
  },
  removeTopic: async (nodeId) => {
    const res = await client.delete('/study-plan/remove-topic', { data: { nodeId } });
    return res.data;
  },
  renameTopic: async ({ nodeId, newTitle }) => {
    const res = await client.patch('/study-plan/rename-topic', { nodeId, newTitle });
    return res.data;
  },
  reorderSubtopics: async (reorderData) => {
    const res = await client.patch('/study-plan/reorder-subtopics', reorderData);
    return res.data;
  },

  // Exams
  getExams: async () => {
    const res = await client.get('/exams');
    return res.data;
  },
  getExamDetails: async (id) => {
    const res = await client.get(`/exams/${id}`);
    return res.data;
  },

  // Study Plan
  createStudyPlan: async ({ examId, targetDate, studyDays }) => {
    const res = await client.post('/study-plan', {
      examId,
      targetDate,
      studyDays,
    });
    return res.data;
  },
  getCurrentPlan: async () => {
    const res = await client.get('/study-plan/current');
    return res.data;
  },

  // Dashboard (with Midnight Reset & Recalculation)
  getDashboard: async () => {
    const res = await client.get('/dashboard');
    return res.data;
  },

  // Update Daily Progress
  updateProgress: async ({ studyPlanId, increment = 1, chapterId, isCompleted }) => {
    const res = await client.post('/progress', {
      studyPlanId,
      increment,
      chapterId,
      isCompleted,
    });
    return res.data;
  },

  // Spaced Repetition (SRS) Toggle / Review / Snooze
  toggleNodeSRS: async ({ studyPlanId, nodeId, isCompleted, action }) => {
    const res = await client.post('/study-plan/toggle-node', {
      studyPlanId,
      nodeId,
      isCompleted,
      action,
    });
    return res.data;
  },

  // Focus Timer Session
  submitTimerSession: async ({ studyPlanId, timeStudiedMinutes, topicsCompleted }) => {
    const res = await client.post('/timer/session', {
      studyPlanId,
      timeStudiedMinutes,
      topicsCompleted,
    });
    return res.data;
  },

  // Granular Per-Subtopic & Categorized Time Logging
  logTopicTime: async (payload) => {
    try {
      const res = await client.post('/study-plan/log-time', payload);
      return res.data;
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK') {
        const queue = (await localforage.getItem('offline_mutation_queue')) || [];
        queue.push({ type: 'logTopicTime', payload });
        await localforage.setItem('offline_mutation_queue', queue);
        console.warn('Network offline. Pushed time log to offline_mutation_queue.');
        return { success: true, offline: true };
      }
      throw err;
    }
  },

  // Historical Daily Logs
  getLogs: async (days = 7) => {
    const res = await client.get(`/logs?days=${days}`);
    return res.data;
  },

  // Deep Analytics & Reporting
  getTeacherStudentProfile: async (studentId) => {
    const res = await client.get(`/teacher/student-profile/${studentId}`);
    return res.data;
  },
  getTeacherActivityFeed: async () => {
    const res = await client.get('/teacher/activity-feed');
    return res.data;
  },
  getTeacherCohortTelemetry: async () => {
    const res = await client.get('/teacher/cohort-telemetry');
    return res.data;
  },
  getCohortLeaderboard: async () => {
    const res = await client.get('/cohort/leaderboard');
    return res.data;
  },
  getSubjectDistribution: async () => {
    const res = await client.get('/reports/distribution');
    return res.data;
  },
  getTrendsReport: async () => {
    const res = await client.get('/reports/trends');
    return res.data;
  },

  // History & Reflection
  getYesterdayHistory: async () => {
    const res = await client.get('/history/yesterday');
    return res.data;
  },
  getTimelineHistory: async (days = 30) => {
    const res = await client.get(`/history/timeline?days=${days}`);
    return res.data;
  },
  editHistoryLog: async ({ date, addedTopicIds, removedTopicIds, overrideTotalMinutes }) => {
    const res = await client.patch('/history/edit-log', {
      date,
      addedTopicIds,
      removedTopicIds,
      overrideTotalMinutes,
    });
    return res.data;
  },
  completeChapter: async ({ chapterId }) => {
    const res = await client.post('/study-plan/complete-chapter', { chapterId });
    return res.data;
  },
  addPersonalSubtopic: async (payload) => {
    const res = await client.post('/study-plan/add-personal-subtopic', payload);
    return res.data;
  },
  pushSyllabusUpdate: async ({ classCode, examId }) => {
    const res = await client.post('/teacher/push-syllabus-update', { classCode, examId });
    return res.data;
  },
  // Auto-Pilot Smart Scheduler (Zero Friction)
  autoSchedule: async (payload = {}) => {
    const res = await client.post('/study-plan/auto-schedule', payload);
    return res.data;
  },
  togglePlanPause: async () => {
    const res = await client.post('/study-plan/toggle-pause');
    return res.data;
  },
  recalculatePlan: async () => {
    const res = await client.post('/study-plan/recalculate');
    return res.data;
  },

    syncOfflineQueue: async () => {
    try {
      const queue = (await localforage.getItem('offline_mutation_queue')) || [];
      if (queue.length === 0) return;
      
      console.log(`Syncing ${queue.length} offline mutations to MongoDB...`);
      for (const item of queue) {
        if (item.type === 'logTopicTime') {
          await client.post('/study-plan/log-time', item.payload);
        }
      }
      await localforage.removeItem('offline_mutation_queue');
      console.log('Offline queue synced successfully.');
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
    }
  },
};

export default api;















