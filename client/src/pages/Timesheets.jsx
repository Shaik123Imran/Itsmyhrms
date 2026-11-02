import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Search,
  Timer,
  X,
} from 'lucide-react'
import Modal from '../components/Modal'
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
  getCurrentEmployee,
  getTeamMembers,
} from '../services/workspaceStore'
import { formatDate, toISODate } from '../utils/date'

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Draft', 'Rejected']

const EMPTY_FORM = {
  date: toISODate(),
  project: 'ITSHRMS Platform',
  task: '',
  hours: '8',
}

const FIELD_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

export default function Timesheets() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [entries, setEntries] = useWorkspaceCollection(
    STORAGE_KEYS.timesheetEntries,
  )
  const [employees] = useWorkspaceCollection(STORAGE_KEYS.employees)
  const [projects] = useWorkspaceCollection(STORAGE_KEYS.projects)
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') ?? 'All',
  )
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const visibleEntries = useMemo(
    () =>
      entries
        .filter((entry) => visibleIds.has(entry.employeeId))
        .sort((left, right) =>
          String(right.dateISO ?? '').localeCompare(
            String(left.dateISO ?? ''),
          ),
        ),
    [entries, visibleIds],
  )

  const projectOptions = useMemo(() => {
    const names = [
      ...new Set(
        projects.map((project) => project.name).filter(Boolean),
      ),
    ]
    return names.length > 0
      ? names
      : ['ITSHRMS Platform', 'Client Portal', 'Internal']
  }, [projects])

  const canApprove = isOrgRole || isManager

  const canApproveEntry = (entry) =>
    canApprove &&
    entry.status === 'Pending' &&
    entry.employeeId !== currentEmployee?.id

  useEffect(() => {
    if (searchParams.get('action') === 'new' && currentEmployee) {
      setForm({ ...EMPTY_FORM, project: projectOptions[0] })
      setIsModalOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('action')
      setSearchParams(next, { replace: true })
    }

    const entryId = searchParams.get('entry')
    if (entryId) {
      setDetailId(entryId)
    }
  }, [searchParams, currentEmployee, projectOptions, setSearchParams])

  const closeModal = () => {
    setIsModalOpen(false)
    setForm(EMPTY_FORM)
  }

  const closeDetail = () => {
    setDetailId(null)
    const next = new URLSearchParams(searchParams)
    next.delete('entry')
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

    const task = form.task.trim()
    const hours = Number.parseFloat(form.hours)

    if (!form.date || !task || !Number.isFinite(hours) || hours <= 0) {
      setNotice({
        tone: 'error',
        message: 'Enter a valid date, task, and hours.',
      })
      return
    }

    setEntries((current) => [
      {
        id: `TS-${Date.now()}`,
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        date: formatDate(form.date),
        dateISO: form.date,
        project: form.project,
        task,
        hours,
        status: 'Pending',
        reviewedOn: null,
      },
      ...current,
    ])

    setNotice({
      tone: 'success',
      message: `${hours.toFixed(1)} hours logged for ${formatDate(form.date)}.`,
    })
    closeModal()
  }

  const handleDecision = (entry, status) => {
    setEntries((current) =>
      current.map((item) =>
        item.id === entry.id
          ? { ...item, status, reviewedOn: toISODate() }
          : item,
      ),
    )
    setNotice({
      tone: status === 'Approved' ? 'success' : 'info',
      message: `${entry.employeeName}'s timesheet was ${status.toLowerCase()}.`,
    })
  }

  const filteredEntries = visibleEntries.filter((entry) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      [entry.employeeName, entry.project, entry.task]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    const matchesStatus =
      statusFilter === 'All' || entry.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalHours = visibleEntries.reduce(
    (sum, entry) => sum + Number(entry.hours || 0),
    0,
  )
  const pendingCount = visibleEntries.filter(
    (entry) => entry.status === 'Pending',
  ).length
  const approvedHours = visibleEntries
    .filter((entry) => entry.status === 'Approved')
    .reduce((sum, entry) => sum + Number(entry.hours || 0), 0)
  const draftCount = visibleEntries.filter(
    (entry) => entry.status === 'Draft',
  ).length

  const detailEntry = entries.find((entry) => entry.id === detailId)
  const scopeLabel = isOrgWide
    ? 'Organisation-wide'
    : isManager
      ? 'Your team'
      : 'Your timesheets'

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Timer className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Timesheets
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {scopeLabel} hours, submissions, and approvals.
          </p>
        </div>
        {currentEmployee ? (
          <button
            type="button"
            onClick={() => {
              setForm({ ...EMPTY_FORM, project: projectOptions[0] })
              setIsModalOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Log time
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
          label={isEmployee ? 'Hours logged' : 'Team hours'}
          value={totalHours.toFixed(1)}
          detail="Across all entries"
          icon={Clock}
          accent="indigo"
        />
        <KpiCard
          label="Pending approval"
          value={pendingCount}
          detail={canApprove ? 'Awaiting your review' : 'Awaiting approval'}
          icon={CheckCircle2}
          accent="amber"
        />
        <KpiCard
          label="Approved hours"
          value={approvedHours.toFixed(1)}
          detail="Ready for payroll"
          icon={Check}
          accent="emerald"
        />
        <KpiCard
          label="Draft entries"
          value={draftCount}
          detail="Not submitted yet"
          icon={FileText}
          accent="slate"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {isEmployee ? 'My time entries' : 'Time entries'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredEntries.length} of {visibleEntries.length} entries ·{' '}
              {filteredEntries
                .reduce((sum, entry) => sum + Number(entry.hours || 0), 0)
                .toFixed(1)}{' '}
              hours
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search project, task, person"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                syncFilter('status', event.target.value, 'All')
              }}
              aria-label="Filter by timesheet status"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All statuses' : option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {!isEmployee ? (
                  <th className="px-5 py-3 font-semibold">Employee</th>
                ) : null}
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Project</th>
                <th className="px-3 py-3 font-semibold">Task</th>
                <th className="px-3 py-3 font-semibold">Hours</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={isEmployee ? 6 : 7}
                    className="px-5 py-10 text-center"
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      No timesheet entries found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try a different status or search term.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {!isEmployee ? (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={entry.employeeName} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {entry.employeeName}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">
                              {entry.id}
                            </p>
                          </div>
                        </div>
                      </td>
                    ) : null}
                    <td className="whitespace-nowrap px-3 py-3.5 text-xs font-medium text-slate-700">
                      {formatDate(entry.dateISO) !== '—'
                        ? formatDate(entry.dateISO)
                        : entry.date}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-xs text-slate-600">
                      {entry.project}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-3.5 text-xs text-slate-600">
                      {entry.task}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 font-medium tabular-nums text-slate-900">
                      {Number(entry.hours || 0).toFixed(1)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailId(entry.id)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </button>
                        {canApproveEntry(entry) ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleDecision(entry, 'Approved')
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDecision(entry, 'Rejected')
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
            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td
                  colSpan={isEmployee ? 3 : 4}
                  className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Total
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-bold tabular-nums text-slate-900">
                  {filteredEntries
                    .reduce(
                      (sum, entry) => sum + Number(entry.hours || 0),
                      0,
                    )
                    .toFixed(1)}
                </td>
                <td colSpan={2} className="px-5 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Log time"
        description="Add a timesheet entry for approval."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="timesheet-date"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Date
            </label>
            <input
              id="timesheet-date"
              name="date"
              type="date"
              required
              value={form.date}
              onChange={handleChange}
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="timesheet-project"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Project
            </label>
            <select
              id="timesheet-project"
              name="project"
              value={form.project}
              onChange={handleChange}
              className={FIELD_CLASS}
            >
              {projectOptions.map((project) => (
                <option key={project}>{project}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="timesheet-task"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Task
            </label>
            <input
              id="timesheet-task"
              name="task"
              type="text"
              required
              value={form.task}
              onChange={handleChange}
              placeholder="e.g. Component implementation"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="timesheet-hours"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Hours
            </label>
            <input
              id="timesheet-hours"
              name="hours"
              type="number"
              required
              min="0.5"
              max="24"
              step="0.5"
              value={form.hours}
              onChange={handleChange}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Save entry
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailEntry)}
        onClose={closeDetail}
        title="Timesheet entry"
        description="Entry details and approval status."
      >
        {detailEntry ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={detailEntry.employeeName} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">
                  {detailEntry.employeeName}
                </p>
                <p className="text-xs text-slate-500">
                  {detailEntry.project} · {detailEntry.task}
                </p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={detailEntry.status} />
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                [
                  'Date',
                  formatDate(detailEntry.dateISO) !== '—'
                    ? formatDate(detailEntry.dateISO)
                    : detailEntry.date,
                ],
                [
                  'Hours',
                  Number(detailEntry.hours || 0).toFixed(1),
                ],
                [
                  'Reviewed on',
                  detailEntry.reviewedOn
                    ? formatDate(detailEntry.reviewedOn)
                    : 'Not reviewed',
                ],
                ['Entry ID', detailEntry.id],
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

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              {canApproveEntry(detailEntry) ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleDecision(detailEntry, 'Rejected')
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
                      handleDecision(detailEntry, 'Approved')
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
