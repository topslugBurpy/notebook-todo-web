import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchToday,
  fetchDayFeed,
  fetchDay,
  addTask,
  updateTask,
  deleteTask,
  carryForward,
} from '../api/client'
import type { AddTaskRequest, CarryForwardRequest, UpdateTaskRequest } from '../types/api'

export const QUERY_KEYS = {
  today: ['today'] as const,
  dayFeed: ['dayFeed'] as const,
  day: (date: string) => ['day', date] as const,
}

export function useTodayQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.today,
    queryFn: fetchToday,
    retry: false,
    staleTime: 30_000,
  })
}

export function useDayFeedQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.dayFeed,
    queryFn: fetchDayFeed,
    retry: false,
    staleTime: 30_000,
  })
}

export function useDayQuery(date: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.day(date),
    queryFn: () => fetchDay(date),
    retry: false,
    staleTime: 30_000,
    enabled,
  })
}

export function useAddTaskMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddTaskRequest) => addTask(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.today })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dayFeed })
    },
  })
}

export function useUpdateTaskMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTaskRequest }) =>
      updateTask(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.today })
    },
  })
}

export function useDeleteTaskMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.today })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dayFeed })
    },
  })
}

export function useCarryForwardMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CarryForwardRequest) => carryForward(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.today })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dayFeed })
    },
  })
}
