// ── Primitives ────────────────────────────────────────────────────

// 0 = no priority slot (backend sentinel), 1/2/3 = exclusive priority slots
export type Priority = 0 | 1 | 2 | 3

// ── Domain models (mirror backend @Entity / @Document) ────────────

export interface Task {
  id: string
  text: string
  done: boolean
  priority: Priority
  createdAt?: string
  completedAt?: string | null
  carriedFrom?: string | null
}

export interface Day {
  id: string
  date: string          // ISO-8601 date, e.g. "2026-05-14"
  tasks: Task[]
}

// ── Response DTOs ─────────────────────────────────────────────────

/** GET /api/days/today */
export interface TodayResponse {
  day: Day
  shouldPromptCarryForward: boolean
  yesterdayUnfinishedTasks: Task[]
}

/** GET /api/days  (feed / sidebar list) */
export interface DayFeedItem {
  date: string          // ISO-8601 date
  taskCount: number
  completedCount: number
}

// ── Request DTOs ──────────────────────────────────────────────────

/** POST /api/days/today/tasks */
export interface AddTaskRequest {
  text: string
  priority?: Priority   // omit or send 0 for no priority
}

/** PATCH /api/days/today/tasks/:id */
export interface UpdateTaskRequest {
  text?: string
  done?: boolean
  priority?: Priority   // send 0 to unset
}

/** POST /api/days/today/carry-forward */
export interface CarryForwardRequest {
  taskIds: string[]
}
