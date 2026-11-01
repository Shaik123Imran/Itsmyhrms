import {
  Activity,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Clock,
  FileText,
  ListTodo,
  UserCheck,
} from 'lucide-react'
import { relativeTime } from '../../utils/date'
import { Avatar, EmptyState, SectionAction, SectionCard } from './ui'

const TYPE_META = {
  recruitment: {
    icon: Briefcase,
    className: 'bg-indigo-50 text-indigo-600',
  },
  timesheet: { icon: Clock, className: 'bg-sky-50 text-sky-600' },
  leave: { icon: CalendarDays, className: 'bg-violet-50 text-violet-600' },
  task: { icon: ListTodo, className: 'bg-amber-50 text-amber-600' },
  policy: { icon: FileText, className: 'bg-slate-100 text-slate-600' },
  onboarding: { icon: UserCheck, className: 'bg-emerald-50 text-emerald-600' },
}

export function ActivityTable({
  items = [],
  onOpen,
  onViewAll,
  limit = 6,
  title = 'Recent activity',
  description = 'Latest updates across your workspace',
  className,
}) {
  const visible = items.slice(0, limit)

  return (
    <SectionCard
      id="activity"
      title={title}
      description={description}
      icon={Activity}
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
            icon={Activity}
            title="No activity yet"
            description="People updates, approvals, and changes will show up here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((item) => {
            const meta = TYPE_META[item.type] ?? TYPE_META.policy
            const Icon = meta.icon

            return (
              <li
                key={item.id}
                className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-slate-50/70"
              >
                <Avatar name={item.actorName} size="sm" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {item.actorName}
                    </span>{' '}
                    {item.action}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                    {item.detail}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">
                    {relativeTime(item.createdAt)}
                  </p>
                </div>
                <span
                  className={`mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:flex ${meta.className}`}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
                {onOpen ? (
                  <button
                    type="button"
                    onClick={() => onOpen(item.link)}
                    aria-label={`Open activity: ${item.detail}`}
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white hover:text-indigo-600"
                  >
                    <ArrowUpRight className="h-4 w-4" />
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
