import { CalendarCheck } from 'lucide-react'
import { formatClockTime } from '../../utils/date'
import {
  Avatar,
  EmptyState,
  SectionAction,
  SectionCard,
  StatusBadge,
} from './ui'

function formatHours(hours) {
  if (!hours) {
    return '—'
  }
  return `${hours}h`
}

export function TodayAttendanceTable({
  rows = [],
  onViewAll,
  limit = 6,
  title = "Today's attendance",
  description,
  className,
}) {
  const visible = rows.slice(0, limit)
  const working = rows.filter((row) =>
    ['Present', 'Late', 'Remote'].includes(row.status),
  ).length
  const notMarked = rows.filter((row) => row.status === 'Not marked').length

  return (
    <SectionCard
      id="today-attendance"
      title={title}
      description={description ?? `${working} of ${rows.length} marked in`}
      icon={CalendarCheck}
      className={className}
      bodyClassName="p-0"
      action={
        onViewAll ? (
          <SectionAction onClick={onViewAll}>View attendance</SectionAction>
        ) : null
      }
    >
      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            compact
            icon={CalendarCheck}
            title="No attendance records"
            description="Attendance will appear here once people check in."
          />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                  <th scope="col" className="px-5 py-2.5 font-semibold">
                    Employee
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Check in
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Check out
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Hours
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold">
                    Mode
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={row.name}
                          initials={row.initials}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {row.name}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {row.department}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-slate-600">
                      {row.checkIn ? formatClockTime(row.checkIn) : '—'}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-slate-600">
                      {row.checkOut ? formatClockTime(row.checkOut) : '—'}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-slate-600">
                      {formatHours(row.hours)}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-600">
                      {row.workMode ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {notMarked > 0 || rows.length > limit ? (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                {notMarked > 0
                  ? `${notMarked} employee${notMarked === 1 ? '' : 's'} not marked yet`
                  : `${rows.length} total records`}
              </p>
              {onViewAll && rows.length > limit ? (
                <SectionAction onClick={onViewAll}>See all</SectionAction>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </SectionCard>
  )
}
