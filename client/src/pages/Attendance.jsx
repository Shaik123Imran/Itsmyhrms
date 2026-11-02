import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlarmClock,
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import {
  Avatar,
  InlineNotice,
  KpiCard,
  StatusBadge,
} from '../components/dashboard/ui'
import { useAuth } from '../contexts/AuthContext'
import { getRoleKey, isOrgWideRole } from '../config/roles'
import { useWorkspaceCollection } from '../hooks/useWorkspaceCollection'
import {
  STORAGE_KEYS,
  checkIn,
  checkOut,
  getCurrentEmployee,
  getTeamMembers,
} from '../services/workspaceStore'
import {
  formatClockTime,
  formatDate,
  hoursBetween,
  monthKey,
  monthLabel,
  startOfMonth,
  toISODate,
} from '../utils/date'

const STATUS_OPTIONS = [
  'All',
  'Present',
  'Late',
  'Remote',
  'On Leave',
  'Absent',
  'Not marked',
]

export default function Attendance() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [attendance] = useWorkspaceCollection(STORAGE_KEYS.attendance)
  const [employees] = useWorkspaceCollection(STORAGE_KEYS.employees)
  const [now, setNow] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') ?? toISODate(),
  )
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') ?? 'All',
  )
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const roleKey = getRoleKey(user?.role)
  const isOrgWide = isOrgWideRole(roleKey)
  const isManager = roleKey === 'manager'
  const isEmployee = roleKey === 'employee'
  const currentEmployee = getCurrentEmployee(user, employees)

  const visibleEmployees = useMemo(() => {
    if (isOrgWide) return employees
    if (isManager) return getTeamMembers(currentEmployee?.id, employees)
    return currentEmployee ? [currentEmployee] : []
  }, [employees, isOrgWide, isManager, currentEmployee])

  const todayISO = toISODate()
  const myToday = attendance.find(
    (record) =>
      record.employeeId === currentEmployee?.id && record.date === todayISO,
  )
  const isCheckedIn = Boolean(myToday?.checkIn)
  const isCheckedOut = Boolean(myToday?.checkOut)

  const liveHours = useMemo(() => {
    if (!myToday?.checkIn) return 0
    if (myToday.checkOut) return Number(myToday.hours) || 0
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`
    return hoursBetween(myToday.checkIn, currentTime)
  }, [myToday, now])

  const selectedRecords = useMemo(() => {
    const byEmployee = new Map(
      attendance
        .filter((record) => record.date === selectedDate)
        .map((record) => [record.employeeId, record]),
    )

    return visibleEmployees.map((employee) => {
      const record = byEmployee.get(employee.id)
      if (record) return record
      return {
        id: `${employee.id}-${selectedDate}`,
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        date: selectedDate,
        status: 'Not marked',
        checkIn: null,
        checkOut: null,
        hours: 0,
        workMode: '—',
      }
    })
  }, [attendance, visibleEmployees, selectedDate])

  const filteredSelectedRecords = selectedRecords.filter(
    (record) => statusFilter === 'All' || record.status === statusFilter,
  )

  const monthStartISO = useMemo(() => {
    const start = startOfMonth(selectedDate)
    return start ? toISODate(start) : ''
  }, [selectedDate])
  const myMonthRecords = useMemo(() => {
    if (!currentEmployee) return []
    const key = monthKey(selectedDate)
    return attendance
      .filter(
        (record) =>
          record.employeeId === currentEmployee.id &&
          record.date >= monthStartISO &&
          monthKey(record.date) === key,
      )
      .filter(
        (record) =>
          statusFilter === 'All' || record.status === statusFilter,
      )
      .sort((left, right) => right.date.localeCompare(left.date))
  }, [
    attendance,
    currentEmployee,
    monthStartISO,
    selectedDate,
    statusFilter,
  ])

  const myMonthStats = useMemo(() => {
    if (!currentEmployee) {
      return { present: 0, late: 0, leave: 0, absent: 0 }
    }
    const key = monthKey(selectedDate)
    const records = attendance.filter(
      (record) =>
        record.employeeId === currentEmployee.id &&
        record.date >= monthStartISO &&
        monthKey(record.date) === key,
    )

    return records.reduce(
      (stats, record) => {
        if (record.status === 'Present' || record.status === 'Remote') {
          stats.present += 1
        }
        if (record.status === 'Late') {
          stats.present += 1
          stats.late += 1
        }
        if (record.status === 'On Leave') stats.leave += 1
        if (record.status === 'Absent') stats.absent += 1
        return stats
      },
      { present: 0, late: 0, leave: 0, absent: 0 },
    )
  }, [attendance, currentEmployee, monthStartISO, selectedDate])

  const dayStats = useMemo(() => {
    return selectedRecords.reduce(
      (stats, record) => {
        if (record.status === 'Present' || record.status === 'Remote') {
          stats.present += 1
        }
        if (record.status === 'Late') {
          stats.present += 1
          stats.late += 1
        }
        if (record.status === 'Remote') stats.remote += 1
        if (record.status === 'On Leave') stats.leave += 1
        if (record.status === 'Not marked') stats.notMarked += 1
        return stats
      },
      { present: 0, late: 0, remote: 0, leave: 0, notMarked: 0 },
    )
  }, [selectedRecords])

  const syncFilter = (key, value, fallback) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === fallback) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  const handlePunch = (action) => {
    setBusy(true)
    setNotice(null)
    try {
      if (action === 'in') {
        checkIn(user)
        setNotice({ tone: 'success', message: 'Checked in successfully.' })
      } else {
        checkOut(user)
        setNotice({ tone: 'success', message: 'Checked out successfully.' })
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error?.message || 'Unable to update attendance.',
      })
    } finally {
      setBusy(false)
    }
  }

  const clockTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const clockDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const scopeLabel = isOrgWide
    ? 'Organisation-wide'
    : isManager
      ? 'Your team'
      : 'Your attendance'

  const stats = isEmployee
    ? [
        {
          label: 'Present this month',
          value: myMonthStats.present,
          detail: monthLabel(selectedDate),
          icon: UserCheck,
          accent: 'emerald',
        },
        {
          label: 'Late arrivals',
          value: myMonthStats.late,
          detail: 'This month',
          icon: AlarmClock,
          accent: 'amber',
        },
        {
          label: 'On leave',
          value: myMonthStats.leave,
          detail: 'Approved leave days',
          icon: CalendarDays,
          accent: 'violet',
        },
        {
          label: 'Absent',
          value: myMonthStats.absent,
          detail: 'Unmarked or absent',
          icon: UserX,
          accent: 'rose',
        },
      ]
    : [
        {
          label: 'Present',
          value: dayStats.present,
          detail: formatDate(selectedDate),
          icon: UserCheck,
          accent: 'emerald',
        },
        {
          label: 'Late',
          value: dayStats.late,
          detail: 'After 09:30',
          icon: AlarmClock,
          accent: 'amber',
        },
        {
          label: 'Remote',
          value: dayStats.remote,
          detail: 'Working remotely',
          icon: Users,
          accent: 'sky',
        },
        {
          label: 'Not marked',
          value: dayStats.notMarked,
          detail: 'No record for the day',
          icon: UserX,
          accent: 'rose',
        },
      ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Attendance
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {scopeLabel} check-ins, working hours, and daily status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value)
                syncFilter('date', event.target.value, todayISO)
              }}
              aria-label="Attendance date"
              className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value)
              syncFilter('status', event.target.value, 'All')
            }}
            aria-label="Filter by attendance status"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All statuses' : option}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSelectedDate(todayISO)
              syncFilter('date', todayISO, todayISO)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Today
          </button>
        </div>
      </div>

      {notice ? (
        <InlineNotice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.message}
        </InlineNotice>
      ) : null}

      <div className="flex flex-col gap-6 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-800 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-100">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Current time
            </span>
          </div>
          <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
            {clockTime}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-indigo-100">
            <CalendarDays className="h-4 w-4" />
            {clockDate}
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                isCheckedIn && !isCheckedOut
                  ? 'bg-emerald-300'
                  : isCheckedOut
                    ? 'bg-sky-300'
                    : 'bg-slate-300'
              }`}
            />
            {!currentEmployee
              ? 'No employee profile is linked to this account.'
              : !isCheckedIn
                ? 'You are not checked in yet.'
                : isCheckedOut
                  ? `Checked out at ${formatClockTime(myToday.checkOut)} · ${Number(
                      myToday.hours || 0,
                    ).toFixed(1)}h logged`
                  : `Checked in at ${formatClockTime(myToday.checkIn)} · ${liveHours.toFixed(
                      1,
                    )}h so far`}
          </p>
        </div>

        {currentEmployee ? (
          <button
            type="button"
            onClick={() => handlePunch(isCheckedIn ? 'out' : 'in')}
            disabled={busy || (isCheckedIn && isCheckedOut)}
            className={`inline-flex items-center justify-center gap-2 self-start rounded-xl px-8 py-4 text-base font-semibold shadow-lg transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 sm:self-auto ${
              isCheckedIn && !isCheckedOut
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            {isCheckedOut ? (
              <UserCheck className="h-5 w-5" />
            ) : isCheckedIn ? (
              <LogOut className="h-5 w-5" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            {isCheckedOut
              ? 'Day complete'
              : isCheckedIn
                ? 'Punch out'
                : 'Punch in'}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <KpiCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            detail={stat.detail}
            icon={stat.icon}
            accent={stat.accent}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {isEmployee ? 'My attendance history' : 'Attendance register'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isEmployee
                ? `${monthLabel(selectedDate)} · ${myMonthRecords.length} records`
                : `${formatDate(selectedDate)} · ${filteredSelectedRecords.length} of ${selectedRecords.length} employees`}
            </p>
          </div>
          <span className="self-start rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 sm:self-auto">
            {scopeLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              {isEmployee ? (
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Check in</th>
                  <th className="px-3 py-3 font-semibold">Check out</th>
                  <th className="px-3 py-3 font-semibold">Hours</th>
                  <th className="px-5 py-3 font-semibold">Mode</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Check in</th>
                  <th className="px-3 py-3 font-semibold">Check out</th>
                  <th className="px-3 py-3 font-semibold">Hours</th>
                  <th className="px-5 py-3 font-semibold">Mode</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(isEmployee ? myMonthRecords : filteredSelectedRecords).length ===
              0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No attendance records found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try a different date or status filter.
                    </p>
                  </td>
                </tr>
              ) : isEmployee ? (
                myMonthRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-slate-600">
                      {record.checkIn
                        ? formatClockTime(record.checkIn)
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-slate-600">
                      {record.checkOut
                        ? formatClockTime(record.checkOut)
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 font-medium tabular-nums text-slate-900">
                      {Number(record.hours || 0).toFixed(1)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {record.workMode ?? '—'}
                    </td>
                  </tr>
                ))
              ) : (
                filteredSelectedRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={record.employeeName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {record.employeeName}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {record.department ?? '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-slate-600">
                      {record.checkIn
                        ? formatClockTime(record.checkIn)
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-slate-600">
                      {record.checkOut
                        ? formatClockTime(record.checkOut)
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 font-medium tabular-nums text-slate-900">
                      {Number(record.hours || 0).toFixed(1)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {record.workMode ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
