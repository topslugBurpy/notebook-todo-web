import { supabase } from './supabase'
import type { Task, DaySummary } from './supabase'

const todayStr = () => new Date().toISOString().slice(0, 10)
const dayOfWeek = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })

// priority 0 = unprioritized → sorts to bottom; 1/2/3 → top in that order
const sortTasks = (tasks: Task[]): Task[] =>
  tasks.sort((a, b) => {
    const pa = a.priority === 0 ? Infinity : a.priority
    const pb = b.priority === 0 ? Infinity : b.priority
    if (pa !== pb) return pa - pb
    return a.created_at.localeCompare(b.created_at)
  })

export async function getTodayTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('date', todayStr())
  if (error) throw error
  return sortTasks((data as Task[]) ?? [])
}

export async function getTasksByDate(date: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('date', date)
  if (error) throw error
  return sortTasks((data as Task[]) ?? [])
}

export async function getYesterdayUnfinished(): Promise<Task[]> {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('date', yesterday)
    .eq('done', false)
  if (error) throw error
  return (data as Task[]) ?? []
}

export async function getSidebarDays(): Promise<DaySummary[]> {
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('tasks')
    .select('date, done')
    .gte('date', since)
  if (error) throw error

  const grouped = new Map<string, { taskCount: number; completedCount: number }>()
  for (const row of (data as { date: string; done: boolean }[]) ?? []) {
    const g = grouped.get(row.date) ?? { taskCount: 0, completedCount: 0 }
    g.taskCount += 1
    if (row.done) g.completedCount += 1
    grouped.set(row.date, g)
  }

  return Array.from(grouped.entries())
    .map(([date, counts]) => ({
      date,
      dayOfWeek: dayOfWeek(date),
      taskCount: counts.taskCount,
      completedCount: counts.completedCount,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function createTask(text: string, priority: 0 | 1 | 2 | 3 = 0): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ date: todayStr(), text, priority })
    .select()
    .single()
  if (error) throw error
  return data as Task
}

export async function updateTask(
  id: string,
  patch: { text?: string; done?: boolean }
): Promise<Task> {
  const update: Record<string, unknown> = { ...patch }
  if (patch.done === true) update.completed_at = new Date().toISOString()
  if (patch.done === false) update.completed_at = null

  const { data, error } = await supabase
    .from('tasks')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Task
}

export async function setPriority(taskId: string, newPriority: 0 | 1 | 2 | 3): Promise<void> {
  const { error } = await supabase.rpc('set_priority', {
    task_id: taskId,
    new_priority: newPriority,
  })
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function carryForward(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) return

  const { data: source, error: e1 } = await supabase
    .from('tasks')
    .select('*')
    .in('id', taskIds)
  if (e1) throw e1

  const newRows = (source as Task[]).map(t => ({
    date: todayStr(),
    text: t.text,
    priority: 0,
    carried_from: t.date,
  }))

  const { error: e2 } = await supabase.from('tasks').insert(newRows)
  if (e2) throw e2
}

export async function pullToToday(taskId: string): Promise<Task> {
  const { data: source, error: e1 } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()
  if (e1) throw e1

  const s = source as Task
  const { data, error: e2 } = await supabase
    .from('tasks')
    .insert({
      date: todayStr(),
      text: s.text,
      priority: 0,
      carried_from: s.date,
    })
    .select()
    .single()
  if (e2) throw e2
  return data as Task
}
