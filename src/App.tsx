import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import confetti from 'canvas-confetti'
import './App.css'
import { useUIStore } from './store/ui'
import {
  useTodayQuery,
  useDayFeedQuery,
  useDayQuery,
  useYesterdayUnfinishedQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useSetPriorityMutation,
  useDeleteTaskMutation,
  useCarryForwardMutation,
} from './hooks/queries'
import CarryForwardModal from './components/CarryForwardModal'
import type { Task } from './api/supabase'
import { shouldPromptCarryForward, dismissCarryPrompt } from './utils/carryPrompt'

const PRIORITY_LABEL: Record<number, string> = { 1: '①', 2: '②', 3: '③' }
const PRIORITY_CLASS: Record<number, string>  = { 1: 'p1', 2: 'p2', 3: 'p3' }

export default function App() {
  const {
    selectedDate, setSelectedDate,
    carryForwardVisible, showCarryForward, hideCarryForward,
  } = useUIStore()

  const [newText, setNewText]         = useState('')
  const [addingTask, setAddingTask]   = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editText, setEditText]       = useState('')
  const [priorityPopover, setPriorityPopover] = useState<string | null>(null)

  const addInputRef  = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const todayDate = format(new Date(), 'yyyy-MM-dd')
  const isToday   = selectedDate === todayDate

  const { data: todayData, isLoading, isError } = useTodayQuery()
  const { data: yesterdayUnfinished }           = useYesterdayUnfinishedQuery()
  const { data: feedData }                       = useDayFeedQuery()
  const { data: pastDayData }                    = useDayQuery(selectedDate, !isToday)

  const addMutation         = useAddTaskMutation()
  const updateMutation      = useUpdateTaskMutation()
  const setPriorityMutation = useSetPriorityMutation()
  const deleteMutation      = useDeleteTaskMutation()
  const carryForwardMutation = useCarryForwardMutation()

  const tasks: Task[] = isToday ? (todayData ?? []) : (pastDayData ?? [])

  const done  = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100)

  useEffect(() => { if (addingTask) addInputRef.current?.focus() }, [addingTask])
  useEffect(() => { if (editingId !== null) editInputRef.current?.focus() }, [editingId])

  useEffect(() => {
    if ((yesterdayUnfinished ?? []).length > 0 && shouldPromptCarryForward(todayDate)) {
      showCarryForward()
    }
  }, [yesterdayUnfinished, todayDate, showCarryForward])

  useEffect(() => {
    if (priorityPopover === null) return
    const handler = () => setPriorityPopover(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [priorityPopover])

  function toggle(task: Task) {
    if (!isToday) return
    if (!task.done && task.priority === 1) {
      confetti({ particleCount: 90, spread: 65, origin: { y: 0.55 }, colors: ['#1a1a1a', '#c0392b', '#fafaf7'] })
    } else if (!task.done && task.priority > 0) {
      confetti({ particleCount: 18, spread: 30, origin: { y: 0.55 }, colors: ['#1a1a1a'], ticks: 60 })
    }
    updateMutation.mutate({ id: task.id, patch: { done: !task.done } })
  }

  function deleteTask(id: string) {
    deleteMutation.mutate(id)
  }

  function addTask() {
    const text = newText.trim()
    if (!text) { setAddingTask(false); return }
    setNewText('')
    addMutation.mutate({ text }, {
      onSuccess: () => addInputRef.current?.focus(),
    })
  }

  function startEdit(task: Task) {
    setEditingId(task.id)
    setEditText(task.text)
    setPriorityPopover(null)
  }

  function commitEdit() {
    const text = editText.trim()
    if (text && editingId) {
      updateMutation.mutate({ id: editingId, patch: { text } })
    }
    setEditingId(null)
  }

  function setPriority(id: string, priority: 0 | 1 | 2 | 3) {
    setPriorityMutation.mutate({ taskId: id, newPriority: priority })
    setPriorityPopover(null)
  }

  function handleCarryForwardConfirm(taskIds: string[]) {
    carryForwardMutation.mutate(taskIds, {
      onSuccess: () => {
        dismissCarryPrompt(todayDate)
        hideCarryForward()
      },
    })
  }

  function handleCarryForwardDismiss() {
    dismissCarryPrompt(todayDate)
    hideCarryForward()
  }

  if (isLoading) {
    return (
      <div className="app-shell notebook-grid" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: 18 }}>Loading…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="app-shell notebook-grid" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--priority-1)', fontSize: 16 }}>
          Could not load tasks. Check your Supabase connection.
        </span>
      </div>
    )
  }

  return (
    <div className="app-shell notebook-grid">
      <header className="app-header">
        <span className="heading-serif" style={{ fontSize: 22 }}>Notebook</span>
        <span style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-serif)', fontSize: 14 }}>
          daily tasks
        </span>
        <div className="header-progress">
          <span className="progress-label">{done}/{total}</span>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-pct">{pct}%</span>
        </div>
        {(yesterdayUnfinished ?? []).length > 0 && (
          <button className="cf-demo-btn" onClick={showCarryForward} title="Carry forward from yesterday">
            ↩ carry forward
          </button>
        )}
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <p className="sidebar-month">{format(parseISO(todayDate), 'MMM yyyy')}</p>
          {(feedData ?? []).map(item => {
            const label   = format(parseISO(item.date), 'EEE d')
            const allDone = item.taskCount > 0 && item.completedCount === item.taskCount
            return (
              <button
                key={item.date}
                className={`sidebar-day${selectedDate === item.date ? ' active' : ''}`}
                onClick={() => setSelectedDate(item.date)}
              >
                <span>{label}</span>
                {item.taskCount > 0 && (
                  <span className={`sidebar-badge${allDone ? ' badge-done' : ''}`}>
                    {allDone ? '✓' : `${item.completedCount}/${item.taskCount}`}
                  </span>
                )}
              </button>
            )
          })}
        </aside>

        <main className="page-area">
          <p className="page-date">{format(parseISO(selectedDate), 'EEEE · MMM d')}</p>
          <h1 className="heading-serif page-title">
            {isToday ? 'Today' : format(parseISO(selectedDate), 'EEEE')}
          </h1>

          {!isToday && <p className="readonly-notice">Past day — read only</p>}

          <div className="notebook-page">
            {tasks.length === 0 && !addingTask ? (
              <>
                <div className="empty-state"><p>Nothing here yet</p></div>
                {isToday && (
                  <button className="add-task-btn" onClick={() => setAddingTask(true)}>
                    <span className="add-task-plus">+</span> Add task
                  </button>
                )}
              </>
            ) : (
              <ul className="task-list">
                {tasks.map((task, i) => (
                  <>
                    {i > 0 && <hr key={`rule-${task.id}`} className="task-rule" />}
                    <li key={task.id} className="task-item">
                      {isToday ? (
                        <button
                          className={`priority-btn${task.priority > 0 ? ` ${PRIORITY_CLASS[task.priority]}` : ' p-none'}`}
                          onClick={e => { e.stopPropagation(); setPriorityPopover(priorityPopover === task.id ? null : task.id) }}
                          aria-label="Set priority"
                        >
                          {task.priority > 0 ? PRIORITY_LABEL[task.priority] : '·'}
                        </button>
                      ) : task.priority > 0 ? (
                        <span className={`priority-btn ${PRIORITY_CLASS[task.priority]}`} style={{ cursor: 'default' }}>
                          {PRIORITY_LABEL[task.priority]}
                        </span>
                      ) : null}

                      {priorityPopover === task.id && (
                        <div className="priority-popover" onClick={e => e.stopPropagation()}>
                          {([1, 2, 3] as (1 | 2 | 3)[]).map(p => (
                            <button
                              key={p}
                              className={`popover-opt ${PRIORITY_CLASS[p]}${task.priority === p ? ' selected' : ''}`}
                              onClick={() => setPriority(task.id, p)}
                            >
                              {PRIORITY_LABEL[p]}
                            </button>
                          ))}
                          <button className="popover-opt p-clear" onClick={() => setPriority(task.id, 0)}>
                            ✕
                          </button>
                        </div>
                      )}

                      <input
                        type="checkbox"
                        className="task-checkbox"
                        checked={task.done}
                        onChange={() => toggle(task)}
                        disabled={!isToday}
                      />

                      {editingId === task.id ? (
                        <input
                          ref={editInputRef}
                          className="task-input task-edit-input"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit()
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        />
                      ) : (
                        <span
                          className={`task-label${task.done ? ' task-done' : ''}`}
                          onDoubleClick={() => isToday && !task.done && startEdit(task)}
                          title={isToday && !task.done ? 'Double-click to edit' : undefined}
                        >
                          {task.text}
                        </span>
                      )}

                      {isToday && (
                        <button
                          className="task-delete"
                          onClick={() => deleteTask(task.id)}
                          aria-label="Delete task"
                          disabled={deleteMutation.isPending}
                        >
                          ×
                        </button>
                      )}
                    </li>
                  </>
                ))}

                {isToday && (
                  <>
                    <hr className="task-rule" />
                    <li className="task-item task-add-row">
                      {addingTask ? (
                        <input
                          ref={addInputRef}
                          className="task-input"
                          value={newText}
                          onChange={e => setNewText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') addTask()
                            if (e.key === 'Escape') { setNewText(''); setAddingTask(false) }
                          }}
                          onBlur={addTask}
                          placeholder="New task…"
                        />
                      ) : (
                        <button className="add-task-btn" onClick={() => setAddingTask(true)}>
                          <span className="add-task-plus">+</span> Add task
                        </button>
                      )}
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>
        </main>
      </div>

      {carryForwardVisible && (
        <CarryForwardModal
          tasks={yesterdayUnfinished ?? []}
          onConfirm={handleCarryForwardConfirm}
          onDismiss={handleCarryForwardDismiss}
          isPending={carryForwardMutation.isPending}
        />
      )}
    </div>
  )
}
