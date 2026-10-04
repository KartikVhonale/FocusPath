import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from './AuthContext';
import storageService, { STORAGE_KEYS } from '../services/storage';
import { toastThrottler } from '../utils/toastThrottler';
import { applySmartSilence } from '../utils/notifications';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [hasPlan, setHasPlan] = useState(false);
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Ref to accumulate rapid click increments for debounced backend sync
  const pendingIncrementRef = useRef(0);
  const studyPlanIdRef = useRef(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage({ text: msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === msg ? null : current));
    }, 3500);
  }, []);

  // Fetch Dashboard Data with IndexedDB caching
  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getDashboard();
      if (res.success) {
        setHasPlan(res.hasPlan);
        if (res.hasPlan) {
          setDashboardData(res.data);
          studyPlanIdRef.current = res.data.studyPlanId;
          // Asynchronously persist to IndexedDB
          storageService.setItem(STORAGE_KEYS.DASHBOARD_STATE, res.data);
          
          // Smart Silence Logic for SRS Notifications
          applySmartSilence(res.data);
          
          if (res.data.examCode) {
            fetchActiveExam(res.data.examCode);
          }
        } else {
          setDashboardData(null);
          setActiveExam(null);
          studyPlanIdRef.current = null;
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      // Attempt IndexedDB recovery
      const cachedDashboard = await storageService.getItem(STORAGE_KEYS.DASHBOARD_STATE);
      if (cachedDashboard) {
        setDashboardData(cachedDashboard);
        setHasPlan(true);
        studyPlanIdRef.current = cachedDashboard.studyPlanId;
      } else {
        setError(err.response?.data?.message || 'Could not connect to backend server.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Exams list
  const fetchExams = useCallback(async () => {
    try {
      const res = await api.getExams();
      if (res.success) {
        setExams(res.exams || []);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
    }
  }, []);

  // Fetch Full Active Exam details
  const fetchActiveExam = async (examCodeOrId) => {
    try {
      const allExamsRes = await api.getExams();
      if (allExamsRes.success) {
        const found = allExamsRes.exams.find(
          (e) => e.code === examCodeOrId || e._id === examCodeOrId
        );
        if (found) {
          const detailRes = await api.getExamDetails(found._id);
          if (detailRes.success) {
            setActiveExam(detailRes.exam);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching active exam:', err);
    }
  };

  useEffect(() => {
    fetchExams();
    if (token) {
      fetchDashboard();
    } else {
      setDashboardData(null);
      setHasPlan(false);
      setActiveExam(null);
      setLoading(false);
    }
  }, [token, fetchExams, fetchDashboard]);

  // Debounced server sync (500ms debounce)
  // Accumulates rapid '+' taps into a single network payload
  const debouncedSyncToServer = useRef(
    debounce(async (planId, totalDelta, rollbackFn) => {
      if (totalDelta === 0) return;
      try {
        const res = await api.updateProgress({
          studyPlanId: planId,
          increment: totalDelta,
        });

        if (res.success && res.data) {
          setDashboardData((prev) => ({
            ...prev,
            todayCompleted: res.data.todayCompleted,
            todayTarget: res.data.todayTarget,
            activeStudyDayPace: res.data.activeStudyDayPace,
            totalCompleted: res.data.totalCompleted,
            remainingTopics: res.data.remainingTopics,
            remainingValidDays: res.data.remainingValidDays,
            completedChapterIds: res.data.completedChapterIds || prev?.completedChapterIds,
          }));
        }
      } catch (err) {
        console.error('Failed to sync progress with backend:', err);
        rollbackFn();
      } finally {
        pendingIncrementRef.current = 0;
      }
    }, 500)
  ).current;

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSyncToServer.cancel();
    };
  }, [debouncedSyncToServer]);

  // Optimistic Quick Increment for Dashboard '+' button with 500ms Debounced Network Sync
  const quickIncrement = useCallback(
    (amount = 1) => {
      if (!dashboardData) return;

      const prevData = { ...dashboardData };
      pendingIncrementRef.current += amount;

      // Instant Optimistic UI Update
      setDashboardData((prev) => {
        if (!prev) return prev;
        const newTodayCompleted = Math.max(0, prev.todayCompleted + amount);
        const newTotalCompleted = Math.max(
          0,
          Math.min(prev.totalTopics, prev.totalCompleted + amount)
        );
        const newRemaining = Math.max(0, prev.totalTopics - newTotalCompleted);
        const validDays = Math.max(1, prev.remainingValidDays);
        const newTarget = prev.isStudyDay ? Math.ceil(newRemaining / validDays) : 0;

        return {
          ...prev,
          todayCompleted: newTodayCompleted,
          totalCompleted: newTotalCompleted,
          remainingTopics: newRemaining,
          todayTarget: newTarget,
        };
      });

      if (amount > 0) {
        toast.success(
          `🎉 Awesome job! Logged ${amount} ${amount === 1 ? 'chapter' : 'chapters'}.`,
          {
            id: 'quick-increment-toast',
          }
        );
        showToast('Chapter logged! Progress updated.', 'success');
      } else {
        toast('Chapter undone.', { icon: '↩️', id: 'quick-increment-toast' });
        showToast('Chapter undone.', 'info');
      }

      // Trigger debounced network request
      const planId = dashboardData.studyPlanId;
      const accumulated = pendingIncrementRef.current;

      debouncedSyncToServer(planId, accumulated, () => {
        setDashboardData(prevData);
        showToast('⚠️ Failed to save to server. Reverted change.', 'error');
      });
    },
    [dashboardData, debouncedSyncToServer, showToast]
  );

  // Toggle chapter completion from Syllabus view
  const toggleChapter = async (chapterId, isCompleted) => {
    if (!dashboardData) return;

    const prevData = { ...dashboardData };
    const currentCompleted = dashboardData.completedChapterIds || [];
    const alreadyDone = currentCompleted.includes(chapterId);

    const willBeDone = isCompleted !== undefined ? isCompleted : !alreadyDone;
    const delta = willBeDone ? 1 : -1;

    const newCompletedIds = willBeDone
      ? [...currentCompleted, chapterId]
      : currentCompleted.filter((id) => id !== chapterId);

    // Optimistic update
    setDashboardData((prev) => {
      const newTodayCompleted = Math.max(0, prev.todayCompleted + delta);
      const newTotalCompleted = Math.max(
        0,
        Math.min(prev.totalTopics, prev.totalCompleted + delta)
      );
      const newRemaining = Math.max(0, prev.totalTopics - newTotalCompleted);
      const validDays = Math.max(1, prev.remainingValidDays);
      const newTarget = prev.isStudyDay ? Math.ceil(newRemaining / validDays) : 0;

      return {
        ...prev,
        completedChapterIds: newCompletedIds,
        todayCompleted: newTodayCompleted,
        totalCompleted: newTotalCompleted,
        remainingTopics: newRemaining,
        todayTarget: newTarget,
      };
    });

    try {
      const res = await api.updateProgress({
        studyPlanId: dashboardData.studyPlanId,
        chapterId,
        isCompleted: willBeDone,
      });

      if (res.success && res.data) {
        setDashboardData((prev) => ({
          ...prev,
          ...res.data,
        }));
      }
    } catch (err) {
      console.error('Failed to sync chapter check:', err);
      setDashboardData(prevData);
      showToast('⚠️ Could not update chapter. Reverted.', 'error');
    }
  };

  // Record completed timer session
  const recordTimerSession = async (timeStudiedMinutes, topicsCompleted) => {
    if (!dashboardData) return;
    try {
      const res = await api.submitTimerSession({
        studyPlanId: dashboardData.studyPlanId,
        timeStudiedMinutes,
        topicsCompleted,
      });

      if (res.success && res.data) {
        setDashboardData((prev) => ({
          ...prev,
          todayCompleted: res.data.todayCompleted,
          todayTarget: res.data.todayTarget,
          timeStudiedMinutes: res.data.timeStudiedMinutes,
          totalCompleted: res.data.totalCompleted,
          remainingTopics: res.data.remainingTopics,
          remainingValidDays: res.data.remainingValidDays,
        }));
        toast.success(
          `🎉 Awesome job! Completed ${timeStudiedMinutes}m focus session${
            topicsCompleted > 0
              ? ` & logged ${topicsCompleted} ${topicsCompleted === 1 ? 'chapter' : 'chapters'}`
              : ''
          }.`,
          { id: 'timer-session-toast' }
        );
        showToast(`⏱️ Logged ${timeStudiedMinutes} mins and ${topicsCompleted} topics!`, 'success');
        return true;
      }
    } catch (err) {
      console.error('Failed to record timer session:', err);
      toast.error('⚠️ Failed to save focus session', { id: 'timer-session-toast' });
      showToast('⚠️ Failed to save focus session', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        dashboardData,
        hasPlan,
        exams,
        activeExam,
        setActiveExam,
        fetchActiveExam,
        loading,
        error,
        toastMessage,
        showToast,
        fetchDashboard,
        fetchExams,
        quickIncrement,
        toggleChapter,
        recordTimerSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}



