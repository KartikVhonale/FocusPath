import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryKeys';
import api from '../services/api';
import toast from 'react-hot-toast';
import { hapticFeedback } from '../utils/haptics';

/**
 * Custom Hook: Fetch Timeline History (Defaults to 30 days)
 */
export function useTimeline(days = 30, options = {}) {
  return useQuery({
    queryKey: ['timeline', days],
    queryFn: () => api.getTimelineHistory(days),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Custom Hook: Fetch Daily Logs
 */
export function useDailyLog(days = 7, options = {}) {
  return useQuery({
    queryKey: ['logs', days],
    queryFn: () => api.getLogs(days),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Custom Hook: Fetch 14-Day Study Trends Report
 */
export function useTrends(options = {}) {
  return useQuery({
    queryKey: queryKeys.trends(),
    queryFn: api.getTrendsReport,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Custom Hook: Fetch Subject Distribution Radar Data
 */
export function useDistribution(options = {}) {
  return useQuery({
    queryKey: queryKeys.distribution(),
    queryFn: api.getSubjectDistribution,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Custom Hook: Fetch Cohort Leaderboard
 */
export function useLeaderboard(options = {}) {
  return useQuery({
    queryKey: queryKeys.leaderboard(),
    queryFn: api.getCohortLeaderboard,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Custom Hook: Edit History Log (Time Machine & Log Adjustment)
 */
export function useEditHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, addedTopicIds, removedTopicIds, overrideTotalMinutes }) =>
      api.editHistoryLog({
        date,
        addedTopicIds,
        removedTopicIds,
        overrideTotalMinutes,
      }),
    onMutate: async (newLogData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.timeline() });
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard() });

      const previousTimeline = queryClient.getQueryData(['timeline', 30]);
      const previousDashboard = queryClient.getQueryData(queryKeys.dashboard());

      if (previousTimeline && Array.isArray(previousTimeline.timeline)) {
        queryClient.setQueryData(['timeline', 30], (old) => {
          if (!old?.timeline) return old;
          return {
            ...old,
            timeline: old.timeline.map((entry) => {
              if (entry.date === newLogData.date) {
                return {
                  ...entry,
                  minutesStudied:
                    newLogData.overrideTotalMinutes !== undefined
                      ? newLogData.overrideTotalMinutes
                      : entry.minutesStudied,
                };
              }
              return entry;
            }),
          };
        });
      }

      return { previousTimeline, previousDashboard };
    },
    onError: (err, newLogData, context) => {
      console.error('Failed to update study log:', err);
      if (context?.previousTimeline) {
        queryClient.setQueryData(['timeline', 30], context.previousTimeline);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard(), context.previousDashboard);
      }
      toast.error('Failed to update study log');
    },
    onSuccess: () => {
      hapticFeedback.success();
      toast.success('Study log updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.trends() });
      queryClient.invalidateQueries({ queryKey: ['reportsTrends'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.distribution() });
      queryClient.invalidateQueries({ queryKey: ['reportsDistribution'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}

/**
 * Unified Hook: useHistory
 */
export function useHistory() {
  const editHistoryMutation = useEditHistory();

  return {
    useTimeline,
    useDailyLog,
    useTrends,
    useDistribution,
    useLeaderboard,
    useEditHistory,
    editHistory: editHistoryMutation.mutateAsync,
    isEditing: editHistoryMutation.isPending,
  };
}

export default useHistory;


