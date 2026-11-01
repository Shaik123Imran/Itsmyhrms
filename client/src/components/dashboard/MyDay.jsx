import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  ListTodo,
  Megaphone,
  PartyPopper,
  Sparkles,
  Sun,
  UserCheck,
  Users,
} from 'lucide-react'
import { EmptyState, SectionAction, SectionCard } from './ui'

const TYPE_ICONS = {
  attendance: Clock,
  task: ListTodo,
  leave: CalendarDays,
  timesheet: ClipboardList,
  team: Users,
  approval: CheckCircle2,
  interview: CalendarClock,
  people: UserCheck,
  announcement: Megaphone,
  holiday: PartyPopper,
}

const TONE_STYLES = {
  success: 'bg-emerald-50 text-emerald-600',
  danger: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
  sky: 'bg-sky-50 text-sky-600',
  default: 'bg-indigo-50 text-indigo-600',
}

export function MyDay({
  items = [],
  onNavigate,
  onViewAll,
  dateLabel,
  title = 'My day',
  description = 'What needs your attention today',
  className,
}) {
  return (
    <SectionCard
      id="my-day"
      title={title}
      description={description}
      icon={Sun}
      className={className}
      bodyClassName="p-0"
      action={
        dateLabel ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {dateLabel}
          </span>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="p-5">
          <EmptyState
            compact
            icon={Sparkles}
            title="Nothing scheduled"
            description="Your day is clear. New tasks, leave updates, and reminders will appear here."
          />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const Icon = TYPE_ICONS[item.type] ?? Sparkles
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(item.link)}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-slate-50"
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        TONE_STYLES[item.tone] ?? TONE_STYLES.default
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {item.title}
                        </span>
                        <span className="shrink-0 text-[11px] font-medium text-slate-400">
                          {item.time}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {onViewAll ? (
            <div className="flex justify-end border-t border-slate-100 px-5 py-3">
              <SectionAction onClick={onViewAll}>Open calendar</SectionAction>
            </div>
          ) : null}
        </>
      )}
    </SectionCard>
  )
}
