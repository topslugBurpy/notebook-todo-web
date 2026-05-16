import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/tasks'

export const QUERY_KEYS = {
  todayTasks: ['tasks', 'today'] as const,
  yesterdayUnfinished: ['tasks', 'yesterday-unfinished'] as const,
  sidebarDays: ['days', 'sidebar'] as const,
  dayTasks: (date: string) => ['tasks', date] as const,
}

export function useTodayQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.todayTasks,
    queryFn: api.getTodayTasks,
    retry: false,
    staleTime: 30_000,
  })
}

export function useYesterdayUnfinishedQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.yesterdayUnfinished,
    queryFn: api.getYesterdayUnfinished,
    retry: false,
    staleTime: 30_000,
  })
}

export function useDayFeedQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.sidebarDays,
    queryFn: api.getSidebarDays,
    retry: false,
    staleTime: 30_000,
  })
}

export function useDayQuery(date: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.dayTasks(date),
    queryFn: () => api.getTasksByDate(date),
    retry: false,
    staleTime: 30_000,
    enabled,
  })
}

export function useAddTaskMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ text, priority }: { text: string; priority?: 0 | 1 | 2 | 3 }) =>
      api.createTask(text, priority),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sidebarDays })
    },
  })
}

export function useUpdateTaskMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { text?: string; done?: boolean } }) =>
      api.updateTask(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sidebarDays })
    },
  })
}

export function useSetPriorityMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, newPriority }: { taskId: string; newPriority: 0 | 1 | 2 | 3 }) =>
      api.setPriority(taskId, newPriority),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks })
    },
  })
}

export function useDeleteTaskMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sidebarDays })
    },
  })
}

export function useCarryForwardMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskIds: string[]) => api.carryForward(taskIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sidebarDays })
    },
  })
}
