import { Fragment, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Building2,
  Eye,
  Pencil,
  Plus,
  Search,
  UserPlus,
  Users,
} from 'lucide-react'
import Modal from '../components/Modal'
import {
  Avatar,
  InlineNotice,
  KpiCard,
  StatusBadge,
} from '../components/dashboard/ui'
import { useAuth } from '../contexts/AuthContext'
import { getRoleKey } from '../config/roles'
import { useWorkspaceCollection } from '../hooks/useWorkspaceCollection'
import {
  STORAGE_KEYS,
  getCurrentEmployee,
  getTeamMembers,
} from '../services/workspaceStore'
import { formatDate, toISODate } from '../utils/date'

const EMPTY_FORM = {
  name: '',
  email: '',
  department: 'Engineering',
  role: '',
  status: 'Active',
  managerId: '',
  branch: 'Bengaluru HQ',
  workMode: 'Office',
}

const FIELD_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

const STATUS_OPTIONS = ['All', 'Active', 'On Leave', 'Exited']
const GROUP_OPTIONS = [
  { value: 'department', label: 'Group by department' },
  { value: 'branch', label: 'Group by branch' },
  { value: 'none', label: 'No grouping' },
]

function defaultEmail(name) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')}@itshrms.com`
}

export default function Employees() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [employees, setEmployees] = useWorkspaceCollection(
    STORAGE_KEYS.employees,
  )
  const [departments] = useWorkspaceCollection(STORAGE_KEYS.departments)
  const [branches] = useWorkspaceCollection(STORAGE_KEYS.branches)
  const [modalMode, setModalMode] = useState(null)
  const [activeEmployeeId, setActiveEmployeeId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [notice, setNotice] = useState(null)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? 'All')
  const [department, setDepartment] = useState(
    searchParams.get('department') ?? 'All',
  )
  const [groupBy, setGroupBy] = useState(
    searchParams.get('group') ?? 'department',
  )

  const roleKey = getRoleKey(user?.role)
  const isOrgRole = roleKey === 'admin' || roleKey === 'hr'
  const isManager = roleKey === 'manager'
  const currentEmployee = getCurrentEmployee(user, employees)
  const canManage = isOrgRole

  const visibleEmployees = useMemo(() => {
    if (isOrgRole) return employees
    if (isManager) return getTeamMembers(currentEmployee?.id, employees)
    return currentEmployee ? [currentEmployee] : []
  }, [employees, isOrgRole, isManager, currentEmployee])

  const activeEmployee = employees.find(
    (employee) => employee.id === activeEmployeeId,
  )
  const isModalOpen = modalMode !== null

  useEffect(() => {
    if (searchParams.get('action') === 'add' && canManage) {
      setForm({
        ...EMPTY_FORM,
        department: departments[0]?.name ?? 'Engineering',
        branch: branches[0]?.name ?? 'Bengaluru HQ',
      })
      setActiveEmployeeId(null)
      setModalMode('add')
      const next = new URLSearchParams(searchParams)
      next.delete('action')
      setSearchParams(next, { replace: true })
    }
  }, [
    searchParams,
    canManage,
    departments,
    branches,
    setSearchParams,
  ])

  const closeModal = () => {
    setModalMode(null)
    setActiveEmployeeId(null)
    setForm(EMPTY_FORM)
  }

  const openAdd = () => {
    setForm({
      ...EMPTY_FORM,
      department: departments[0]?.name ?? 'Engineering',
      branch: branches[0]?.name ?? 'Bengaluru HQ',
    })
    setActiveEmployeeId(null)
    setModalMode('add')
  }

  const openView = (employee) => {
    setActiveEmployeeId(employee.id)
    setModalMode('view')
  }

  const openEdit = (employee) => {
    setForm({
      name: employee.name,
      email: employee.email ?? '',
      department: employee.department,
      role: employee.role,
      status: employee.status,
      managerId: employee.managerId ?? '',
      branch: employee.branch ?? 'Bengaluru HQ',
      workMode: employee.workMode ?? 'Office',
    })
    setActiveEmployeeId(employee.id)
    setModalMode('edit')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const syncFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'All' || value === 'department') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const role = form.role.trim()

    if (!name || !role) {
      setNotice({ tone: 'error', message: 'Name and role are required.' })
      return
    }

    const payload = {
      name,
      email: form.email.trim() || defaultEmail(name),
      department: form.department,
      role,
      status: form.status,
      managerId: form.managerId || null,
      branch: form.branch,
      workMode: form.workMode,
    }

    if (modalMode === 'edit' && activeEmployeeId) {
      setEmployees((current) =>
        current.map((employee) =>
          employee.id === activeEmployeeId
            ? { ...employee, ...payload }
            : employee,
        ),
      )
      setNotice({ tone: 'success', message: `${name} was updated.` })
    } else {
      const maxId = employees.reduce((max, employee) => {
        const numeric = Number(String(employee.id).split('-')[1])
        return Number.isFinite(numeric) ? Math.max(max, numeric) : max
      }, 1000)

      setEmployees((current) => [
        {
          ...payload,
          id: `EMP-${maxId + 1}`,
          joinedOn: toISODate(),
        },
        ...current,
      ])
      setNotice({ tone: 'success', message: `${name} was added to the directory.` })
    }

    closeModal()
  }

  const filteredEmployees = visibleEmployees.filter((employee) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      [employee.name, employee.email, employee.id, employee.role, employee.department]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    const matchesStatus = status === 'All' || employee.status === status
    const matchesDepartment =
      department === 'All' || employee.department === department
    return matchesSearch && matchesStatus && matchesDepartment
  })

  const groupedEmployees = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'All employees', items: filteredEmployees }]
    }

    const groups = new Map()
    filteredEmployees.forEach((employee) => {
      const key =
        groupBy === 'branch'
          ? employee.branch ?? 'Unassigned branch'
          : employee.department ?? 'Unassigned department'
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(employee)
    })

    return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, items]) => ({ key, items }))
  }, [filteredEmployees, groupBy])

  const activeCount = visibleEmployees.filter(
    (employee) => employee.status === 'Active',
  ).length
  const onLeaveCount = visibleEmployees.filter(
    (employee) => employee.status === 'On Leave',
  ).length
  const departmentCount = new Set(
    visibleEmployees.map((employee) => employee.department),
  ).size

  const managerOptions = employees.filter(
    (employee) => employee.id !== activeEmployeeId,
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {isOrgRole ? 'Employee Directory' : 'My Team'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isOrgRole
              ? 'Browse and manage your organisation’s people.'
              : 'Your direct reports and their directory details.'}
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <UserPlus className="h-4 w-4" />
            Add employee
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
          label={isOrgRole ? 'Total employees' : 'Team members'}
          value={visibleEmployees.length}
          detail={isOrgRole ? 'Across all departments' : 'Direct reports'}
          icon={Users}
          accent="indigo"
        />
        <KpiCard
          label="Active"
          value={activeCount}
          detail={`${Math.round(
            (activeCount / Math.max(visibleEmployees.length, 1)) * 100,
          )}% of the directory`}
          icon={UserPlus}
          accent="emerald"
        />
        <KpiCard
          label="On leave"
          value={onLeaveCount}
          detail="Currently away"
          icon={Users}
          accent="amber"
        />
        <KpiCard
          label="Departments"
          value={departmentCount}
          detail={`${new Set(visibleEmployees.map((e) => e.branch)).size} branches`}
          icon={Building2}
          accent="sky"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {isOrgRole ? 'All employees' : 'Team directory'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredEmployees.length} of {visibleEmployees.length} records
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people, roles, IDs"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-56"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                syncFilter('status', event.target.value)
              }}
              aria-label="Filter by status"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All statuses' : option}
                </option>
              ))}
            </select>

            <select
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value)
                syncFilter('department', event.target.value)
              }}
              aria-label="Filter by department"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All departments</option>
              {departments.map((item) => (
                <option key={item.id ?? item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={groupBy}
              onChange={(event) => {
                setGroupBy(event.target.value)
                syncFilter('group', event.target.value)
              }}
              aria-label="Group employees"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-3 py-3 font-semibold">Department</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Manager</th>
                <th className="px-3 py-3 font-semibold">Branch</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No employees match these filters
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try a different search, status, or department.
                    </p>
                  </td>
                </tr>
              ) : (
                groupedEmployees.map((group) => (
                  <Fragment key={group.key}>
                    {groupBy !== 'none' ? (
                      <tr className="bg-slate-50/80">
                        <td
                          colSpan={7}
                          className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {group.key} · {group.items.length}
                        </td>
                      </tr>
                    ) : null}
                    {group.items.map((employee) => {
                      const manager = employees.find(
                        (item) => item.id === employee.managerId,
                      )
                      return (
                        <tr
                          key={employee.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={employee.name} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {employee.name}
                                </p>
                                <p className="truncate text-[11px] text-slate-500">
                                  {employee.id} · {employee.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-xs font-medium text-slate-600">
                            {employee.department}
                          </td>
                          <td className="px-3 py-3.5 text-xs text-slate-600">
                            {employee.role}
                          </td>
                          <td className="px-3 py-3.5 text-xs text-slate-600">
                            {manager?.name ?? '—'}
                          </td>
                          <td className="px-3 py-3.5 text-xs text-slate-600">
                            {employee.branch ?? '—'}
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusBadge status={employee.status} />
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openView(employee)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                              {canManage ? (
                                <button
                                  type="button"
                                  onClick={() => openEdit(employee)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'view'
            ? 'Employee details'
            : modalMode === 'edit'
              ? 'Edit employee'
              : 'Add employee'
        }
        description={
          modalMode === 'view'
            ? 'Profile, reporting line, and directory details.'
            : modalMode === 'edit'
              ? 'Update this employee record.'
              : 'Create a new employee record for the directory.'
        }
      >
        {modalMode === 'view' && activeEmployee ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={activeEmployee.name} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">
                  {activeEmployee.name}
                </p>
                <p className="text-xs text-slate-500">{activeEmployee.email}</p>
                <p className="font-mono text-[11px] text-slate-400">
                  {activeEmployee.id}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Department', activeEmployee.department],
                ['Role', activeEmployee.role],
                [
                  'Manager',
                  employees.find(
                    (item) => item.id === activeEmployee.managerId,
                  )?.name ?? '—',
                ],
                ['Branch', activeEmployee.branch ?? '—'],
                ['Work mode', activeEmployee.workMode ?? '—'],
                [
                  'Joined',
                  activeEmployee.joinedOn
                    ? formatDate(activeEmployee.joinedOn)
                    : '—',
                ],
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
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={activeEmployee.status} />
                </dd>
              </div>
            </dl>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => openEdit(activeEmployee)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit employee
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="employee-name"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Full name
                </label>
                <input
                  id="employee-name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Ananya Rao"
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="employee-email"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Work email
                </label>
                <input
                  id="employee-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@itshrms.com"
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="employee-role"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Role
                </label>
                <input
                  id="employee-role"
                  name="role"
                  type="text"
                  required
                  value={form.role}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer"
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="employee-department"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Department
                </label>
                <select
                  id="employee-department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                >
                  {departments.map((item) => (
                    <option key={item.id ?? item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="employee-manager"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Reporting manager
                </label>
                <select
                  id="employee-manager"
                  name="managerId"
                  value={form.managerId}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                >
                  <option value="">No manager</option>
                  {managerOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} · {employee.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="employee-branch"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Branch
                </label>
                <select
                  id="employee-branch"
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                >
                  {branches.map((branch) => (
                    <option key={branch.id ?? branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="employee-work-mode"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Work mode
                </label>
                <select
                  id="employee-work-mode"
                  name="workMode"
                  value={form.workMode}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                >
                  <option>Office</option>
                  <option>Hybrid</option>
                  <option>Remote</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="employee-status"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Status
                </label>
                <select
                  id="employee-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                >
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Exited</option>
                </select>
              </div>
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                {modalMode === 'edit' ? 'Save changes' : 'Add employee'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
