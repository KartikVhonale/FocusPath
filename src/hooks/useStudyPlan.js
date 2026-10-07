import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryKeys';
import api from '../services/api';
import toast from 'react-hot-toast';
import { hapticFeedback } from '../utils/haptics';

/**
 * Custom Hook: Fetch Dashboard Data
 */
export function useDashboard(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: api.getDashboard,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Custom Hook: Fetch Active Study Plan
 */
export function useCurrentPlan(options = {}) {
  return useQuery({
    queryKey: queryKeys.currentPlan(),
    queryFn: api.getCurrentPlan,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Custom Hook: Toggle Subtopic Node (Complete / Review / Snooze) with Optimistic UI
 */
export function useToggleNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => api.toggleNodeSRS(variables),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard() });
      const previousDashboard = queryClient.getQueryData(queryKeys.dashboard());

      queryClient.setQueryData(queryKeys.dashboard(), (old) => {
        if (!old) return old;
        const prev = old.data || old;
        const targetId = String(variables.nodeId);
        const isComplete = variables.action === 'complete' && variables.isCompleted;

        const nextUpNextQueue = (prev.upNextQueue || []).filter((t) => String(t.id) !== targetId);
        const nextReviewQueue = (prev.reviewQueue || []).filter((t) => String(t.id) !== targetId);

        const updated = {
          ...prev,
          todayCompleted: isComplete ? (prev.todayCompleted || 0) + 1 : prev.todayCompleted,
          totalCompleted: isComplete ? (prev.totalCompleted || 0) + 1 : prev.totalCompleted,
          completedChapterIds: isComplete
            ? [...(prev.completedChapterIds || []), variables.nodeId]
            : (prev.completedChapterIds || []).filter((id) => String(id) !== targetId),
          upNextQueue: nextUpNextQueue,
          reviewQueue: nextReviewQueue,
          upNext: nextUpNextQueue[0] || null,
        };

        return old.data ? { ...old, data: updated } : updated;
      });

      return { previousDashboard };
    },
    onError: (err, variables, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard(), context.previousDashboard);
      }
      toast.error('Failed to sync progress with server');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline() });
    },
  });
}

/**
 * Custom Hook: Undo Task Completion (Restores task to active queue)
 */
export function useUndoTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studyPlanId, nodeId }) => {
      return api.toggleNodeSRS({
        studyPlanId,
        nodeId,
        isCompleted: false,
        action: 'undo',
      });
    },
    onMutate: async ({ nodeId, task }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard() });
      const previousDashboard = queryClient.getQueryData(queryKeys.dashboard());

      queryClient.setQueryData(queryKeys.dashboard(), (old) => {
        if (!old) return old;
        const prev = old.data || old;
        const targetId = String(nodeId);

        const currentQueue = prev.upNextQueue || [];
        const queueAlreadyHas = currentQueue.some((t) => String(t.id) === targetId);
        const nextUpNextQueue = !queueAlreadyHas && task ? [task, ...currentQueue] : currentQueue;

        const updated = {
          ...prev,
          todayCompleted: Math.max(0, (prev.todayCompleted || 0) - 1),
          totalCompleted: Math.max(0, (prev.totalCompleted || 0) - 1),
          completedChapterIds: (prev.completedChapterIds || []).filter(
            (id) => String(id) !== targetId
          ),
          todayCompletedTopicIds: (prev.todayCompletedTopicIds || []).filter(
            (id) => String(id) !== targetId
          ),
          todayCompletedTopics: (prev.todayCompletedTopics || []).filter(
            (t) => String(t.id) !== targetId
          ),
          upNextQueue: nextUpNextQueue,
          upNext: nextUpNextQueue[0] || prev.upNext,
        };

        return old.data ? { ...old, data: updated } : updated;
      });

      return { previousDashboard };
    },
    onSuccess: (data) => {
      if (data && data.todayCompleted !== undefined) {
        queryClient.setQueryData(queryKeys.dashboard(), (old) => {
          if (!old) return old;
          const prev = old.data || old;
          const updated = {
            ...prev,
            todayCompleted: Math.max(0, data.todayCompleted),
            ...(data.totalCompleted !== undefined ? { totalCompleted: Math.max(0, data.totalCompleted) } : {}),
            ...(data.upNextQueue ? { upNextQueue: data.upNextQueue, upNext: data.upNextQueue[0] || null } : {}),
            ...(data.reviewQueue ? { reviewQueue: data.reviewQueue } : {}),
          };
          return old.data ? { ...old, data: updated } : updated;
        });
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard(), context.previousDashboard);
      }
      toast.error('Failed to undo task on server');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline() });
    },
  });
}

/**
 * Custom Hook: Bulk Complete Entire Chapter
 */
export function useBulkComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chapterId }) => api.completeChapter({ chapterId }),
    onSuccess: () => {
      hapticFeedback.bulkComplete();
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline() });
      toast.success('Chapter completed in full!');
    },
    onError: () => {
      toast.error('Failed to complete chapter');
    },
  });
}

/**
 * Unified Hook: useStudyPlan
 */
export function useStudyPlan() {
  const toggleMutation = useToggleNode();
  const undoMutation = useUndoTask();
  const bulkMutation = useBulkComplete();

  return {
    useDashboard,
    useCurrentPlan,
    useToggleNode,
    useUndoTask,
    useBulkComplete,
    toggleNode: toggleMutation.mutateAsync,
    undoTask: undoMutation.mutateAsync,
    bulkComplete: bulkMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    isUndoing: undoMutation.isPending,
    isBulkCompleting: bulkMutation.isPending,
  };
}

export default useStudyPlan;

