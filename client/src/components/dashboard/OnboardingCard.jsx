import { useState } from 'react'
import { Check, UserCheck } from 'lucide-react'
import {
  Avatar,
  EmptyState,
  ProgressBar,
  SectionAction,
  SectionCard,
  StatusBadge,
} from './ui'

export function OnboardingCard({
  onboarding,
  onToggle,
  onViewAll,
  limit = 3,
  title = 'Onboarding',
  description,
  className,
}) {
  const [busyKey, setBusyKey] = useState(null)
  const records = (onboarding?.records ?? []).slice(0, limit)

  const handleToggle = async (record, item) => {
    if (!onToggle) {
      return
    }
    const key = `${record.id}-${item.id}`
    setBusyKey(key)
    try {
      await onToggle(record.id, item.id)
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <SectionCard
      id="onboarding"
      title={title}
      description={
        description ??
        `${onboarding?.inProgress ?? 0} in progress · ${
          onboarding?.completion ?? 0
        }% complete`
      }
      icon={UserCheck}
      className={className}
      action={
        onViewAll ? (
          <SectionAction onClick={onViewAll}>View all</SectionAction>
        ) : null
      }
    >
      {records.length === 0 ? (
        <EmptyState
          compact
          icon={UserCheck}
          title="No onboarding in progress"
          description="New joiner checklists will appear here."
        />
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-xl border border-slate-200 p-3"
            >
              <div className="flex items-center gap-2.5">
                <Avatar name={record.employeeName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {record.employeeName}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {record.role} · {record.department}
                  </p>
                </div>
                <StatusBadge status={record.status} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <ProgressBar
                  value={record.progress}
                  tone={record.status === 'Completed' ? 'emerald' : 'indigo'}
                />
                <span className="shrink-0 text-[11px] font-semibold text-slate-500">
                  {record.done}/{record.total}
                </span>
              </div>

              {record.pendingItems.length > 0 ? (
                <ul className="mt-2.5 space-y-1">
                  {record.pendingItems.slice(0, 2).map((item) => {
                    const key = `${record.id}-${item.id}`
                    const busy = busyKey === key
                    return (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1.5"
                      >
                        <span className="truncate text-[11px] font-medium text-slate-600">
                          {item.label}
                        </span>
                        {onToggle ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleToggle(record, item)}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60"
                          >
                            <Check className="h-3 w-3" />
                            {busy ? 'Saving' : 'Done'}
                          </button>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-[11px] font-medium text-emerald-600">
                  Checklist complete
                </p>
              )}

              {record.pendingItems.length > 2 ? (
                <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                  +{record.pendingItems.length - 2} more pending
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
