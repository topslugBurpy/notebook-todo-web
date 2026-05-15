import { useState } from 'react'
import type { Task } from '../types/api'

interface Props {
  tasks: Task[]
  onConfirm: (taskIds: string[]) => void
  onDismiss: () => void
  isPending: boolean
}

export default function CarryForwardModal({ tasks, onConfirm, onDismiss, isPending }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(tasks.map(t => t.id))
  )

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleConfirm() {
    onConfirm(Array.from(selected))
  }

  return (
    <div className="modal-backdrop" onClick={onDismiss}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <p className="modal-eyebrow">Yesterday</p>
        <h2 className="modal-title heading-serif">Unfinished tasks</h2>
        <p className="modal-subtitle">Select tasks to carry forward to today.</p>

        <ul className="modal-task-list">
          {tasks.map(task => (
            <li key={task.id} className="modal-task-item">
              <input
                type="checkbox"
                className="task-checkbox"
                checked={selected.has(task.id)}
                onChange={() => toggle(task.id)}
                id={`cf-${task.id}`}
              />
              <label htmlFor={`cf-${task.id}`} className="modal-task-label">
                {task.text}
              </label>
            </li>
          ))}
        </ul>

        <div className="modal-actions">
          <button className="modal-btn-secondary" onClick={onDismiss} disabled={isPending}>
            Skip
          </button>
          <button
            className="modal-btn-primary"
            onClick={handleConfirm}
            disabled={selected.size === 0 || isPending}
          >
            {isPending ? 'Carrying…' : `Bring ${selected.size} forward`}
          </button>
        </div>
      </div>
    </div>
  )
}
