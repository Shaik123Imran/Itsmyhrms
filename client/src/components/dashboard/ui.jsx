import clsx from 'clsx'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Info,
  Inbox,
  RefreshCw,
  X,
} from 'lucide-react'

const ACCENTS = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  sky: 'bg-sky-50 text-sky-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-100 text-slate-600',
}

const BADGE_STYLES = {
  Present: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Late: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Remote: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'On Leave': 'bg-violet-50 text-violet-700 ring-violet-600/20',
  Absent: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  'Not marked': 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Draft: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Overdue: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Todo: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  'In Progress': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'On Track': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'At Risk': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Open: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Urgent: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Applied: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Screening: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Interview: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  Offer: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'On leave': 'bg-violet-50 text-violet-700 ring-violet-600/20',
}

const PROGRESS_TONES = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-400',
}

export function initialsFor(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function Avatar({ name, initials, size = 'md', className }) {
  const sizes = {
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-16 w-16 text-lg',
  }

  return (
    <span
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-700',
        sizes[size] ?? sizes.md,
        className,
      )}
      aria-hidden="true"
    >
      {initials || initialsFor(name)}
    </span>
  )
}

export function StatusBadge({ status, tone, className }) {
  const style =
    BADGE_STYLES[status] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20'
  const toneStyle = tone
    ? {
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
        sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
        violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
        slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
      }[tone]
    : null

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        toneStyle ?? style,
        className,
      )}
    >
      {status}
    </span>
  )
}

export function ProgressBar({ value = 0, tone = 'indigo', className }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div
      className={clsx(
        'h-2 w-full overflow-hidden rounded-full bg-slate-100',
        className,
      )}
    >
      <div
        className={clsx(
          'h-full rounded-full transition-all',
          PROGRESS_TONES[tone] ?? PROGRESS_TONES.indigo,
        )}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}

export function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = 'indigo',
  onClick,
  trend,
  ariaLabel,
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        {Icon ? (
          <span
            className={clsx(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              ACCENTS[accent] ?? ACCENTS.indigo,
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{detail}</p>
        {trend ? (
          <span
            className={clsx(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              trend.positive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700',
            )}
          >
            {trend.label}
          </span>
        ) : null}
        {onClick ? (
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
        ) : null}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? `${label}: ${value}`}
        className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {content}
    </div>
  )
}

export function SectionCard({
  id,
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
  padded = true,
}) {
  return (
    <section
      id={id}
      className={clsx(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={clsx(padded && 'p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function SectionAction({ children, onClick, href }) {
  if (href) {
    return (
      <a
        href={href}
        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
      >
        {children}
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  )
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  compact = false,
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center',
        compact ? 'px-4 py-6' : 'px-6 py-10',
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-rose-900">
            We could not load your dashboard
          </h2>
          <p className="mt-1 text-sm text-rose-700">
            {message || 'Please try again in a moment.'}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const NOTICE_STYLES = {
  info: {
    wrapper: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: Info,
    iconClass: 'text-sky-600',
  },
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
  },
  error: {
    wrapper: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: AlertTriangle,
    iconClass: 'text-rose-600',
  },
}

export function InlineNotice({
  tone = 'info',
  title,
  children,
  onDismiss,
}) {
  const style = NOTICE_STYLES[tone] ?? NOTICE_STYLES.info
  const Icon = style.icon

  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${style.wrapper}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconClass}`} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-0.5 text-xs' : 'text-xs'}>{children}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notice"
          className="rounded p-1 text-current/60 transition hover:bg-white/60"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export function QuickActions({ actions, title = 'Quick actions' }) {
  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-white group-hover:text-indigo-600">
                {Icon ? <Icon className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </span>
              <span className="min-w-0 leading-tight">{action.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function DateRangeFilter({ value, onChange, options }) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <select
        aria-label="Dashboard date range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function SkeletonLine({ className }) {
  return (
    <div
      className={clsx('animate-pulse rounded-full bg-slate-200', className)}
    />
  )
}

export function SkeletonCard({ lines = 3, className }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm',
        className,
      )}
    >
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="mt-4 h-7 w-20" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLine
            key={index}
            className={clsx('h-2.5', index % 2 === 0 ? 'w-full' : 'w-3/4')}
          />
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-3">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-8 w-72 max-w-full" />
        <SkeletonLine className="h-3 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} lines={2} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-xl bg-slate-200/80"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <SkeletonLine className="h-3 w-40" />
          <div className="mt-6 flex h-56 items-end gap-3">
            {[40, 70, 55, 80, 60, 90, 65].map((height, index) => (
              <div
                key={index}
                className="flex-1 animate-pulse rounded-t-lg bg-slate-200"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <SkeletonCard lines={6} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={5} />
      </div>
    </div>
  )
}
