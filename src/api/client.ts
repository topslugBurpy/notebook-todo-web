import axios from 'axios'
import type {
  AddTaskRequest,
  CarryForwardRequest,
  Day,
  DayFeedItem,
  Task,
  TodayResponse,
  UpdateTaskRequest,
} from '../types/api'

const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// GET /api/days/today
export function fetchToday(): Promise<TodayResponse> {
  return http.get<TodayResponse>('/days/today').then(r => r.data)
}

// GET /api/days
export function fetchDayFeed(): Promise<DayFeedItem[]> {
  return http.get<DayFeedItem[]>('/days').then(r => r.data)
}

// GET /api/days/:date   (date = "YYYY-MM-DD")
export function fetchDay(date: string): Promise<Day> {
  return http.get<Day>(`/days/${date}`).then(r => r.data)
}

// POST /api/days/today/tasks
export function addTask(body: AddTaskRequest): Promise<Task> {
  return http.post<Task>('/days/today/tasks', body).then(r => r.data)
}

// PATCH /api/days/today/tasks/:id
export function updateTask(id: string, body: UpdateTaskRequest): Promise<Task> {
  return http.patch<Task>(`/days/today/tasks/${id}`, body).then(r => r.data)
}

// DELETE /api/days/today/tasks/:id
export function deleteTask(id: string): Promise<void> {
  return http.delete(`/days/today/tasks/${id}`).then(() => undefined)
}

// POST /api/days/today/carry-forward
export function carryForward(body: CarryForwardRequest): Promise<void> {
  return http.post('/days/today/carry-forward', body).then(() => undefined)
}

// POST /api/days/today/pull/:date/:taskId
export function pullTask(date: string, taskId: string): Promise<Task> {
  return http.post<Task>(`/days/today/pull/${date}/${taskId}`).then(r => r.data)
}
