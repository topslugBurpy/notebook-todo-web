import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, key)

export type Task = {
  id: string
  date: string          // 'YYYY-MM-DD'
  text: string
  done: boolean
  priority: 0 | 1 | 2 | 3
  carried_from: string | null
  completed_at: string | null
  created_at: string
}

export type DaySummary = {
  date: string
  dayOfWeek: string
  taskCount: number
  completedCount: number
}
