import { RefreshCw } from 'lucide-react'
import { roleBadgeClass } from '../../config/roles'
import { formatDate, toISODate } from '../../utils/date'
import { DateRangeFilter } from './ui'

export const RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

function greetingForNow() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardHeader({
  user,
  roleKey,
  roleLabel,
  scopeLabel,
  rangeDays,
  onRangeChange,
  onRefresh,
  refreshing = false,
  subtitle,
}) {
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const todayLabel = formatDate(toISODate(), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const resolvedSubtitle =
    subtitle ??
    (scopeLabel === 'Me'
      ? 'Here is your personal workspace snapshot for today.'
      : `Here is what is happening across ${String(
          scopeLabel ?? 'your workspace',
        ).toLowerCase()} today.`)

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(
              roleKey,
            )}`}
          >
            {roleLabel}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {scopeLabel}
          </span>
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs font-medium text-slate-400">
            {todayLabel}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {greetingForNow()}, {firstName}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          {resolvedSubtitle}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DateRangeFilter
          value={rangeDays}
          onChange={onRangeChange}
          options={RANGE_OPTIONS}
        />
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        ) : null}
      </div>
    </div>
  )
}
