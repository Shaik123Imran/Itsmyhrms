import { PartyPopper } from 'lucide-react'
import { formatDate, fromISODate, relativeLabel } from '../../utils/date'
import { EmptyState, SectionAction, SectionCard } from './ui'

function DateBlock({ date }) {
  const parsed = fromISODate(date)
  const month = parsed
    ? formatDate(date, { month: 'short' }).toUpperCase()
    : '—'
  const day = parsed ? parsed.getDate() : '—'

  return (
    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700">
      <span className="text-[10px] font-bold tracking-wide">{month}</span>
      <span className="text-base font-bold leading-none">{day}</span>
    </span>
  )
}

export function HolidaysCard({
  items = [],
  onViewAll,
  limit = 3,
  title = 'Upcoming holidays',
  description = 'Company calendar',
  className,
}) {
  const visible = items.slice(0, limit)

  return (
    <SectionCard
      id="holidays"
      title={title}
      description={description}
      icon={PartyPopper}
      className={className}
      bodyClassName="p-0"
      action={
        onViewAll ? (
          <SectionAction onClick={onViewAll}>Calendar</SectionAction>
        ) : null
      }
    >
      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            compact
            icon={PartyPopper}
            title="No upcoming holidays"
            description="Public holidays will appear here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((holiday) => (
            <li key={holiday.id} className="flex items-center gap-3 px-5 py-3.5">
              <DateBlock date={holiday.date} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {holiday.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{holiday.type}</p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                {relativeLabel(holiday.date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
