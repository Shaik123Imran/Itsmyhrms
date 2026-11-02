import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Award,
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock,
  HeartPulse,
  Plus,
  Search,
  X,
} from 'lucide-react'
import Modal from '../components/Modal'
import {
  Avatar,
  InlineNotice,
  KpiCard,
  ProgressBar,
  StatusBadge,
} from '../components/dashboard/ui'
import { useAuth } from '../contexts/AuthContext'
import { getRoleKey, isOrgWideRole } from '../config/roles'
import { useWorkspaceCollection } from '../hooks/useWorkspaceCollection'
import {
  STORAGE_KEYS,
  getCurrentEmployee,
  getTeamMembers,
} from '../services/workspaceStore'
import { diffInDays, formatDate, toISODate } from '../utils/date'

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Unpaid Leave',
]

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected']

const BALANCE_META = {
  'Casual Leave': {
    icon: CalendarDays,
    accent: 'bg-sky-50 text-sky-600',
    bar: 'sky',
  },
  'Sick Leave': {
    icon: HeartPulse,
    accent: 'bg-rose-50 text-rose-600',
    bar: 'rose',
  },
  'Earned Leave': {
    icon: Award,
    accent: 'bg-emerald-50 text-emerald-600',
    bar: 'emerald',
  },
}

const EMPTY_FORM = {
  type: 'Casual Leave',
  startDate: '',
  endDate: '',
  reason: '',
}

const FIELD_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

function formatRange(startDate, endDate) {
  if (!startDate) return '—'
  if (!endDate || startDate === endDate) return formatDate(startDate)
  return `${formatDate(startDate)} – ${formatDate(endDate)}`
}

