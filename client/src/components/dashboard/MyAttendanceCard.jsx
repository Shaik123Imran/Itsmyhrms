import { CalendarCheck, Clock } from 'lucide-react'
import { formatClockTime, formatDate } from '../../utils/date'
import {
  EmptyState,
  ProgressBar,
  SectionAction,
  SectionCard,
  StatusBadge,
} from './ui'

function MiniStat({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-bold ${tone ?? 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  )
}

export function MyAttendanceCard({
  record,
  monthly,
  liveHours = 0,
  history = [],
  onViewAll,
  className,
}) {
  const status = record?.status ?? 'Not marked'
  const working = monthly?.workingDays ?? 0
  const present = monthly?.presentDays ?? 0

  return (
    <SectionCard
      id="my-attendance"
      title="My attendance"
      description={monthly?.monthLabel ?? 'This month'}
      icon={Clock}
      className={className}
      action={
        onViewAll ? (
          <SectionAction onClick={onViewAll}>Attendance</SectionAction>
        ) : null
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">Today</p>
          <div className="mt-1.5 flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-xs font-medium text-slate-500">
              {record?.checkIn
                ? `${formatClockTime(record.checkIn)} – ${
                    record.checkOut
                      ? formatClockTime(record.checkOut)
                      : 'in progress'
                  }`
                : 'No check-in yet'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-slate-500">Live hours</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{liveHours}h</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">Monthly attendance</span>
          <span className="font-semibold text-slate-700">
            {present} / {working} days
          </span>
        </div>
        <ProgressBar value={monthly?.percentage ?? 0} tone="emerald" />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <MiniStat
          label="Present"
          value={present}
          tone="text-emerald-600"
        />
        <MiniStat
          label="Late"
          value={monthly?.lateDays ?? 0}
          tone="text-amber-600"
        />
        <MiniStat
          label="Leave"
          value={monthly?.leaveDays ?? 0}
          tone="text-violet-600"
        />
        <MiniStat
          label="Absent"
          value={monthly?.absentDays ?? 0}
          tone="text-rose-600"
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5 text-slate-400" />
          <p className="text-xs font-semibold text-slate-500">Recent days</p>
        </div>
        {history.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarCheck}
            title="No recent attendance"
            description="Check in to start building your attendance history."
          />
        ) : (
          <ul className="space-y-1.5">
            {history.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5"
              >
                <span className="text-xs font-medium text-slate-600">
                  {formatDate(item.date, { month: 'short', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="w-10 text-right text-[11px] font-medium text-slate-400">
                    {item.hours ? `${item.hours}h` : '—'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  )
}
