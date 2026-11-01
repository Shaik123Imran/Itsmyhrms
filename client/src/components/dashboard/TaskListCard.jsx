import { useState } from 'react'
import { Check, ListTodo } from 'lucide-react'
import { relativeLabel } from '../../utils/date'
import {
  Avatar,
  EmptyState,
  SectionAction,
  SectionCard,
  StatusBadge,
} from './ui'

const PRIORITY_TONES = {
  High: 'rose',
  Medium: 'amber',
  Low: 'slate',
}

export function TaskListCard({
  tasks = [],
  onComplete,
  onOpen,
  onViewAll,
  canComplete = false,
  showAssignee = false,
  limit = 5,
  title = 'My tasks',
  description = 'Work that needs your attention',
  className,
  id = 'my-tasks',
}) {
  const [busyId, setBusyId] = useState(null)
  const visible = tasks.slice(0, limit)

  const handleComplete = async (task) => {
    if (!onComplete) {
      return
    }
    setBusyId(task.id)
    try {
      await onComplete(task)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <SectionCard
      id={id}
      title={title}
      description={description}
      icon={ListTodo}
      className={className}
      bodyClassName="p-0"
      action={
        onViewAll ? (
          <SectionAction onClick={onViewAll}>View all</SectionAction>
        ) : null
      }
    >
      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            compact
            icon={ListTodo}
            title="No tasks right now"
            description="New assignments will appear here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((task) => {
            const completed = task.status === 'Completed'
            const busy = busyId === task.id

            return (
              <li key={task.id} className="flex items-start gap-3 px-5 py-3.5">
                {canComplete ? (
                  <button
                    type="button"
                    disabled={completed || busy}
                    onClick={() => handleComplete(task)}
                    aria-label={
                      completed
                        ? `${task.title} is completed`
                        : `Mark ${task.title} as complete`
                    }
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                      completed
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-slate-300 text-transparent hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'
                    } disabled:cursor-default`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                ) : showAssignee ? (
                  <Avatar
                    name={task.assigneeName}
                    initials={task.assigneeInitials}
                    size="sm"
                    className="mt-0.5"
                  />
                ) : (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`min-w-0 truncate text-sm font-semibold ${
                        completed
                          ? 'text-slate-400 line-through'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </p>
                    <StatusBadge
                      status={task.displayStatus ?? task.status}
                      tone={PRIORITY_TONES[task.priority]}
                    />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {showAssignee ? `${task.assigneeName} · ` : ''}
                    {task.project}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">
                    {completed ? 'Completed' : `Due ${relativeLabel(task.dueDate)}`}
                    {' · '}
                    {task.priority} priority
                  </p>
                </div>

                {onOpen ? (
                  <button
                    type="button"
                    onClick={() => onOpen(task)}
                    className="mt-0.5 shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Open
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
