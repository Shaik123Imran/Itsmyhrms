import { useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Handshake,
  ListTodo,
  UserCheck,
  X,
} from 'lucide-react'
import { relativeLabel } from '../../utils/date'
import { EmptyState, SectionAction, SectionCard } from './ui'

const KIND_META = {
  leave: {
    icon: CalendarDays,
    label: 'Leave',
    className: 'bg-violet-50 text-violet-600',
  },
  timesheet: {
    icon: Clock,
    label: 'Timesheet',
    className: 'bg-sky-50 text-sky-600',
  },
  task: {
    icon: ListTodo,
    label: 'Task',
    className: 'bg-rose-50 text-rose-600',
  },
  onboarding: {
    icon: UserCheck,
    label: 'Onboarding',
    className: 'bg-emerald-50 text-emerald-600',
  },
  offer: {
    icon: Handshake,
    label: 'Offer',
    className: 'bg-amber-50 text-amber-600',
  },
  record: {
    icon: AlertTriangle,
    label: 'Record',
    className: 'bg-rose-50 text-rose-600',
  },
}

const PRIORITY_DOT = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
}

export function ActionCenter({
  items = [],
  onAction,
  onOpen,
  onViewAll,
  limit = 5,
  title = 'Action center',
  description = 'Approvals and follow-ups that need you',
  className,
}) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const visible = items.slice(0, limit)
  const remaining = Math.max(0, items.length - visible.length)

  const runAction = async (item, action) => {
    if (!onAction) {
      return
    }

    setError('')
    setBusyId(item.id)

    try {
      await onAction(item, action)
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'That action could not be completed.',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <SectionCard
      id="action-center"
      title={title}
      description={description}
      icon={ClipboardCheck}
      className={className}
      bodyClassName="p-0"
      action={
        items.length > 0 ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            {items.length} pending
          </span>
        ) : null
      }
    >
      {error ? (
        <p className="border-b border-rose-100 bg-rose-50 px-5 py-2 text-xs font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            compact
            icon={CheckCircle2}
            title="You're all caught up"
            description="No approvals or follow-ups need your attention right now."
          />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {visible.map((item) => {
              const meta = KIND_META[item.kind] ?? KIND_META.task
              const Icon = meta.icon
              const busy = busyId === item.id

              return (
                <li key={item.id} className="flex gap-3 px-5 py-3.5">
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.className}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          PRIORITY_DOT[item.priority] ?? PRIORITY_DOT.low
                        }`}
                      />
                      <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.description}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                      Due {relativeLabel(item.due)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end justify-center gap-1.5 sm:flex-row sm:items-center">
                    {item.canApprove ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction(item, 'approve')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {busy ? 'Saving' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction(item, 'reject')}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpen?.(item.link)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        {item.actionLabel ?? 'Review'}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {remaining > 0 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                {remaining} more item{remaining === 1 ? '' : 's'} pending
              </p>
              {onViewAll ? (
                <SectionAction onClick={onViewAll}>
                  View all
                </SectionAction>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </SectionCard>
  )
}