export default function Leave() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [records, setRecords] = useWorkspaceCollection(
    STORAGE_KEYS.leaveRecords,
  )
  const [balances] = useWorkspaceCollection(STORAGE_KEYS.leaveBalances)
  const [employees] = useWorkspaceCollection(STORAGE_KEYS.employees)
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') ?? 'All',
  )
  const [typeFilter, setTypeFilter] = useState(
    searchParams.get('type') ?? 'All',
  )
  const [search, setSearch] = useState('')
  const [isRequestOpen, setIsRequestOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [notice, setNotice] = useState(null)

  const roleKey = getRoleKey(user?.role)
  const isOrgRole = roleKey === 'admin' || roleKey === 'hr'
  const isOrgWide = isOrgWideRole(roleKey)
  const isManager = roleKey === 'manager'
  const isEmployee = roleKey === 'employee'
  const currentEmployee = getCurrentEmployee(user, employees)
  const teamMembers = useMemo(
    () =>
      isManager
        ? getTeamMembers(currentEmployee?.id, employees)
        : [],
    [isManager, currentEmployee, employees],
  )

  const visibleIds = useMemo(() => {
    if (isOrgWide) return new Set(employees.map((employee) => employee.id))
    if (isManager) {
      return new Set(
        [currentEmployee?.id, ...teamMembers.map((employee) => employee.id)]
          .filter(Boolean),
      )
    }
    return new Set(currentEmployee ? [currentEmployee.id] : [])
  }, [isOrgWide, isManager, employees, currentEmployee, teamMembers])

  const visibleRecords = useMemo(
    () =>
      records
        .filter((record) => visibleIds.has(record.employeeId))
        .sort((left, right) =>
          String(right.appliedOn ?? '').localeCompare(
            String(left.appliedOn ?? ''),
          ),
        ),
    [records, visibleIds],
  )

  const canApprove = isOrgRole || isManager

  const canApproveRecord = (record) =>
    canApprove &&
    record.status === 'Pending' &&
    record.employeeId !== currentEmployee?.id

  useEffect(() => {
    if (searchParams.get('action') === 'new' && currentEmployee) {
      setForm(EMPTY_FORM)
      setIsRequestOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('action')
      setSearchParams(next, { replace: true })
    }

    const requestId = searchParams.get('request')
    if (requestId) {
      setDetailId(requestId)
    }
  }, [searchParams, currentEmployee, setSearchParams])

  const closeRequest = () => {
    setIsRequestOpen(false)
    setForm(EMPTY_FORM)
  }

  const closeDetail = () => {
    setDetailId(null)
    const next = new URLSearchParams(searchParams)
    next.delete('request')
    setSearchParams(next, { replace: true })
  }

  const syncFilter = (key, value, fallback) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === fallback) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!currentEmployee) {
      setNotice({
        tone: 'error',
        message: 'No employee profile is linked to this account.',
      })
      return
    }

    if (!form.startDate || !form.endDate) {
      setNotice({ tone: 'error', message: 'Select a start and end date.' })
      return
    }

    if (form.endDate < form.startDate) {
      setNotice({
        tone: 'error',
        message: 'End date cannot be before the start date.',
      })
      return
    }

    const days = Math.max(1, diffInDays(form.startDate, form.endDate) + 1)

    setRecords((current) => [
      {
        id: `LV-${Date.now()}`,
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        days,
        status: 'Pending',
        reason: form.reason.trim(),
        appliedOn: toISODate(),
        reviewedOn: null,
      },
      ...current,
    ])

    setNotice({
      tone: 'success',
      message: `Leave request submitted for ${days} ${days === 1 ? 'day' : 'days'}.`,
    })
    closeRequest()
  }

  const handleDecision = (record, status) => {
    setRecords((current) =>
      current.map((item) =>
        item.id === record.id
          ? { ...item, status, reviewedOn: toISODate() }
          : item,
      ),
    )
    setNotice({
      tone: status === 'Approved' ? 'success' : 'info',
      message: `${record.employeeName}'s leave request was ${status.toLowerCase()}.`,
    })
  }

  const filteredRecords = visibleRecords.filter((record) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      [record.employeeName, record.type, record.reason]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    const matchesStatus =
      statusFilter === 'All' || record.status === statusFilter
    const matchesType = typeFilter === 'All' || record.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const todayISO = toISODate()
  const pendingCount = visibleRecords.filter(
    (record) => record.status === 'Pending',
  ).length
  const approvedCount = visibleRecords.filter(
    (record) => record.status === 'Approved',
  ).length
  const upcomingCount = visibleRecords.filter(
    (record) =>
      record.startDate > todayISO && record.status !== 'Rejected',
  ).length
  const onLeaveToday = visibleRecords.filter(
    (record) =>
      record.status === 'Approved' &&
      record.startDate <= todayISO &&
      record.endDate >= todayISO,
  ).length

  const myBalances = currentEmployee
    ? balances[currentEmployee.id] ?? []
    : []
  const availableDays = myBalances.reduce(
    (sum, balance) => sum + Number(balance.available || 0),
    0,
  )

  const detailRecord = records.find((record) => record.id === detailId)
  const scopeLabel = isOrgWide
    ? 'Organisation-wide'
    : isManager
      ? 'Your team'
      : 'Your leave'

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Leave Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {scopeLabel} balances, requests, and approvals.
          </p>
        </div>
        {currentEmployee ? (
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM)
              setIsRequestOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Request leave
          </button>
        ) : null}
      </div>

      {notice ? (
        <InlineNotice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.message}
        </InlineNotice>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pending requests"
          value={pendingCount}
          detail={canApprove ? 'Awaiting your review' : 'Awaiting approval'}
          icon={Clock}
          accent="amber"
        />
        <KpiCard
          label="Approved"
          value={approvedCount}
          detail="Approved requests"
          icon={CalendarCheck2}
          accent="emerald"
        />
        <KpiCard
          label="On leave today"
          value={onLeaveToday}
          detail={formatDate(todayISO)}
          icon={CalendarDays}
          accent="violet"
        />
        <KpiCard
          label={currentEmployee ? 'Available days' : 'Upcoming leave'}
          value={currentEmployee ? availableDays : upcomingCount}
          detail={
            currentEmployee
              ? 'Across all leave types'
              : 'Starting after today'
          }
          icon={Award}
          accent="sky"
        />
      </div>

      {currentEmployee && myBalances.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            My leave balances
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {myBalances.map((balance) => {
              const meta = BALANCE_META[balance.type] ?? BALANCE_META['Casual Leave']
              const Icon = meta.icon
              const percentage =
                balance.total > 0
                  ? Math.round((balance.available / balance.total) * 100)
                  : 0

              return (
                <div
                  key={balance.type}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {balance.type}
                      </p>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {balance.available}
                        <span className="ml-1 text-sm font-medium text-slate-400">
                          / {balance.total} days
                        </span>
                      </p>
                    </div>
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${meta.accent}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-4">
                    <ProgressBar value={percentage} tone={meta.bar} />
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {balance.available} days remaining · {percentage}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {isEmployee ? 'My leave requests' : 'Leave requests'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredRecords.length} of {visibleRecords.length} requests
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search requests"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-52"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                syncFilter('status', event.target.value, 'All')
              }}
              aria-label="Filter by leave status"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All statuses' : option}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value)
                syncFilter('type', event.target.value, 'All')
              }}
              aria-label="Filter by leave type"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All types</option>
              {LEAVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {!isEmployee ? (
                  <th className="px-5 py-3 font-semibold">Employee</th>
                ) : null}
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Dates</th>
                <th className="px-3 py-3 font-semibold">Days</th>
                <th className="px-3 py-3 font-semibold">Reason</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={isEmployee ? 6 : 7}
                    className="px-5 py-10 text-center"
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      No leave requests found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try a different status or type filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {!isEmployee ? (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={record.employeeName} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {record.employeeName}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">
                              Applied {formatDate(record.appliedOn)}
                            </p>
                          </div>
                        </div>
                      </td>
                    ) : null}
                    <td className="whitespace-nowrap px-3 py-3.5 text-xs font-medium text-slate-700">
                      {record.type}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-xs text-slate-600">
                      {formatRange(record.startDate, record.endDate)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-xs font-medium text-slate-700">
                      {record.days}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3.5 text-xs text-slate-500">
                      {record.reason || '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailId(record.id)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </button>
                        {canApproveRecord(record) ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleDecision(record, 'Approved')
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDecision(record, 'Rejected')
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={isRequestOpen}
        onClose={closeRequest}
        title="Request leave"
        description="Submit a leave request for approval."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="leave-type"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Leave type
            </label>
            <select
              id="leave-type"
              name="type"
              value={form.type}
              onChange={handleChange}
              className={FIELD_CLASS}
            >
              {LEAVE_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="leave-start-date"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Start date
              </label>
              <input
                id="leave-start-date"
                name="startDate"
                type="date"
                required
                value={form.startDate}
                onChange={handleChange}
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="leave-end-date"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                End date
              </label>
              <input
                id="leave-end-date"
                name="endDate"
                type="date"
                required
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={handleChange}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="leave-reason"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Reason
            </label>
            <textarea
              id="leave-reason"
              name="reason"
              rows={3}
              value={form.reason}
              onChange={handleChange}
              placeholder="Add context for your manager or HR"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={closeRequest}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Submit request
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailRecord)}
        onClose={closeDetail}
        title="Leave request"
        description="Request details and approval history."
      >
        {detailRecord ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={detailRecord.employeeName} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">
                  {detailRecord.employeeName}
                </p>
                <p className="text-xs text-slate-500">
                  {detailRecord.type} · {detailRecord.days}{' '}
                  {detailRecord.days === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={detailRecord.status} />
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                [
                  'Dates',
                  formatRange(detailRecord.startDate, detailRecord.endDate),
                ],
                ['Applied on', formatDate(detailRecord.appliedOn)],
                [
                  'Reviewed on',
                  detailRecord.reviewedOn
                    ? formatDate(detailRecord.reviewedOn)
                    : 'Not reviewed',
                ],
                ['Request ID', detailRecord.id],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Reason
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {detailRecord.reason || 'No reason provided.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              {canApproveRecord(detailRecord) ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleDecision(detailRecord, 'Rejected')
                      closeDetail()
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDecision(detailRecord, 'Approved')
                      closeDetail()
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
